
import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)

  function handlePhotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

if (!allowedTypes.includes(file.type)) {
  alert('Elegí una imagen JPG, PNG o WebP.')
  event.target.value = ''
  return
}

  const reader = new FileReader()

  reader.onload = () => {
    setPhotoPreview(reader.result)
  }

  reader.readAsDataURL(file)
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
  onClick={() => fileInputRef.current?.click()}
>
  Subir foto
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

    <button
      type="button"
      onClick={() => {
        setPhotoPreview(null)
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