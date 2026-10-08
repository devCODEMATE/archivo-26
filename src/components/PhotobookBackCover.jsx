export default function PhotobookBackCover({ children }) {
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
        src="/marca/logo-literatura.jpg"
        alt="Logo de Literatura de la promo"
        draggable={false}
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