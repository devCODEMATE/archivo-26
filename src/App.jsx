
import { useState, useRef } from 'react'
import './App.css'
import imageCompression from 'browser-image-compression'

function App() {
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const [photoSizes, setPhotoSizes] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [photoCaption, setPhotoCaption] = useState('')

async function handlePhotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    alert('Elegí una imagen JPG, PNG o WebP.')
    event.target.value = ''
    return
  }
setIsProcessing(true)
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 800000 / (1024 * 1024),
      maxWidthOrHeight: 1600,
      useWebWorker: false,
    })

    if (compressedFile.size > 800000) {
      alert('No pudimos reducir esta foto a 800 KB. Probá con otra.')
      return
    }

    const preview = await imageCompression.getDataUrlFromFile(
      compressedFile
    )
    setPhotoSizes({
       original: Math.round(file.size / 1000),
       compressed: Math.round(compressedFile.size / 1000),
})

    setPhotoPreview(preview)
} catch {
  alert('No pudimos procesar la foto. Probá con otra imagen.')
} finally {
  setIsProcessing(false)
}
}
  return (
    <main>
   <header>
  <img
    src="/marca/logo-literatura.jpg"
    alt="Logo de Literatura de la promo"
    width="80"
    height="80"
  />
  <p>Normal · Literatura · 6TO 3RA</p>
  <h1>Archivo 26</h1>
  <p>Solo para la promo</p>
</header>

      <section>
        <h2>Nuestro último año, en un solo lugar.</h2>
        <p>Guardemos los momentos que queremos recordar.</p>

        <input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  hidden
  onChange={handlePhotoChange}
/>

<button
  type="button"
  disabled={isProcessing}
  onClick={() => fileInputRef.current?.click()}
>
  {isProcessing ? 'Procesando foto…' : 'Subir foto'}
</button>

{photoPreview && (
  <div>
    <img
      src={photoPreview}
      alt="Vista previa de la foto seleccionada"
      style={{
        display: 'block',
        width: '100%',
        maxHeight: '320px',
        objectFit: 'contain',
        marginTop: '16px',
        borderRadius: '12px',
      }}
    />
    <label htmlFor="photo-caption">Descripción de la foto</label>
<input
  id="photo-caption"
  type="text"
  value={photoCaption}
  onChange={(event) => setPhotoCaption(event.target.value)}
  maxLength={150}
  placeholder="Por ejemplo: Último primer día"
  disabled={isProcessing}
/>
  <p className="caption-counter">
  {photoCaption.length}/150 caracteres
</p>
    {photoSizes && (
  <p>
    Original: {photoSizes.original} KB · Comprimida: {photoSizes.compressed} KB
  </p>
)}

<button
  type="button"
  disabled={isProcessing}
  onClick={() => {
    setPhotoPreview(null)
    setPhotoSizes(null)
    setPhotoCaption('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }}
>
  Quitar foto
</button>
  </div>
)}

<button type="button">Crear mi fotolibro</button>
      </section>

      <section>
        <h2>Últimos recuerdos</h2>
        <p>Acá aparecerán las fotos de nuestra promo.</p>
      </section>
    </main>
  )
}

export default App