import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import imageCompression from 'browser-image-compression'
import './App.css'
import './BookEditor.css'

import BookEditor from './components/BookEditor'
import PhotobookExport from './components/PhotobookExport'
import { loadPhotobook, savePhotobook } from './storage/photobookStorage'
import { exportPhotobook } from './utils/exportPhotobook'

function recoverPages(saved) {
  if (Array.isArray(saved.bookPages)) {
    return saved.bookPages
  }

  const memories = saved.memories || []

  return (saved.selectedMemoryIds || [])
    .filter((id) =>
      memories.some((memory) => memory.id === id)
    )
    .map((id) => {
      const old = memories.find(
        (memory) => memory.id === id
      ).photoLayout

      return {
        id: crypto.randomUUID(),
        slots: [
          {
            memoryId: id,
            transform: old
              ? {
                  size: old.scale ?? 85,
                  rotation: old.rotation ?? 0,
                  x: Math.max(0, 7.5 + (old.x ?? 0)),
                  y: Math.max(0, 7.5 + (old.y ?? 0)),
                }
              : {},
          },
        ],
        stickers: saved.pageStickers?.[id] || [],
      }
    })
}

export default function App() {
  const [memories, setMemories] = useState([])
  const [bookPages, setBookPages] = useState([])
  const [coverStickers, setCoverStickers] = useState([])
  const [bookFormat, setBookFormat] = useState('A4')
  const [coverNote, setCoverNote] = useState(
    'Nuestro último año, en recuerdos.'
  )
  const [showBook, setShowBook] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [sizes, setSizes] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportWidth, setExportWidth] = useState(680)

  const fileRef = useRef(null)
  const exportRef = useRef(null)
  const editorRef = useRef(null)
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const saved = await loadPhotobook()

        if (cancelled) return

        if (saved) {
          setMemories(saved.memories || [])
          setBookPages(recoverPages(saved))

          setCoverStickers(
            saved.coverStickers ||
              saved.pageStickers?.cover ||
              []
          )

          setBookFormat(saved.bookFormat || 'A4')

          setCoverNote(
            saved.coverNote ??
              'Nuestro último año, en recuerdos.'
          )
        }

        setReady(true)
      } catch {
        if (!cancelled) {
          setError(
            'No pudimos recuperar el borrador. Probá recargando.'
          )
        }
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return

    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current
        .then(() =>
          savePhotobook({
            schemaVersion: 2,
            memories,
            bookPages,
            coverStickers,
            bookFormat,
            coverNote,
          })
        )
        .then(() => setError(''))
        .catch(() =>
          setError(
            'No pudimos guardar los cambios en este navegador.'
          )
        )
    }, 400)

    return () => clearTimeout(timer)
  }, [
    ready,
    memories,
    bookPages,
    coverStickers,
    bookFormat,
    coverNote,
  ])

  function clearPreview() {
    setPreview(null)
    setSizes(null)
    setCaption('')

    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  async function selectPhoto(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      alert('Elegí una imagen JPG, PNG o WebP.')
      event.target.value = ''
      return
    }

    setProcessing(true)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 800000 / (1024 * 1024),
        maxWidthOrHeight: 1600,
        useWebWorker: false,
      })

      if (compressed.size > 800000) {
        throw new Error('Imagen demasiado grande')
      }

      setPreview(
        await imageCompression.getDataUrlFromFile(
          compressed
        )
      )

      setSizes({
        original: Math.round(file.size / 1000),
        compressed: Math.round(compressed.size / 1000),
      })
    } catch {
      alert(
        'No pudimos procesar la foto. Probá con otra.'
      )
    } finally {
      setProcessing(false)
    }
  }

  function addMemory() {
    if (!preview || processing) return

    setMemories((previous) => [
      {
        id: crypto.randomUUID(),
        image: preview,
        caption: caption.trim(),
      },
      ...previous,
    ])

    clearPreview()
  }

  function removeMemory(id) {
    if (
      !window.confirm(
        '¿Borrar esta foto de Mis recuerdos y de las páginas que la usan?'
      )
    ) {
      return
    }

    setMemories((previous) =>
      previous.filter((memory) => memory.id !== id)
    )

    setBookPages((previous) =>
      previous.map((page) => ({
        ...page,
        slots: page.slots.map((slot) =>
          slot.memoryId === id
            ? { memoryId: null, transform: {} }
            : slot
        ),
      }))
    )
  }

  async function download() {
    if (exporting) return

    try {
      const canvas = editorRef.current?.querySelector(
        '.photobook-cover, .book-canvas'
      )

      flushSync(() => {
        setExportWidth(
          canvas?.getBoundingClientRect().width || 680
        )
        setExporting(true)
      })

      await exportPhotobook(
        exportRef.current,
        bookFormat
      )
    } catch {
      alert(
        'No pudimos generar el PDF. Probá nuevamente.'
      )
    } finally {
      setExporting(false)
    }
  }

  if (!ready) {
    return (
      <main>
        <p role="status">
          {error || 'Cargando tus recuerdos…'}
        </p>
      </main>
    )
  }

  return (
    <main>
      {error && <p role="alert">{error}</p>}

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
        <p>
          Guardemos los momentos que queremos recordar.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={processing || exporting}
          onChange={selectPhoto}
        />

        <button
          type="button"
          disabled={processing || exporting}
          onClick={() => fileRef.current?.click()}
        >
          {processing
            ? 'Procesando foto…'
            : 'Subir foto'}
        </button>

        {preview && (
          <div>
            <img
              className="book-upload-preview"
              src={preview}
              alt="Vista previa de la foto seleccionada"
            />

            <label htmlFor="photo-caption">
              Descripción de la foto
            </label>

            <input
              id="photo-caption"
              value={caption}
              maxLength={150}
              disabled={processing}
              onChange={(event) =>
                setCaption(event.target.value)
              }
            />

            <p className="caption-counter">
              {caption.length}/150 caracteres
            </p>

            {sizes && (
              <p>
                Original: {sizes.original} KB ·
                Comprimida: {sizes.compressed} KB
              </p>
            )}

            <button
              type="button"
              disabled={processing || exporting}
              onClick={addMemory}
            >
              Agregar a recuerdos
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={clearPreview}
            >
              Quitar foto
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={processing || exporting}
          onClick={() => setShowBook(true)}
        >
          Abrir mi fotolibro
        </button>
      </section>

      <section>
        <h2>Mis recuerdos</h2>

        {memories.length === 0 ? (
          <p>
            Agregá fotos y después elegilas dentro
            de cada página.
          </p>
        ) : (
          <div className="book-library">
            {memories.map((memory) => (
              <figure key={memory.id}>
                <img
                  src={memory.image}
                  alt={
                    memory.caption ||
                    'Recuerdo de la promo'
                  }
                />

                {memory.caption && (
                  <figcaption>
                    {memory.caption}
                  </figcaption>
                )}

                <button
                  type="button"
                  disabled={exporting}
                  onClick={() =>
                    removeMemory(memory.id)
                  }
                >
                  Borrar de Mis recuerdos
                </button>
              </figure>
            ))}
          </div>
        )}
      </section>

      {showBook && (
        <div ref={editorRef}>
          <BookEditor
            memories={memories}
            bookPages={bookPages}
            setBookPages={setBookPages}
            coverStickers={coverStickers}
            setCoverStickers={setCoverStickers}
            bookFormat={bookFormat}
            setBookFormat={setBookFormat}
            coverNote={coverNote}
            setCoverNote={setCoverNote}
            isExporting={exporting}
            onDownload={download}
            onClose={() => setShowBook(false)}
          />
        </div>
      )}

      {exporting && (
        <PhotobookExport
          exportRef={exportRef}
          bookFormat={bookFormat}
          memories={memories}
          bookPages={bookPages}
          coverStickers={coverStickers}
          coverNote={coverNote}
          pageWidth={exportWidth}
        />
      )}
    </main>
  )
}