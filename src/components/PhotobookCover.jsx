function PhotobookCover({
  note = 'Nuestro último año, en recuerdos.',
  children,
}) {
  return (
    <div className="photobook-cover scrapbook-cover" data-pdf-page>
      <div className="cover-school">
        <p className="cover-normal">Normal</p>
        <p className="cover-literatura">Literatura</p>
        <p className="cover-course">6TO 3RA</p>
      </div>

      <div className="cover-project">
        <p className="cover-kicker">Nuestros recuerdos</p>
        <h2>Archivo 26</h2>
        <span className="cover-underline" aria-hidden="true" />
      </div>

      <img
        src="/marca/logo-literatura.jpg"
        alt="Logo de Literatura de la promo"
        className="photobook-cover-logo"
      />

      <p className="cover-note">{note}</p>

      <p className="cover-location">Olavarría · Promo 2026</p>

      {children}
    </div>
  )
}

export default PhotobookCover