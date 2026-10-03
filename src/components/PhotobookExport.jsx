function PhotobookExport({
  exportRef,
  bookFormat,
  memories,
  pageStickers,
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
      <div className="photobook-cover" data-pdf-page>
        <p className="photobook-cover-school">
          Normal · Literatura · 6TO 3RA
        </p>

        <h2>Archivo 26</h2>

        <p className="photobook-cover-subtitle">
          Mi último año, en recuerdos.
        </p>

        <img
          src="/marca/logo-literatura.jpg"
          alt=""
          className="photobook-cover-logo"
        />

        <p>Promo 2026</p>
      </div>

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