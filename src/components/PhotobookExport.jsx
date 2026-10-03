import PhotobookCover from './PhotobookCover'

function PhotobookExport({
  exportRef,
  bookFormat,
  memories,
  pageStickers,
  coverNote,
  pageWidth = 680,
}) {
  function renderStickers(pageId) {
    return (
      <div className="page-stickers">
        {(pageStickers[pageId] || []).map((sticker) => {
          const size = sticker.src ? 100 : 48

          return (
            <span
              key={sticker.id}
              className="movable-sticker"
              style={{
                width: size,
                height: size,
                left: `clamp(0px, ${sticker.x}%, calc(100% - ${size}px))`,
                top: `clamp(0px, ${sticker.y}%, calc(100% - ${size}px))`,
              }}
            >
              {sticker.src ? (
                <img src={sticker.src} alt="" />
              ) : (
                sticker.symbol
              )}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={exportRef}
      className="photobook pdf-export"
      data-format={bookFormat}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: `${pageWidth}px`,
        pointerEvents: 'none',
      }}
    >
      <PhotobookCover note={coverNote}>
        {renderStickers('cover')}
      </PhotobookCover>

      {memories.map((memory) => (
        <figure
          key={memory.id}
          className="photobook-page"
          data-pdf-page
        >
          <img
            src={memory.image}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              objectFit: 'contain',
            }}
          />

          {memory.caption && (
            <figcaption>{memory.caption}</figcaption>
          )}

          {renderStickers(memory.id)}
        </figure>
      ))}
    </div>
  )
}

export default PhotobookExport