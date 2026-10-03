import { useRef } from 'react'

function MovableSticker({ sticker, onMove, onSelect, selected }) {
  const dragRef = useRef(null)

  function handlePointerDown(event) {
    if (event.button !== 0) return

    const button = event.currentTarget
    const page = button.parentElement
    const pageRect = page.getBoundingClientRect()
    const stickerRect = button.getBoundingClientRect()

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - stickerRect.left,
      offsetY: event.clientY - stickerRect.top,
      pageRect,
    }

    button.setPointerCapture(event.pointerId)
    onSelect()
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const button = event.currentTarget
    const { pageRect, offsetX, offsetY } = drag

    const maxX = Math.max(0, pageRect.width - button.offsetWidth)
    const maxY = Math.max(0, pageRect.height - button.offsetHeight)

    const x = Math.min(
      maxX,
      Math.max(0, event.clientX - pageRect.left - offsetX)
    )

    const y = Math.min(
      maxY,
      Math.max(0, event.clientY - pageRect.top - offsetY)
    )

    onMove(
      (x / pageRect.width) * 100,
      (y / pageRect.height) * 100
    )
  }

  function handlePointerEnd() {
    dragRef.current = null
  }

  return (
    <button
      type="button"
      className="movable-sticker"
      aria-label={`Seleccionar sticker ${sticker.symbol}`}
      aria-pressed={selected}
      style={{
        left: `clamp(0px, ${sticker.x}%, calc(100% - 48px))`,
        top: `clamp(0px, ${sticker.y}%, calc(100% - 48px))`,
      }}
      onClick={onSelect}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      {sticker.symbol}
    </button>
  )
}

export default MovableSticker