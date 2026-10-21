import { useEffect, useState } from 'react'
import { createWhitePromoLogo } from '../utils/whitePromoLogo'

export default function PhotobookBackCover({ children }) {
  const [logo, setLogo] = useState('/marca/logo-literatura.jpg')

  useEffect(() => {
    let cancelled = false

    createWhitePromoLogo()
      .then((source) => {
        if (!cancelled) {
          setLogo(source)
        }
      })
      .catch((error) => console.error(error))

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="photobook-cover photobook-back-cover batik-cover batik-back"
      data-pdf-page
    >
      <div className="batik-school">
        <p className="batik-normal">Normal</p>

        <img
          className="batik-course"
          src="/stickers/promo/6to-3ra.png"
          alt="6to 3ra"
          draggable={false}
        />
      </div>

      <img
        className="batik-logo"
        data-white-promo-logo
        src={logo}
        alt="Logo de Literatura de la promo"
        draggable={false}
        style={{
          filter: 'none',
          mixBlendMode: 'normal',
        }}
      />

      <div className="batik-footer">
        <p className="batik-signature">Promo 2026</p>

        <img
          className="batik-location"
          src="/stickers/promo/olavarria.png"
          alt="Olavarría"
          draggable={false}
        />
      </div>

      {children}
    </div>
  )
}