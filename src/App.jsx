import { useState, useRef, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import './App.css'
import MovableSticker from './components/MovableSticker'
import { loadPhotobook, savePhotobook } from './storage/photobookStorage'
import { flushSync } from 'react-dom'
import PhotobookExport from './components/PhotobookExport'
import { exportPhotobook } from './utils/exportPhotobook'
import PhotobookCover from './components/PhotobookCover'
import {
  stickerCatalog,
  stickerCategories,
} from './stickers/catalog'

const availableStickers = [
  ...stickerCatalog,
  { id: 'heart', label: 'Corazón', symbol: '❤️' },
  { id: 'star', label: 'Estrella', symbol: '⭐' },
  { id: 'flower', label: 'Flor', symbol: '🌸' },
]

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
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const saveQueueRef = useRef(Promise.resolve())
  const [isExporting, setIsExporting] = useState(false)
  const [exportPageWidth, setExportPageWidth] = useState(680)
  const exportRef = useRef(null)
  const photobookRef = useRef(null)
  const [coverNote, setCoverNote] = useState(
  'Nuestro último año, en recuerdos.'
)

  const selectedMemories = memories.filter((memory) =>
    selectedMemoryIds.includes(memory.id)
  )

  const currentPage = Math.min(photoBookPage, selectedMemories.length)
  const currentMemory = selectedMemories[currentPage - 1]
  const currentStickerPageId =
  currentPage === 0 ? 'cover' : currentMemory?.id
  const activeStickerCategory = stickerCategories.find(
  (category) => category.id === stickerCategory
)

const visibleStickers = availableStickers.filter((sticker) =>
  activeStickerCategory?.stickerIds.includes(sticker.id)
)
  const [stickerCategory, setStickerCategory] = useState('promo')

useEffect(() => {
  let cancelled = false

  async function restorePhotobook() {
    try {
      const saved = await loadPhotobook()

      if (cancelled) return

      if (saved) {
        setMemories(saved.memories ?? [])
        setSelectedMemoryIds(saved.selectedMemoryIds ?? [])
        setPageStickers(saved.pageStickers ?? {})
        setBookFormat(saved.bookFormat ?? 'A4')
        setCoverNote(
  saved.coverNote ?? 'Nuestro último año, en recuerdos.'
)
      }

      setIsStorageReady(true)
    } catch {
      if (!cancelled) {
        setStorageError(
          'No pudimos recuperar el fotolibro. Probá recargando la página.'
        )
      }
    }
  }

  restorePhotobook()

  return () => {
    cancelled = true
  }
}, [])
async function handleDownloadPhotobook() {
  if (isExporting || selectedMemories.length === 0) return

  const page = photobookRef.current?.querySelector(
    '.photobook-cover, .photobook-page'
  )

  try {
    flushSync(() => {
      setExportPageWidth(page?.getBoundingClientRect().width || 680)
      setIsExporting(true)
    })

    await exportPhotobook(exportRef.current, bookFormat)
  } catch (error) {
    console.error('Error al exportar el fotolibro:', error)
    alert('No pudimos generar el PDF. Probá nuevamente.')
  } finally {
    setIsExporting(false)
  }
}
useEffect(() => {
  if (!isStorageReady) return

  const timer = setTimeout(() => {
    const draft = {
     memories,
     selectedMemoryIds,
     pageStickers,
     bookFormat,
     coverNote,
    }

    saveQueueRef.current = saveQueueRef.current
      .then(() => savePhotobook(draft))
      .then(() => setStorageError(''))
      .catch(() => {
        setStorageError(
          'No pudimos guardar los cambios en este navegador.'
        )
      })
  }, 400)

  return () => clearTimeout(timer)
}, [
  isStorageReady,
  memories,
  selectedMemoryIds,
  pageStickers,
  bookFormat,
  coverNote,
])

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

function handleAddSticker(option) {
  if (!currentStickerPageId) return

  const pageId = currentStickerPageId
  const sticker = {
    id: crypto.randomUUID(),
    label: option.label,
    src: option.src,
    symbol: option.symbol,
    x: 10,
    y: 10,
  }

  setPageStickers((previous) => {
    const stickers = previous[pageId] || []
    if (stickers.length >= 10) return previous

    return {
      ...previous,
      [pageId]: [...stickers, sticker],
    }
  })

  setSelectedStickerId(sticker.id)
}

function handleMoveSticker(pageId, stickerId, x, y) {
  setPageStickers((previous) => ({
    ...previous,
    [pageId]: (previous[pageId] || []).map((sticker) =>
      sticker.id === stickerId
        ? { ...sticker, x, y }
        : sticker
    ),
  }))
}
if (!isStorageReady) {
  return (
    <main>
      <p role="status">
        {storageError || 'Cargando tus recuerdos…'}
      </p>
    </main>
  )
}
  return (
    <main>
      {storageError && <p role="alert">{storageError}</p>}
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
      <section
  ref={photobookRef}
  className="photobook"
  data-format={bookFormat}
>
          {currentPage === 0 ? (
        <PhotobookCover note={coverNote}>
  <div className="page-stickers">
    {(pageStickers.cover || []).map((sticker) => (
      <MovableSticker
        key={sticker.id}
        sticker={sticker}
        selected={selectedStickerId === sticker.id}
        onSelect={() => setSelectedStickerId(sticker.id)}
        onMove={(x, y) =>
          handleMoveSticker('cover', sticker.id, x, y)
        }
      />
    ))}
  </div>
</PhotobookCover>
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
                {(pageStickers[currentMemory.id] || []).map((sticker) => (
                  <MovableSticker
                    key={sticker.id}
                    sticker={sticker}
                    selected={selectedStickerId === sticker.id}
                    onSelect={() => setSelectedStickerId(sticker.id)}
                    onMove={(x, y) =>
                      handleMoveSticker(currentMemory.id, sticker.id, x, y)
                    }
                  />
                ))}
              </div>
            </figure>
          )}
          {currentPage === 0 && (
  <div className="cover-editor">
    <label htmlFor="cover-note">Tu frase para la portada</label>

    <textarea
      id="cover-note"
      value={coverNote}
      onChange={(event) => setCoverNote(event.target.value)}
      maxLength={100}
      rows={3}
      placeholder="Escribí un recuerdo o una frase de la promo"
      disabled={isExporting}
      aria-describedby="cover-note-counter"
    />

    <p id="cover-note-counter" className="caption-counter">
      {coverNote.length}/100 caracteres
    </p>
  </div>
)}
{currentStickerPageId && (
  <div className="sticker-picker">
    <p>
      {currentPage === 0
        ? 'Agregar sticker a la portada · Máximo 10'
        : 'Agregar sticker a esta página · Máximo 10'}
    </p>
   <div className="sticker-categories" aria-label="Categorías de stickers">
  {stickerCategories.map((category) => (
    <button
      key={category.id}
      type="button"
      className="sticker-category"
      aria-pressed={stickerCategory === category.id}
      onClick={() => setStickerCategory(category.id)}
    >
      {category.label}
    </button>
  ))}
</div>
   <div className="sticker-options">
  {visibleStickers.map((option) => (
    <button
      key={option.id}
      type="button"
      className="sticker-option"
      aria-label={`Agregar sticker ${option.label}`}
      title={option.label}
      disabled={
        isExporting ||
        (pageStickers[currentStickerPageId] || []).length >= 10
      }
      onClick={() => handleAddSticker(option)}
    >
      {option.src ? (
        <img src={option.src} alt="" draggable={false} />
      ) : (
        <span>{option.symbol}</span>
      )}
    </button>
  ))}
</div>

    {(pageStickers[currentStickerPageId] || []).some(
      (sticker) => sticker.id === selectedStickerId
    ) && (
      <button
        type="button"
        disabled={isExporting}
        onClick={() => {
          const pageId = currentStickerPageId

          setPageStickers((previous) => ({
            ...previous,
            [pageId]: (previous[pageId] || []).filter(
              (sticker) => sticker.id !== selectedStickerId
            ),
          }))

          setSelectedStickerId(null)
        }}
      >
        Quitar sticker seleccionado
      </button>
    )}
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

<div className="photobook-actions">
  <button
    type="button"
    disabled={isExporting || selectedMemories.length === 0}
    onClick={handleDownloadPhotobook}
  >
    {isExporting ? 'Preparando PDF…' : 'Descargar PDF'}
  </button>

  <button
    type="button"
    className="photobook-close"
    onClick={() => setShowPhotoBook(false)}
  >
    Cerrar fotolibro
  </button>
</div>
        </section>
      )}
      {isExporting && (
  <PhotobookExport
    exportRef={exportRef}
    bookFormat={bookFormat}
    memories={selectedMemories}
    pageStickers={pageStickers}
    pageWidth={exportPageWidth}
    coverNote={coverNote}
  />
)}
    </main>
  )
}

export default App