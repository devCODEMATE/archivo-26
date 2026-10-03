export async function exportPhotobook(container, bookFormat) {
  if (!container) {
    throw new Error('No encontramos las páginas del fotolibro.')
  }

  const [{ jsPDF }, { toJpeg, getFontEmbedCSS }] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
  ])

  await document.fonts.ready

  const pages = [...container.querySelectorAll('[data-pdf-page]')]

  if (pages.length === 0) {
    throw new Error('El fotolibro no tiene páginas.')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: bookFormat.toLowerCase(),
    compress: true,
  })

  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const fontEmbedCSS = await getFontEmbedCSS(container)

  for (const [index, page] of pages.entries()) {
    await Promise.all(
      [...page.querySelectorAll('img')].map((image) => image.decode())
    )

    const image = await toJpeg(page, {
      quality: 0.95,
      pixelRatio: Math.max(2, 1600 / page.getBoundingClientRect().width),
      backgroundColor: getComputedStyle(page).backgroundColor,
      fontEmbedCSS,
      style: {
        margin: '0',
        boxShadow: 'none',
      },
    })

    if (index > 0) {
      pdf.addPage(bookFormat.toLowerCase(), 'portrait')
    }

    pdf.addImage(image, 'JPEG', 0, 0, width, height)
  }

  await pdf.save(`Archivo-26-${bookFormat}.pdf`, {
    returnPromise: true,
  })
}