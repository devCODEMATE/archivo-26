import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import imageCompression from 'browser-image-compression'

import './App.css'
import './BookEditor.css'
import './CoverDesign.css'
import './AppScreens.css'

import BookEditor from './components/BookEditor'
import PhotobookExport from './components/PhotobookExport'
import { loadPhotobook, savePhotobook } from './storage/photobookStorage'
import { exportPhotobook } from './utils/exportPhotobook'
import { createId } from './utils/createId'
import { initializeBookPages } from './utils/initializeBookPages'
import { TrashIcon } from './components/EditableItem'

const navigation = [
  { id: 'home', label: 'Inicio' },
  { id: 'memories', label: 'Mis recuerdos' },
  { id: 'book', label: 'Mi fotolibro' },
]

function NavigationIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'home' && (
        <>
          <path d="m3 10 9-7 9 7v10H3Z" />
          <path d="M9 20v-7h6v7" />
        </>
      )}

      {name === 'memories' && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" />
          <path d="m3 17 6-6 4 4 3-3 5 5" />
        </>
      )}

      {name === 'book' && (
        <>
          <path d="M12 5v16" />
          <path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" />
        </>
      )}
    </svg>
  )
}

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
        id: createId(),
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
  const [screen, setScreen] = useState('home')
  const [memories, setMemories] = useState([])
  const [bookPages, setBookPages] = useState([])
  const [coverStickers, setCoverStickers] = useState([])
  const [backStickers, setBackStickers] = useState([])
  const [bookFormat, setBookFormat] = useState('A4')
  const [coverNote, setCoverNote] = useState(
    'Nuestro último año, en recuerdos.'
  )

  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [sizes, setSizes] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportWidth, setExportWidth] = useState(680)

  const [selectingMemories, setSelectingMemories] = useState(false)
  const [selectedLibraryIds, setSelectedLibraryIds] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [notice, setNotice] = useState('')

  const fileRef = useRef(null)
  const exportRef = useRef(null)
  const editorRef = useRef(null)
  const headingRef = useRef(null)
  const uploadRef = useRef(null)
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const saved = await loadPhotobook()

        if (cancelled) return

        if (saved) {
          setMemories(saved.memories || [])
          setBackStickers(saved.backStickers || [])

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

        setBookPages(
          initializeBookPages(
            saved ? recoverPages(saved) : [],
            saved?.standardPagesInitialized === true
          )
        )

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
            standardPagesInitialized: true,
            memories,
            bookPages,
            coverStickers,
            backStickers,
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
    backStickers,
    bookFormat,
    coverNote,
  ])

  useEffect(() => {
    if (!ready) return

    headingRef.current?.focus({ preventScroll: true })

    window.scrollTo({
      top: 0,
      behavior: 'instant',
    })
  }, [screen, ready])

  function navigate(next) {
    if (exporting || processing || next === screen) return

    setScreen(next)
    setSelectingMemories(false)
    setSelectedLibraryIds([])
    setNotice('')
  }

  function clearPreview() {
    setPreview(null)
    setSizes(null)
    setCaption('')
    setUploadError('')

    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  function openUpload() {
    if (processing || exporting) return

    setNotice('')
    uploadRef.current?.showModal()
  }

  function closeUpload() {
    if (processing || exporting) return

    uploadRef.current?.close()
    clearPreview()
  }

  async function selectPhoto(event) {
    const file = event.target.files?.[0]

    if (!file || processing) return

    setUploadError('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Elegí una imagen JPG, PNG o WebP.')
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
        await imageCompression.getDataUrlFromFile(compressed)
      )

      setSizes({
        original: Math.round(file.size / 1000),
        compressed: Math.round(compressed.size / 1000),
      })
    } catch {
      setUploadError(
        'No pudimos procesar la foto. Probá con otra.'
      )
    } finally {
      setProcessing(false)

      if (fileRef.current) {
        fileRef.current.value = ''
      }
    }
  }

  function addMemory(event) {
    event.preventDefault()

    if (!preview || processing || exporting) return

    const memory = {
      id: createId(),
      image: preview,
      caption: caption.trim(),
    }

    setMemories((previous) => [memory, ...previous])

    closeUpload()

    if (screen === 'home') {
      setScreen('memories')
    }

    setNotice('Foto agregada a Mis recuerdos.')
  }

  function removeSelectedMemories() {
    if (exporting || selectedLibraryIds.length === 0) return

    const confirmed = window.confirm(
      `¿Eliminar ${selectedLibraryIds.length} foto(s) de Mis recuerdos y de las páginas que las usan?`
    )

    if (!confirmed) return

    const idsToRemove = new Set(selectedLibraryIds)

    setMemories((previous) =>
      previous.filter(
        (memory) => !idsToRemove.has(memory.id)
      )
    )

    setBookPages((previous) =>
      previous.map((page) => ({
        ...page,
        slots: page.slots.map((slot) =>
          idsToRemove.has(slot.memoryId)
            ? { memoryId: null, transform: {} }
            : slot
        ),
      }))
    )

    setSelectedLibraryIds([])
    setSelectingMemories(false)
    setNotice('Fotos eliminadas.')
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
    } catch (exportError) {
      console.error(exportError)

      alert(
        'No pudimos generar el PDF. Probá nuevamente.'
      )
    } finally {
      setExporting(false)
    }
  }

  if (!ready) {
    return (
      <main className="app-shell">
        <p role="status">
          {error || 'Cargando tus recuerdos…'}
        </p>
      </main>
    )
  }

  const busy = processing || exporting

  const title =
    screen === 'home'
      ? 'Nuestro último año, en un solo lugar.'
      : screen === 'memories'
        ? 'Mis recuerdos'
        : 'Mi fotolibro'

  return (
    <>
      <main className="app-shell">
        <header className="app-topbar">
          <button
            type="button"
            className="app-brand"
            onClick={() => navigate('home')}
            disabled={busy}
            aria-label="Archivo 26, ir al inicio"
          >
            <img
              src="/marca/logo-literatura.jpg"
              alt=""
              width="48"
              height="48"
            />

            <span>
              Archivo 26
              <small>
                Normal · Literatura · 6TO 3RA
              </small>
            </span>
          </button>

          <nav
            className="app-navigation"
            aria-label="Navegación principal"
          >
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                aria-current={
                  screen === item.id ? 'page' : undefined
                }
                onClick={() => navigate(item.id)}
              >
                <NavigationIcon name={item.id} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <p className="app-alert" role="alert">
            {error}
          </p>
        )}

        <p className="app-notice" role="status">
          {notice}
        </p>

        <div className="app-screen-heading">
          <div>
            <p className="app-eyebrow">
              {screen === 'home'
                ? 'Solo para la promo'
                : 'Archivo 26'}
            </p>

            <h1 ref={headingRef} tabIndex={-1}>
              {title}
            </h1>
          </div>

          {screen !== 'home' && (
            <button
              className="app-primary"
              type="button"
              disabled={busy}
              onClick={openUpload}
            >
              + Agregar foto
            </button>
          )}
        </div>

        {screen === 'home' && (
          <div className="app-home">
            <section
              className="app-welcome"
              aria-label="Bienvenida"
            >
              <p>
                Guardemos los momentos que queremos recordar.
              </p>

              <div className="app-home-actions">
                <button
                  className="app-primary"
                  type="button"
                  onClick={openUpload}
                >
                  Subir foto
                </button>

                <button
                  className="app-secondary"
                  type="button"
                  onClick={() => navigate('book')}
                >
                  Abrir mi fotolibro
                </button>
              </div>
            </section>

            <div className="app-destinations">
              <button
                className="app-destination"
                type="button"
                onClick={() => navigate('memories')}
              >
                <NavigationIcon name="memories" />
                <strong>Mis recuerdos</strong>

                <span>
                  {memories.length}{' '}
                  {memories.length === 1
                    ? 'foto guardada'
                    : 'fotos guardadas'}
                </span>

                <span>Ver mis fotos →</span>
              </button>

              <button
                className="app-destination"
                type="button"
                onClick={() => navigate('book')}
              >
                <NavigationIcon name="book" />
                <strong>Mi fotolibro</strong>

                <span>
                  {bookPages.length} páginas interiores ·{' '}
                  {bookFormat}
                </span>

                <span>Elegir fotos y decorar →</span>
              </button>
            </div>

            <p className="app-local-note">
              Tu borrador se guarda en este navegador y
              dispositivo.
            </p>
          </div>
        )}

        {screen === 'memories' && (
          <div
            className="app-memories"
            role="region"
            aria-label="Galería de recuerdos"
          >
            <div className="memories-toolbar">
              <p>
                {memories.length}{' '}
                {memories.length === 1 ? 'foto' : 'fotos'}
              </p>

              {memories.length > 0 && (
                <div className="memories-tools">
                  {selectingMemories && (
                    <button
                      type="button"
                      className="memories-delete"
                      disabled={
                        busy ||
                        selectedLibraryIds.length === 0
                      }
                      onClick={removeSelectedMemories}
                      aria-label={`Eliminar ${selectedLibraryIds.length} fotos seleccionadas`}
                      title="Eliminar seleccionadas"
                    >
                      <TrashIcon />
                      <span>
                        {selectedLibraryIds.length}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="memories-select"
                    disabled={busy}
                    aria-pressed={selectingMemories}
                    onClick={() => {
                      setSelectingMemories(
                        (previous) => !previous
                      )
                      setSelectedLibraryIds([])
                    }}
                  >
                    {selectingMemories
                      ? 'Cancelar'
                      : 'Seleccionar'}
                  </button>
                </div>
              )}
            </div>

            {memories.length === 0 ? (
              <div className="app-empty">
                <NavigationIcon name="memories" />

                <h2>
                  Tu primer recuerdo empieza acá
                </h2>

                <p>
                  Agregá una foto. Después podés elegirla
                  dentro del fotolibro.
                </p>

                <button
                  className="app-primary"
                  type="button"
                  onClick={openUpload}
                >
                  Agregar mi primera foto
                </button>
              </div>
            ) : (
              <div className="book-library app-library">
                {memories.map((memory) => (
                  <figure
                    key={memory.id}
                    className="memory-card"
                    data-selected={selectedLibraryIds.includes(
                      memory.id
                    )}
                  >
                    {selectingMemories && (
                      <label className="memory-check">
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={selectedLibraryIds.includes(
                            memory.id
                          )}
                          aria-label={`Seleccionar ${
                            memory.caption ||
                            'foto de la promo'
                          }`}
                          onChange={(event) => {
                            const checked =
                              event.target.checked

                            setSelectedLibraryIds(
                              (previous) =>
                                checked
                                  ? [...previous, memory.id]
                                  : previous.filter(
                                      (id) =>
                                        id !== memory.id
                                    )
                            )
                          }}
                        />
                      </label>
                    )}

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
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conserva la página del editor al cambiar de pantalla. */}
        <div
          className="app-editor"
          ref={editorRef}
          hidden={screen !== 'book'}
        >
          <BookEditor
            memories={memories}
            bookPages={bookPages}
            setBookPages={setBookPages}
            coverStickers={coverStickers}
            setCoverStickers={setCoverStickers}
            backStickers={backStickers}
            setBackStickers={setBackStickers}
            bookFormat={bookFormat}
            setBookFormat={setBookFormat}
            coverNote={coverNote}
            setCoverNote={setCoverNote}
            isExporting={exporting}
            onDownload={download}
            onClose={() => navigate('home')}
          />
        </div>

        {exporting && (
          <PhotobookExport
            exportRef={exportRef}
            bookFormat={bookFormat}
            memories={memories}
            bookPages={bookPages}
            coverStickers={coverStickers}
            backStickers={backStickers}
            coverNote={coverNote}
            pageWidth={exportWidth}
          />
        )}

     <footer className="app-footer">
  <div className="footer-main">
    <div className="footer-identity">
      <div className="footer-signature">
        <a
          className="footer-brand"
          href="https://github.com/devCODEMATE"
          target="_blank"
          rel="noopener noreferrer"
        >
          {'<CodeMate>'}
        </a>

        <span className="footer-author">by Flo</span>
      </div>

      <p className="footer-tagline">
        Building the future, one line at a time.
      </p>
    </div>

    <nav
      className="footer-socials"
      aria-label="Redes de CodeMate"
    >
      <a
        href="https://github.com/devCODEMATE"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub de CodeMate, abre en otra pestaña"
        title="GitHub"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 19c-4.3 1.4-4.3-2.5-6-3" />
          <path d="M15 22v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.9a5.4 5.4 0 0 0-1.5-3.7 5 5 0 0 0-.1-3.7s-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C5.1.7 3.9 1.1 3.9 1.1a5 5 0 0 0-.1 3.7 5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.2 6.6 6.2 6.9a3.4 3.4 0 0 0-.9 2.7V22" />
        </svg>
      </a>

      <a
        href="https://www.instagram.com/dev.codemate/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram de CodeMate, abre en otra pestaña"
        title="Instagram"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle
            cx="17.5"
            cy="6.5"
            r="1"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      </a>
    </nav>
  </div>

  <p className="footer-copyright">
    © 2026 CodeMate · Flo. Diseño y desarrollo.
  </p>
</footer>
      </main>

      <dialog
        className="app-upload-dialog"
        ref={uploadRef}
        aria-labelledby="upload-title"
        onCancel={(event) => {
          if (busy) {
            event.preventDefault()
          } else {
            clearPreview()
          }
        }}
      >
        <form onSubmit={addMemory}>
          <div className="app-dialog-heading">
            <h2 id="upload-title">
              Agregar un recuerdo
            </h2>

            <button
              type="button"
              className="app-dialog-close"
              disabled={busy}
              onClick={closeUpload}
              aria-label="Cerrar panel de foto"
            >
              ×
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            disabled={busy}
            onChange={selectPhoto}
          />

          <button
            type="button"
            className="app-secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {processing
              ? 'Procesando foto…'
              : preview
                ? 'Elegir otra foto'
                : 'Elegir una foto'}
          </button>

          {processing && (
            <p role="status">
              Estamos preparando tu foto…
            </p>
          )}

          {uploadError && (
            <p className="app-alert" role="alert">
              {uploadError}
            </p>
          )}

          {preview && (
            <>
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
                disabled={busy}
                placeholder="Por ejemplo: Último primer día"
                aria-describedby="caption-count"
                onChange={(event) =>
                  setCaption(event.target.value)
                }
              />

              <p
                id="caption-count"
                className="caption-counter"
              >
                {caption.length}/150 caracteres
              </p>

              {sizes && (
                <p className="app-photo-sizes">
                  Original: {sizes.original} KB ·
                  Comprimida: {sizes.compressed} KB
                </p>
              )}
            </>
          )}

          <div className="app-dialog-actions">
            <button
              className="app-secondary"
              type="button"
              disabled={busy}
              onClick={closeUpload}
            >
              Cancelar
            </button>

            <button
              className="app-primary"
              type="submit"
              disabled={busy || !preview}
            >
              Guardar recuerdo
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}