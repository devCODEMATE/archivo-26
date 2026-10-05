import EditableItem from './EditableItem'

export default function BookPage({
  page,
  memories,
  selected,
  onSelect,
  onChoose,
  onPhotoChange,
  onRemove,
  readOnly = false,
  children,
}) {
  return (
    <div
      className="photobook-page book-canvas"
      data-layout={page.slots.length}
      data-pdf-page={readOnly ? '' : undefined}
    >
      <div
        className="book-photo-grid"
        data-layout={page.slots.length}
      >
        {page.slots.map((slot, index) => {
          const memory = memories.find(
            (photo) => photo.id === slot.memoryId
          )

          return (
            <figure className="book-cell" key={index}>
              <div className="book-cell-stage">
                {memory ? (
                  <EditableItem
                    photo
                    readOnly={readOnly}
                    item={{
                      src: memory.image,
                      label: memory.caption,
                      ...slot.transform,
                    }}
                    selected={
                      selected?.type === 'photo' &&
                      selected.index === index
                    }
                    onSelect={() =>
                      onSelect({
                        type: 'photo',
                        index,
                      })
                    }
                    onChange={(changes) =>
                      onPhotoChange(index, changes)
                    }
                    onRemove={() => onRemove(index)}
                    onReplace={() => onChoose(index)}
                  />
                ) : (
                  !readOnly && (
                    <button
                      type="button"
                      className="book-empty"
                      onClick={() => onChoose(index)}
                    >
                      <span aria-hidden="true">＋</span>
                      Elegir foto
                    </button>
                  )
                )}
              </div>

              {memory?.caption && (
                <figcaption>
                  {memory.caption}
                </figcaption>
              )}
            </figure>
          )
        })}
      </div>

      {children}
    </div>
  )
}