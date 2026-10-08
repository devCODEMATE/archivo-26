import { createId } from './createId'

export function initializeBookPages(
  pages = [],
  alreadyInitialized = false
) {
  if (alreadyInitialized) return pages

  const missing = Math.max(0, 20 - pages.length)

  const emptyPages = Array.from(
    { length: missing },
    () => ({
      id: createId(),
      slots: [
        {
          memoryId: null,
          transform: {},
        },
      ],
      stickers: [],
    })
  )

  return [...pages, ...emptyPages]
}