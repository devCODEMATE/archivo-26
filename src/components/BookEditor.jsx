import { useRef, useState } from 'react'
import PhotobookCover from './PhotobookCover'
import BookPage from './BookPage'
import EditableItem, { TrashIcon } from './EditableItem'
import { stickerCatalog, stickerCategories } from '../stickers/catalog'

const options = [
  ...stickerCatalog,
  { id: 'heart', label: 'Corazón', symbol: '❤️' },
  { id: 'star', label: 'Estrella', symbol: '⭐' },
  { id: 'flower', label: 'Flor', symbol: '🌸' },
]

function LayoutChoices({ value, onChange }) {
  return (
    <div
      className="book-layout-choices"
      aria-label="Fotos en esta página"
    >
      {[1, 2, 3, 4, 5].map((count) => (
        <button
          key={count}
          type="button"
          aria-pressed={value === count}
          onClick={() => onChange(count)}
          aria-label={`${count} fotos en esta página`}
        >
          <span
            className="book-layout-mini"
            data-layout={count}
            aria-hidden="true"
          >
            {Array.from({ length: count }, (_, index) => (
              <i key={index} />
            ))}
          </span>
          {count}
        </button>
      ))}
    </div>
  )
}

export default function BookEditor({
  memories,
  bookPages,
  setBookPages,
  coverStickers,
  setCoverStickers,
  bookFormat,
  setBookFormat,
  coverNote,
  setCoverNote,
  isExporting,
  onDownload,
  onClose,
}) {
  const [position, setPosition] = useState(0)
  const [selected, setSelected] = useState(null)
  const [choosing, setChoosing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState(
    stickerCategories[0]?.id
  )

  const chooserRef = useRef(null)
  const pageIndex = Math.min(position, bookPages.length)
  const page = bookPages[pageIndex - 1]

  const stickers =
    pageIndex === 0 ? coverStickers : page.stickers || []

  const active =
    selected?.type === 'sticker'
      ? stickers.find((item) => item.id === selected.id)
      : selected?.type === 'photo'
        ? page?.slots[selected.index]?.transform || {}
        : null

  function changePage(updater) {
    setBookPages((previous) =>
      previous.map((item) =>
        item.id === page.id ? updater(item) : item
      )
    )
  }

  function changeStickers(updater) {
    if (pageIndex === 0) {
      setCoverStickers(updater)
    } else {
      changePage((item) => ({
        ...item,
        stickers: updater(item.stickers || []),
      }))
    }
  }

  function changePhoto(index, changes) {
    changePage((item) => ({
      ...item,
      slots: item.slots.map((slot, i) =>
        i === index
          ? {
              ...slot,
              transform: {
                ...slot.transform,
                ...changes,
              },
            }
          : slot
      ),
    }))
  }

  function selectPhoto(index) {
    setChoosing(index)
    setSelected(null)

    requestAnimationFrame(() =>
      chooserRef.current?.focus()
    )
  }

  function layout(count) {
    changePage((item) => ({
      ...item,
      slots: Array.from(
        { length: count },
        (_, index) =>
          item.slots[index] || {
            memoryId: null,
            transform: {},
          }
      ),
    }))

    setSelected(null)
    setChoosing(null)
  }

  function addPage(count) {
    setBookPages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        slots: Array.from({ length: count }, () => ({
          memoryId: null,
          transform: {},
        })),
        stickers: [],
      },
    ])

    setPosition(bookPages.length + 1)
    setSelected(null)
    setAdding(false)
    setChoosing(null)
  }

  function navigate(next) {
    setPosition(next)
    setSelected(null)
    setChoosing(null)
    setAdding(false)
  }

  function removePhoto(index) {
    changePage((item) => ({
      ...item,
      slots: item.slots.map((slot, i) =>
        i === index
          ? { memoryId: null, transform: {} }
          : slot
      ),
    }))

    setSelected(null)
  }

  function stickerLayer() {
    return (
      <div className="book-sticker-layer">
        {stickers.map((item) => (
          <EditableItem
            key={item.id}
            item={item}
            selected={
              selected?.type === 'sticker' &&
              selected.id === item.id
            }
            onSelect={() =>
              setSelected({
                type: 'sticker',
                id: item.id,
              })
            }
            onChange={(changes) =>
              changeStickers((previous) =>
                previous.map((old) =>
                  old.id === item.id
                    ? { ...old, ...changes }
                    : old
                )
              )
            }
            onRemove={() => {
              changeStickers((previous) =>
                previous.filter(
                  (old) => old.id !== item.id
                )
              )
              setSelected(null)
            }}
          />
        ))}
      </div>
    )
  }

  function precise(changes) {
    if (selected.type === 'photo') {
      changePhoto(selected.index, changes)
    } else {
      changeStickers((previous) =>
        previous.map((old) =>
          old.id === selected.id
            ? { ...old, ...changes }
            : old
        )
      )
    }
  }

  const visible = options.filter((item) =>
    stickerCategories
      .find((c) => c.id === category)
      ?.stickerIds.includes(item.id)
  )

  const incomplete = bookPages.some((item) =>
    item.slots.some(
      (slot) =>
        !memories.some(
          (memory) => memory.id === slot.memoryId
        )
    )
  )

  return (
    <section
      className="photobook book-editor"
      data-format={bookFormat}
    >
      <fieldset
        className="book-editor-lock"
        disabled={isExporting}
      >
        <div className="book-editor-top">
          <label>
            Tamaño{' '}
            <select
              value={bookFormat}
              onChange={(event) =>
                setBookFormat(event.target.value)
              }
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setAdding(!adding)}
          >
            ＋ Agregar página
          </button>
        </div>

        {adding && (
          <div className="book-panel">
            <p>
              ¿Cuántas fotos tendrá la página nueva?
            </p>
            <LayoutChoices onChange={addPage} />
          </div>
        )}

        {page && (
          <div className="book-panel">
            <p>Distribución de esta página</p>

            <LayoutChoices
              value={page.slots.length}
              onChange={layout}
            />

            <small>
              Si reducís los espacios, las fotos
              retiradas siguen en Mis recuerdos.
            </small>
          </div>
        )}

        <p className="book-help">
          Tocá una foto o sticker. Arrastrá para mover,
          ↘ para tamaño y ↻ para girar.
        </p>

        {pageIndex === 0 ? (
          <PhotobookCover note={coverNote}>
            {stickerLayer()}
          </PhotobookCover>
        ) : (
          <BookPage
            page={page}
            memories={memories}
            selected={selected}
            onSelect={setSelected}
            onChoose={selectPhoto}
            onPhotoChange={changePhoto}
            onRemove={removePhoto}
          >
            {stickerLayer()}
          </BookPage>
        )}

        {choosing !== null && (
          <div
            ref={chooserRef}
            tabIndex={-1}
            className="book-panel book-photo-chooser"
          >
            <h3>Elegí una foto para este espacio</h3>

            <button
              type="button"
              onClick={() => setChoosing(null)}
            >
              Cerrar selección
            </button>

            {memories.length === 0 && (
              <p>
                Primero agregá fotos a Mis recuerdos.
              </p>
            )}

            <div className="book-photo-options">
              {memories.map((memory) => (
                <button
                  type="button"
                  key={memory.id}
                  onClick={() => {
                    changePage((item) => ({
                      ...item,
                      slots: item.slots.map(
                        (slot, index) =>
                          index === choosing
                            ? {
                                memoryId: memory.id,
                                transform: {},
                              }
                            : slot
                      ),
                    }))

                    setSelected({
                      type: 'photo',
                      index: choosing,
                    })
                    setChoosing(null)
                  }}
                >
                  <img
                    src={memory.image}
                    alt={
                      memory.caption ||
                      'Foto sin descripción'
                    }
                  />
                  <span>
                    {memory.caption ||
                      'Sin descripción'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pageIndex === 0 && (
          <label className="book-cover-label">
            Tu frase para la portada
            <textarea
              value={coverNote}
              maxLength={100}
              rows={2}
              onChange={(event) =>
                setCoverNote(event.target.value)
              }
            />
          </label>
        )}

        {active && (
          <details className="book-panel">
            <summary>Más ajustes</summary>

            {[
              [
                'size',
                'Tamaño',
                selected.type === 'photo' ? 30 : 40,
                selected.type === 'photo' ? 100 : 180,
                selected.type === 'photo'
                  ? 85
                  : active.src
                    ? 100
                    : 48,
              ],
              ['rotation', 'Giro', -180, 180, 0],
              [
                'x',
                'Horizontal',
                0,
                100,
                selected.type === 'photo' ? 7.5 : 10,
              ],
              [
                'y',
                'Vertical',
                0,
                100,
                selected.type === 'photo' ? 7.5 : 10,
              ],
            ].map(([key, label, min, max, fallback]) => (
              <label key={key}>
                {label}
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={active[key] ?? fallback}
                  onChange={(event) =>
                    precise({
                      [key]: Number(event.target.value),
                    })
                  }
                />
              </label>
            ))}
          </details>
        )}

        <details className="book-panel">
          <summary>
            Agregar stickers · {stickers.length}/10
          </summary>

          <div className="sticker-categories">
            {stickerCategories.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === category}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="book-sticker-options">
            {visible.map((option) => (
              <button
                type="button"
                key={option.id}
                disabled={stickers.length >= 10}
                aria-label={`Agregar ${option.label}`}
                onClick={() => {
                  const sticker = {
                    ...option,
                    id: crypto.randomUUID(),
                    x: 10,
                    y: 10,
                  }

                  changeStickers((previous) =>
                    previous.length >= 10
                      ? previous
                      : [...previous, sticker]
                  )

                  setSelected({
                    type: 'sticker',
                    id: sticker.id,
                  })
                }}
              >
                {option.src ? (
                  <img src={option.src} alt="" />
                ) : (
                  option.symbol
                )}
              </button>
            ))}
          </div>
        </details>

        <div className="photobook-navigation">
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={() => navigate(pageIndex - 1)}
          >
            Anterior
          </button>

          <p aria-live="polite">
            {pageIndex === 0
              ? 'Portada'
              : `Página ${pageIndex} de ${bookPages.length}`}
          </p>

          <button
            type="button"
            disabled={pageIndex === bookPages.length}
            onClick={() => navigate(pageIndex + 1)}
          >
            Siguiente
          </button>
        </div>

        {page && (
          <div className="book-page-tools">
            <button
              type="button"
              disabled={pageIndex === 1}
              onClick={() => {
                setBookPages((previous) => {
                  const updated = [...previous]

                  ;[
                    updated[pageIndex - 2],
                    updated[pageIndex - 1],
                  ] = [
                    updated[pageIndex - 1],
                    updated[pageIndex - 2],
                  ]

                  return updated
                })

                navigate(pageIndex - 1)
              }}
            >
              ↑ Página antes
            </button>

            <button
              type="button"
              disabled={
                pageIndex === bookPages.length
              }
              onClick={() => {
                setBookPages((previous) => {
                  const updated = [...previous]

                  ;[
                    updated[pageIndex - 1],
                    updated[pageIndex],
                  ] = [
                    updated[pageIndex],
                    updated[pageIndex - 1],
                  ]

                  return updated
                })

                navigate(pageIndex + 1)
              }}
            >
              ↓ Página después
            </button>

            <button
              type="button"
              aria-label="Eliminar esta página"
              title="Eliminar página"
              onClick={() => {
                if (
                  !window.confirm(
                    '¿Eliminar esta página? Tus fotos seguirán en Mis recuerdos.'
                  )
                ) {
                  return
                }

                setBookPages((previous) =>
                  previous.filter(
                    (item) => item.id !== page.id
                  )
                )

                navigate(
                  Math.max(0, pageIndex - 1)
                )
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}

        {incomplete && (
          <p role="status">
            Completá los espacios de las páginas
            para descargar el PDF.
          </p>
        )}
      </fieldset>

      <div className="photobook-actions">
        <button
          type="button"
          disabled={
            isExporting ||
            incomplete ||
            bookPages.length === 0
          }
          onClick={onDownload}
        >
          {isExporting
            ? 'Preparando PDF…'
            : 'Descargar PDF'}
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={onClose}
        >
          Cerrar fotolibro
        </button>
      </div>
    </section>
  )
}

