import PhotobookCover from './PhotobookCover'

function PhotobookExport({
  exportRef,
  bookFormat,
  memories,
  pageStickers,
  coverNote,
  pageWidth = 680,
}) {
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
  <div className="page-stickers">
    {(pageStickers.cover || []).map((sticker) => (
      <span
        key={sticker.id}
        className="movable-sticker"
        style={{
          left: `clamp(0px, ${sticker.x}%, calc(100% - 48px))`,
          top: `clamp(0px, ${sticker.y}%, calc(100% - 48px))`,
        }}
      >
        {sticker.symbol}
      </span>
    ))}
  </div>
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

          <div className="page-stickers">
            {(pageStickers[memory.id] || []).map((sticker) => (
              <span
                key={sticker.id}
                className="movable-sticker"
                style={{
                  left: `clamp(0px, ${sticker.x}%, calc(100% - 48px))`,
                  top: `clamp(0px, ${sticker.y}%, calc(100% - 48px))`,
                }}
              >
                {sticker.symbol}
              </span>
            ))}
          </div>
        </figure>
      ))}
    </div>
  )
}

export default PhotobookExport