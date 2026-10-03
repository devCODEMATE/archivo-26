import { useRef } from 'react'

function MovableSticker({
  sticker,
  onMove,
  onResize,
  onSelect,
  selected,
}) {
  const containerRef = useRef(null)
  const gestureRef = useRef(null)

  const size = sticker.size ?? (sticker.src ? 100 : 48)
  const rotation = sticker.rotation ?? 0

  function handleMoveStart(event) {
    if (event.button !== 0) return

    const container = containerRef.current
    const pageRect = container.parentElement.getBoundingClientRect()
    const stickerRect = container.getBoundingClientRect()

    gestureRef.current = {
      mode: 'move',
      pointerId: event.pointerId,
      offsetX: event.clientX - stickerRect.left,
      offsetY: event.clientY - stickerRect.top,
      pageRect,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect()
  }

  function handleResizeStart(event) {
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    gestureRef.current = {
      mode: 'resize',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSize: size,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect()
  }

  function handlePointerMove(event) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    if (gesture.mode === 'resize') {
      const deltaX = event.clientX - gesture.startX
      const deltaY = event.clientY - gesture.startY

      const nextSize = Math.min(
        180,
        Math.max(40, gesture.startSize + (deltaX + deltaY) / 2)
      )

      onResize(Math.round(nextSize))
      return
    }

    const container = containerRef.current
    const { pageRect, offsetX, offsetY } = gesture

    const maxX = Math.max(0, pageRect.width - container.offsetWidth)
    const maxY = Math.max(0, pageRect.height - container.offsetHeight)

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
    gestureRef.current = null
  }

  function handleResizeKeyDown(event) {
    const increase = ['ArrowRight', 'ArrowUp'].includes(event.key)
    const decrease = ['ArrowLeft', 'ArrowDown'].includes(event.key)

    if (!increase && !decrease) return

    event.preventDefault()
    onResize(Math.min(180, Math.max(40, size + (increase ? 2 : -2))))
  }

  return (
    <div
      ref={containerRef}
      className="movable-sticker"
      style={{
        width: size,
        height: size,
        left: `clamp(0px, ${sticker.x}%, calc(100% - ${size}px))`,
        top: `clamp(0px, ${sticker.y}%, calc(100% - ${size}px))`,
        borderColor: selected ? '#a51e26' : 'transparent',
        zIndex: selected ? 2 : 1,
      }}
    >
      <button
        type="button"
        className="sticker-drag-button"
        aria-label={`Seleccionar y mover sticker ${
          sticker.label || sticker.symbol
        }`}
        aria-pressed={selected}
        onClick={onSelect}
        onPointerDown={handleMoveStart}
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

      {selected && (
        <button
          type="button"
          className="sticker-resize-handle"
          aria-label="Cambiar tamaño del sticker"
          title="Arrastrá para cambiar el tamaño"
          onPointerDown={handleResizeStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={handlePointerEnd}
          onKeyDown={handleResizeKeyDown}
          onClick={(event) => event.stopPropagation()}
        >
          ↘
        </button>
      )}
    </div>
  )
}

export default MovableSticker