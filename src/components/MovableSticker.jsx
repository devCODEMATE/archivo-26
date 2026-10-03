import { useRef } from 'react'

function MovableSticker({ sticker, onMove, onSelect, selected }) {
  const dragRef = useRef(null)
  const size = sticker.size ?? (sticker.src ? 100 : 48)
  const rotation = sticker.rotation ?? 0

  function handlePointerDown(event) {
    if (event.button !== 0) return

    const button = event.currentTarget
    const pageRect = button.parentElement.getBoundingClientRect()
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
      aria-label={`Seleccionar sticker ${sticker.label || sticker.symbol}`}
      aria-pressed={selected}
      style={{
        width: size,
        height: size,
        left: `clamp(0px, ${sticker.x}%, calc(100% - ${size}px))`,
        top: `clamp(0px, ${sticker.y}%, calc(100% - ${size}px))`,
      }}
      onClick={onSelect}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
        }}
      >
        {sticker.src ? (
          <img src={sticker.src} alt="" draggable={false} />
        ) : (
          sticker.symbol
        )}
      </span>
    </button>
  )
}

export default MovableSticker