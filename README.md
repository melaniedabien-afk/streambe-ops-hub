# Streambe Ops Hub

App interna para centralizar procesos de marketing de Streambe:
calendario editorial, research competitivo, seguimiento del plan 2026,
banco de assets y aprobaciones.

## Importante: cómo se guardan los datos

Esta app arrancó como prototipo dentro de Claude, donde los datos se
guardaban en un servicio compartido entre todas las personas que abrían
el mismo artifact. Convertida a proyecto standalone, los datos se
guardan con `localStorage` **en el navegador de cada persona**.

Esto quiere decir:
- Lo que cargues en tu Chrome, lo ves vos. Si Vani abre la app en su
  computadora, parte de cero (no ve tu calendario ni tus assets).
- Si borrás datos del navegador (o usás modo incógnito), se pierde lo
  cargado.

Si más adelante querés que el equipo comparta los mismos datos en
tiempo real, hay que sumar un backend (por ejemplo Firebase, Supabase,
o una API propia) y reemplazar `src/storage.js` por llamadas a ese
backend — el resto de la app (`src/App.jsx`) no necesita cambios,
porque toda la persistencia pasa por esa única capa.

## Requisitos

- Node.js 18 o superior
- npm

## Correr en local

```bash
npm install
npm run dev
```

Abre la URL que te muestra la terminal (por defecto `http://localhost:5173`).

## Generar la versión de producción

```bash
npm run build
npm run preview   # para probar el build localmente
```

Los archivos finales quedan en `dist/`.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Streambe Ops Hub - primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/streambe-ops-hub.git
git push -u origin main
```

## Publicarla como sitio (GitHub Pages)

El repo ya incluye un workflow (`.github/workflows/deploy.yml`) que
compila y publica la app automáticamente cada vez que hacés push a
`main`.

Para activarlo:

1. Andá a **Settings → Pages** en tu repositorio de GitHub.
2. En "Build and deployment", elegí **Source: GitHub Actions**.
3. Hacé un push a `main` (o corré el workflow manualmente desde la
   pestaña **Actions**).
4. En unos minutos la app va a quedar publicada en:
   `https://TU-USUARIO.github.io/streambe-ops-hub/`

## Estructura del proyecto

```
├── src/
│   ├── App.jsx        → toda la lógica y las pantallas de la app
│   ├── storage.js      → capa de persistencia (localStorage)
│   ├── main.jsx        → punto de entrada de React
│   └── index.css       → estilos base
├── index.html
├── package.json
├── vite.config.js
└── .github/workflows/deploy.yml
```

## Identidad de marca

Colores y tipografía (Familjen Grotesk + Inter) tomados del Manual de
Marca de Streambe. Si el manual se actualiza, los tokens de color están
centralizados al principio de `src/App.jsx`, en la constante `COLORS`.
