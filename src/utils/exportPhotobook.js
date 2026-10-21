import { createWhitePromoLogo } from './whitePromoLogo'

const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)

    reader.onerror = () => {
      reject(new Error('No pudimos leer una imagen.'))
    }

    reader.readAsDataURL(blob)
  })
}

async function prepareImages(page, resources) {
  function inline(source) {
    if (source.startsWith('data:')) {
      return Promise.resolve(source)
    }

    const url = new URL(source, document.baseURI).href

    if (!resources.has(url)) {
      resources.set(
        url,
        fetch(url).then(async (response) => {
          if (!response.ok) {
            throw new Error(`No pudimos cargar: ${source}`)
          }

          return blobToDataURL(await response.blob())
        })
      )
    }

    return resources.get(url)
  }

  await Promise.all(
    [...page.querySelectorAll('img')].map(async (image) => {
      const source = image.hasAttribute('data-white-promo-logo')
        ? await createWhitePromoLogo()
        : await inline(image.currentSrc || image.src)

      image.removeAttribute('srcset')
      image.removeAttribute('sizes')
      image.loading = 'eager'
      image.src = source

      await image.decode()

      if (!image.naturalWidth) {
        throw new Error('Una imagen no se pudo cargar.')
      }
    })
  )

  // También preparamos los fondos definidos en CSS.
  for (const element of [page, ...page.querySelectorAll('*')]) {
    let background = getComputedStyle(element).backgroundImage

    const matches = [
      ...background.matchAll(/url\(["']?([^"')]+)["']?\)/g),
    ]

    if (!matches.length) continue

    for (const match of matches) {
      const source = await inline(match[1])

      const image = new Image()
      image.src = source
      await image.decode()

      background = background.replace(
        match[0],
        `url("${source}")`
      )
    }

    element.style.backgroundImage = background
  }
}

export async function exportPhotobook(container, bookFormat) {
  if (!container) {
    throw new Error('No encontramos las páginas del fotolibro.')
  }

  const [{ jsPDF }, { toCanvas, getFontEmbedCSS }] =
    await Promise.all([
      import('jspdf'),
      import('html-to-image'),
    ])

  await document.fonts.ready

  const pages = [
    ...container.querySelectorAll('[data-pdf-page]'),
  ]

  if (!pages.length) {
    throw new Error('El fotolibro no tiene páginas.')
  }

  const format = bookFormat.toLowerCase()

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format,
    compress: true,
  })

  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const fontEmbedCSS = await getFontEmbedCSS(container)
  const resources = new Map()

  // Capturamos copias para no modificar el editor.
  const host = container.cloneNode(false)
  host.removeAttribute('id')

  Object.assign(host.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '-1000',
    pointerEvents: 'none',
  })

  document.body.appendChild(host)

  try {
    for (const [index, page] of pages.entries()) {
      const rect = page.getBoundingClientRect()

      if (!rect.width || !rect.height) {
        throw new Error('Una página no tiene tamaño.')
      }

      const copy = page.cloneNode(true)
      host.replaceChildren(copy)

      await prepareImages(copy, resources)
      await pause(100)

      const options = {
        width: rect.width,
        height: rect.height,
        pixelRatio: Math.min(3, 1400 / rect.width),
        backgroundColor: getComputedStyle(copy).backgroundColor,
        fontEmbedCSS,
        style: {
          margin: '0',
          boxShadow: 'none',
        },
      }

      // Captura de preparación para el problema de imágenes en iOS.
      const preparation = await toCanvas(copy, options)
      preparation.width = 1
      preparation.height = 1

      await pause(150)

      const canvas = await toCanvas(copy, options)

      try {
        if (index > 0) {
          pdf.addPage(format, 'portrait')
        }

        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          0,
          width,
          height
        )
      } finally {
        canvas.width = 1
        canvas.height = 1
      }

      host.replaceChildren()
    }

    await pdf.save(`Archivo-26-${bookFormat}.pdf`, {
      returnPromise: true,
    })
  } finally {
    host.remove()
    resources.clear()
  }
}