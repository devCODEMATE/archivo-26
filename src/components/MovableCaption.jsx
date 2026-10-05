import { useEffect, useRef, useState } from 'react'

export default function MovableCaption({
  text,
  pageRef,
  x = 0,
  y = 0,
  scale = 1,
  selected = false,
  onSelect,
  onMove,
  onResize,
  readOnly = false,
}) {
  const dragRef = useRef(null)
  const [pageSize, setPageSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const observer = new ResizeObserver(() => {
      const rect = page.getBoundingClientRect()

      setPageSize({
        width: rect.width,
        height: rect.height,
      })
    })

    observer.observe(page)
    return () => observer.disconnect()
  }, [pageRef])

  function start(event) {
    if (event.button !== 0 || readOnly) return

    const page = pageRef.current.getBoundingClientRect()
    if (!page.width || !page.height) return

    event.stopPropagation()

    dragRef.current = {
      pointer: event.pointerId,
      page,
      rect: event.currentTarget.getBoundingClientRect(),
      clientX: event.clientX,
      clientY: event.clientY,
      x,
      y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect()
  }

  function move(event) {
    const drag = dragRef.current
    if (!drag || drag.pointer !== event.pointerId) return

    const left = Math.max(
      drag.page.left,
      Math.min(
        drag.page.right - drag.rect.width,
        drag.rect.left + event.clientX - drag.clientX
      )
    )

    const top = Math.max(
      drag.page.top,
      Math.min(
        drag.page.bottom - drag.rect.height,
        drag.rect.top + event.clientY - drag.clientY
      )
    )

    onMove(
      drag.x + ((left - drag.rect.left) / drag.page.width) * 100,
      drag.y + ((top - drag.rect.top) / drag.page.height) * 100
    )
  }

  function end() {
    dragRef.current = null
  }

  function keyDown(event) {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }

    const direction = directions[event.key]
    if (!direction) return

    event.preventDefault()

    const page = pageRef.current.getBoundingClientRect()
    const rect = event.currentTarget.getBoundingClientRect()
    if (!page.width || !page.height) return

    const distance = event.shiftKey ? 10 : 2

    const dx = Math.max(
      page.left - rect.left,
      Math.min(page.right - rect.right, direction[0] * distance)
    )

    const dy = Math.max(
      page.top - rect.top,
      Math.min(page.bottom - rect.bottom, direction[1] * distance)
    )

    onMove(
      x + (dx / page.width) * 100,
      y + (dy / page.height) * 100
    )
  }

  function resize(amount) {
    const nextScale = Math.round((scale + amount) * 100) / 100
    onResize(Math.max(0.75, Math.min(1.4, nextScale)))
  }

  const textStyle = {
    fontSize: `${scale}em`,
  }

  return (
    <div
      className="book-caption-wrapper"
      data-selected={!readOnly && selected}
      style={{
        transform: `translate(
          ${(x / 100) * pageSize.width}px,
          ${(y / 100) * pageSize.height}px
        )`,
      }}
    >
      {readOnly ? (
        <span className="book-caption-text" style={textStyle}>
          {text}
        </span>
      ) : (
        <button
          type="button"
          className="book-caption-text"
          style={textStyle}
          data-selected={selected}
          aria-pressed={selected}
          aria-label={`Mover descripción: ${text}`}
          title="Arrastrá para mover la descripción"
          onClick={onSelect}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onKeyDown={keyDown}
        >
          {text}
        </button>
      )}

      {!readOnly && selected && (
        <div className="book-caption-controls">
          <button
            type="button"
            aria-label="Achicar letra"
            title="Achicar letra"
            disabled={scale <= 0.75}
            onClick={() => resize(-0.05)}
          >
            −
          </button>

          <button
            type="button"
            aria-label="Agrandar letra"
            title="Agrandar letra"
            disabled={scale >= 1.4}
            onClick={() => resize(0.05)}
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}