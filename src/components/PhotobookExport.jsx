import PhotobookCover from './PhotobookCover'
import BookPage from './BookPage'
import EditableItem from './EditableItem'

export default function PhotobookExport({
  exportRef,
  bookFormat,
  memories,
  bookPages,
  coverStickers,
  coverNote,
  pageWidth = 680,
}) {
  function stickers(items) {
    return (
      <div className="book-sticker-layer">
        {items.map((item) => (
          <EditableItem
            key={item.id}
            item={item}
            readOnly
          />
        ))}
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
        width: pageWidth,
        pointerEvents: 'none',
      }}
    >
      <PhotobookCover note={coverNote}>
        {stickers(coverStickers)}
      </PhotobookCover>

      {bookPages.map((page) => (
        <BookPage
          key={page.id}
          page={page}
          memories={memories}
          readOnly
        >
          {stickers(page.stickers || [])}
        </BookPage>
      ))}
    </div>
  )
}