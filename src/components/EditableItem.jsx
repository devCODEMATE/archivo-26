import { useRef } from 'react'

export function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </svg>
  )
}

export default function EditableItem({
  item,
  photo = false,
  selected,
  onSelect,
  onChange,
  onRemove,
  onReplace,
  readOnly = false,
}) {
  const drag = useRef(null)

  const size = item.size ?? (photo ? 85 : item.src ? 100 : 48)
  const rotation = item.rotation ?? 0
  const x = item.x ?? (photo ? 7.5 : 10)
  const y = item.y ?? (photo ? 7.5 : 10)
  const unit = photo ? '%' : 'px'

  function start(event, mode) {
    if (readOnly || event.button !== 0) return

    event.stopPropagation()

    const wrapper = event.currentTarget.closest('.book-item')
    const parent = wrapper.parentElement.getBoundingClientRect()
    const rect = wrapper.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    drag.current = {
      mode,
      pointer: event.pointerId,
      parent,
      rect,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      size,
      rotation,
      cx,
      cy,
      angle: Math.atan2(event.clientY - cy, event.clientX - cx),
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect()
  }

  function move(event) {
    const d = drag.current

    if (!d || d.pointer !== event.pointerId) return

    if (d.mode === 'move') {
      const nextX =
        d.x + ((event.clientX - d.startX) / d.parent.width) * 100

      const nextY =
        d.y + ((event.clientY - d.startY) / d.parent.height) * 100

      onChange({
        x: Math.max(
          0,
          Math.min(
            Math.max(0, 100 - (d.rect.width / d.parent.width) * 100),
            nextX
          )
        ),
        y: Math.max(
          0,
          Math.min(
            Math.max(0, 100 - (d.rect.height / d.parent.height) * 100),
            nextY
          )
        ),
      })
    } else if (d.mode === 'resize') {
      const delta = event.clientX - d.startX
      const next =
        d.size + (photo ? (delta / d.parent.width) * 100 : delta)

      onChange({
        size: Math.max(
          photo ? 30 : 40,
          Math.min(photo ? 100 : 180, next)
        ),
      })
    } else {
      const angle = Math.atan2(
        event.clientY - d.cy,
        event.clientX - d.cx
      )

      const degrees =
        d.rotation + ((angle - d.angle) * 180) / Math.PI

      onChange({
        rotation: Math.round(
          (((degrees + 180) % 360) + 360) % 360 - 180
        ),
      })
    }
  }

  function end() {
    drag.current = null
  }

  const handlers = {
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  }

  function keys(event, mode) {
    if (!event.key.startsWith('Arrow')) return

    event.preventDefault()

    if (mode === 'move') {
      onChange({
        x: Math.max(
          0,
          Math.min(
            100,
            x +
              (event.key === 'ArrowLeft'
                ? -2
                : event.key === 'ArrowRight'
                  ? 2
                  : 0)
          )
        ),
        y: Math.max(
          0,
          Math.min(
            100,
            y +
              (event.key === 'ArrowUp'
                ? -2
                : event.key === 'ArrowDown'
                  ? 2
                  : 0)
          )
        ),
      })
    }

    if (mode === 'resize') {
      onChange({
        size: Math.max(
          photo ? 30 : 40,
          Math.min(
            photo ? 100 : 180,
            size +
              (['ArrowLeft', 'ArrowDown'].includes(event.key)
                ? -2
                : 2)
          )
        ),
      })
    }

    if (mode === 'rotate') {
      onChange({
        rotation: Math.max(
          -180,
          Math.min(
            180,
            rotation +
              (['ArrowLeft', 'ArrowDown'].includes(event.key)
                ? -5
                : 5)
          )
        ),
      })
    }
  }

  const content = (
    <span
      className="book-item-content"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.label || ''}
          draggable={false}
        />
      ) : (
        item.symbol
      )}
    </span>
  )

  return (
    <div
      className="book-item"
      data-selected={!readOnly && selected}
      style={{
        width: `${size}${unit}`,
        height: `${size}${unit}`,
        left: `clamp(0px, ${x}%, calc(100% - ${size}${unit}))`,
        top: `clamp(0px, ${y}%, calc(100% - ${size}${unit}))`,
      }}
    >
      {readOnly ? (
        content
      ) : (
        <>
          <button
            type="button"
            className="book-item-drag"
            aria-label={`Seleccionar y mover ${
              photo ? 'foto' : 'sticker'
            }`}
            aria-pressed={selected}
            onClick={onSelect}
            onPointerDown={(event) => start(event, 'move')}
            onKeyDown={(event) => keys(event, 'move')}
            {...handlers}
          >
            {content}
          </button>

          {selected && (
            <>
              <button
                type="button"
                className="book-handle book-turn"
                aria-label="Girar"
                title="Girar"
                onPointerDown={(event) => start(event, 'rotate')}
                onKeyDown={(event) => keys(event, 'rotate')}
                {...handlers}
              >
                ↻
              </button>

              <button
                type="button"
                className="book-handle book-resize"
                aria-label="Cambiar tamaño"
                title="Cambiar tamaño"
                onPointerDown={(event) => start(event, 'resize')}
                onKeyDown={(event) => keys(event, 'resize')}
                {...handlers}
              >
                ↘
              </button>

              <button
                type="button"
                className="book-handle book-trash"
                aria-label={
                  photo
                    ? 'Quitar foto de esta página'
                    : 'Quitar sticker'
                }
                title="Quitar"
                onClick={onRemove}
              >
                <TrashIcon />
              </button>

              {photo && (
                <button
                  type="button"
                  className="book-replace"
                  onClick={onReplace}
                >
                  Cambiar foto
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}