import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import './App.css'

function App() {
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoSizes, setPhotoSizes] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [photoCaption, setPhotoCaption] = useState('')
  const [memories, setMemories] = useState([])
  const [showPhotoBook, setShowPhotoBook] = useState(false)
  const [selectedMemoryIds, setSelectedMemoryIds] = useState([])
  const [photoBookPage, setPhotoBookPage] = useState(0)
  const [pageStickers, setPageStickers] = useState({})
  const [bookFormat, setBookFormat] = useState('A4')
  const fileInputRef = useRef(null)

  const selectedMemories = memories.filter((memory) =>
    selectedMemoryIds.includes(memory.id)
  )

  const currentPage = Math.min(photoBookPage, selectedMemories.length)
  const currentMemory = selectedMemories[currentPage - 1]

  function clearPhotoSelection() {
    setPhotoPreview(null)
    setPhotoSizes(null)
    setPhotoCaption('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      alert('Elegí una imagen JPG, PNG o WebP.')
      event.target.value = ''
      return
    }

    setIsProcessing(true)

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 800000 / (1024 * 1024),
        maxWidthOrHeight: 1600,
        useWebWorker: false,
      })

      if (compressedFile.size > 800000) {
        alert('No pudimos reducir esta foto a 800 KB. Probá con otra.')
        return
      }

      const preview =
        await imageCompression.getDataUrlFromFile(compressedFile)

      setPhotoSizes({
        original: Math.round(file.size / 1000),
        compressed: Math.round(compressedFile.size / 1000),
      })

      setPhotoPreview(preview)
    } catch {
      alert('No pudimos procesar la foto. Probá con otra imagen.')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleAddMemory() {
    if (!photoPreview || isProcessing) return

    const memory = {
      id: crypto.randomUUID(),
      image: photoPreview,
      caption: photoCaption.trim(),
    }

    setMemories((previous) => [memory, ...previous])
    clearPhotoSelection()
  }

  function handleRemoveMemory(memoryId) {
    setMemories((previous) =>
      previous.filter((memory) => memory.id !== memoryId)
    )

    setSelectedMemoryIds((previous) =>
      previous.filter((id) => id !== memoryId)
    )

    setPageStickers((previous) => {
      const updated = { ...previous }
      delete updated[memoryId]
      return updated
    })
  }

  function handleToggleMemory(memoryId, checked) {
    setSelectedMemoryIds((previous) =>
      checked
        ? [...new Set([...previous, memoryId])]
        : previous.filter((id) => id !== memoryId)
    )
  }

  function handleAddSticker(sticker) {
    if (!currentMemory) return

    const pageId = currentMemory.id

    setPageStickers((previous) => {
      const stickers = previous[pageId] || []
      if (stickers.length >= 10) return previous

      return {
        ...previous,
        [pageId]: [...stickers, sticker],
      }
    })
  }

  return (
    <main>
      <header>
        <img
          src="/marca/logo-literatura.jpg"
          alt="Logo de Literatura de la promo"
          width="80"
          height="80"
        />
        <p>Normal · Literatura · 6TO 3RA</p>
        <h1>Archivo 26</h1>
        <p>Solo para la promo</p>
      </header>

      <section>
        <h2>Nuestro último año, en un solo lugar.</h2>
        <p>Guardemos los momentos que queremos recordar.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={isProcessing}
          onChange={handlePhotoChange}
        />

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
        >
          {isProcessing ? 'Procesando foto…' : 'Subir foto'}
        </button>

        {photoPreview && (
          <div>
            <img
              src={photoPreview}
              alt="Vista previa de la foto seleccionada"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '320px',
                objectFit: 'contain',
                marginTop: '16px',
                borderRadius: '12px',
              }}
            />

            <label htmlFor="photo-caption">
              Descripción de la foto
            </label>

            <input
              id="photo-caption"
              type="text"
              value={photoCaption}
              onChange={(event) => setPhotoCaption(event.target.value)}
              maxLength={150}
              placeholder="Por ejemplo: Último primer día"
              disabled={isProcessing}
            />

            <p className="caption-counter">
              {photoCaption.length}/150 caracteres
            </p>

            {photoSizes && (
              <p>
                Original: {photoSizes.original} KB · Comprimida:{' '}
                {photoSizes.compressed} KB
              </p>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleAddMemory}
            >
              Agregar a recuerdos
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={clearPhotoSelection}
            >
              Quitar foto
            </button>
          </div>
        )}
        <label htmlFor="book-format">Tamaño del fotolibro</label>

<select
  id="book-format"
  value={bookFormat}
  onChange={(event) => setBookFormat(event.target.value)}
  disabled={showPhotoBook}
>
  <option value="A4">A4 · 21 × 29,7 cm</option>
  <option value="A5">A5 · 14,8 × 21 cm</option>
</select>
        <button
          type="button"
          disabled={selectedMemories.length === 0 || isProcessing}
          onClick={() => {
            setPhotoBookPage(0)
            setShowPhotoBook(true)
          }}
        >
          Crear mi fotolibro
        </button>
      </section>

      <section>
        <h2>Últimos recuerdos</h2>

        {memories.length === 0 ? (
          <p>Acá aparecerán las fotos de nuestra promo.</p>
        ) : (
          memories.map((memory) => (
            <figure key={memory.id}>
              <img
                src={memory.image}
                alt={memory.caption || 'Recuerdo de la promo'}
                style={{
                  width: '100%',
                  maxHeight: '320px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
              />

              {memory.caption && (
                <figcaption>{memory.caption}</figcaption>
              )}

              <label>
                <input
                  type="checkbox"
                  checked={selectedMemoryIds.includes(memory.id)}
                  onChange={(event) =>
                    handleToggleMemory(memory.id, event.target.checked)
                  }
                />
                Incluir en mi fotolibro
              </label>

              <button
                type="button"
                onClick={() => handleRemoveMemory(memory.id)}
              >
                Quitar recuerdo
              </button>
            </figure>
          ))
        )}
      </section>

      {showPhotoBook && (
       <section className="photobook" data-format={bookFormat}>
          {currentPage === 0 ? (
            <div className="photobook-cover">
              <p className="photobook-cover-school">
                Normal · Literatura · 6TO 3RA
              </p>

              <h2>Archivo 26</h2>

              <p className="photobook-cover-subtitle">
                Mi último año, en recuerdos.
              </p>

              <img
                src="/marca/logo-literatura.jpg"
                alt="Logo de Literatura de la promo"
                className="photobook-cover-logo"
              />

              <p>Promo 2026</p>
            </div>
          ) : (
            <figure
              key={currentMemory.id}
              className="photobook-page"
            >
              <img
                src={currentMemory.image}
                alt={currentMemory.caption || 'Recuerdo de la promo'}
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                }}
              />

              {currentMemory.caption && (
                <figcaption>{currentMemory.caption}</figcaption>
              )}

              <div className="page-stickers">
                {(pageStickers[currentMemory.id] || []).map(
                  (sticker, index) => (
                   <button
  key={index}
  type="button"
  className="placed-sticker"
  aria-label={`Quitar sticker ${sticker}`}
  title="Quitar sticker"
  onClick={() => {
    const pageId = currentMemory.id

    setPageStickers((previous) => ({
      ...previous,
      [pageId]: (previous[pageId] || []).filter(
        (_, stickerIndex) => stickerIndex !== index
      ),
    }))
  }}
>
  {sticker}
</button>
                  )
                )}
              </div>
            </figure>
          )}

          {currentMemory && (
            <div className="sticker-picker">
              <p>Agregar sticker a esta página · Máximo 10</p>

              {['❤️', '⭐', '🌸'].map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  aria-label={`Agregar sticker ${sticker}`}
                  disabled={
                    (pageStickers[currentMemory.id] || []).length >= 10
                  }
                  onClick={() => handleAddSticker(sticker)}
                >
                  {sticker}
                </button>
              ))}
            </div>
          )}

          <div className="photobook-navigation">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPhotoBookPage(currentPage - 1)}
            >
              Anterior
            </button>

            <p aria-live="polite">
              {currentPage === 0
                ? 'Portada'
                : `Página ${currentPage} de ${selectedMemories.length}`}
            </p>

            <button
              type="button"
              disabled={currentPage === selectedMemories.length}
              onClick={() => setPhotoBookPage(currentPage + 1)}
            >
              Siguiente
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPhotoBook(false)}
          >
            Cerrar vista del fotolibro
          </button>
        </section>
      )}
    </main>
  )
}

export default App