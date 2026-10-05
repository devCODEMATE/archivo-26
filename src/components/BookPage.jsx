import { useRef } from 'react'
import EditableItem from './EditableItem'
import MovableCaption from './MovableCaption'

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
  const pageRef = useRef(null)

  return (
    <div
      ref={pageRef}
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
         <MovableCaption
  text={memory.caption}
  pageRef={pageRef}
  x={slot.transform?.captionX ?? 0}
  y={slot.transform?.captionY ?? 0}
  scale={slot.transform?.captionScale ?? 1}
  readOnly={readOnly}
  selected={
    selected?.type === 'caption' &&
    selected.index === index
  }
  onSelect={() =>
    onSelect({
      type: 'caption',
      index,
    })
  }
  onMove={(x, y) =>
    onPhotoChange(index, {
      captionX: x,
      captionY: y,
    })
  }
  onResize={(scale) =>
    onPhotoChange(index, {
      captionScale: scale,
    })
  }
/>
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