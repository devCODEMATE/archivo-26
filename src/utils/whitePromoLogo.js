let logoPromise

export function createWhitePromoLogo() {
  if (logoPromise) return logoPromise

  logoPromise = new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight

        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('No pudimos preparar el logo.')
        }

        context.drawImage(image, 0, 0)

        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )

        const backgroundRed = pixels.data[0]

        for (let i = 0; i < pixels.data.length; i += 4) {
          const difference = pixels.data[i] - backgroundRed

          const alpha = Math.max(
            0,
            Math.min(1, (difference - 12) / 45)
          )

          pixels.data[i] = 245
          pixels.data[i + 1] = 235
          pixels.data[i + 2] = 221
          pixels.data[i + 3] = Math.round(alpha * 255)
        }

        context.putImageData(pixels, 0, 0)
        resolve(canvas.toDataURL('image/png'))

        canvas.width = 1
        canvas.height = 1
      } catch (error) {
        reject(error)
      }
    }

    image.onerror = () => {
      reject(new Error('No pudimos cargar logo-literatura.jpg.'))
    }

    image.src = '/marca/logo-literatura.jpg'
  }).catch((error) => {
    logoPromise = undefined
    throw error
  })

  return logoPromise
}