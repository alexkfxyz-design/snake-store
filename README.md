# 🐍 Snake Store

Sistema completo de gestión de productos con Firebase, panel admin y catálogo público.

![React](https://img.shields.io/badge/React-18-e8ff3e?style=flat-square&labelColor=111)
![Vite](https://img.shields.io/badge/Vite-5-e8ff3e?style=flat-square&labelColor=111)
![Firebase](https://img.shields.io/badge/Firebase-10-e8ff3e?style=flat-square&labelColor=111)

---

## 🚀 Desarrollo local

```bash
npm install
npm run dev
```

## 🏗 Build para producción

```bash
npm run build
```

## 🌐 Deploy

El deploy a GitHub Pages es **automático** al hacer push a `main` gracias al workflow de GitHub Actions incluido.

> Antes de hacer deploy, asegúrate de que el nombre del repo en `vite.config.js` coincide con tu repo de GitHub:
> ```js
> base: '/snake-store/', // ← nombre exacto de tu repo
> ```

---

## 🔐 Acceso Admin

- **URL:** `https://tu-usuario.github.io/snake-store/?view=admin`
- **Usuario:** `admin`
- **Contraseña:** `snake2024`

Para cambiar las credenciales edita `src/utils/helpers.js`.

---

## 📂 Estructura

```
snake-store/
├── index.html
├── vite.config.js
├── package.json
├── .github/workflows/deploy.yml   ← deploy automático
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── UI.jsx
    │   ├── QRCode.jsx
    │   ├── ProductCard.jsx
    │   ├── ProductDetail.jsx
    │   ├── ProductForm.jsx
    │   └── CategoryForm.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── AdminPage.jsx
    │   ├── CatalogPage.jsx
    │   └── ProductPublicPage.jsx
    ├── utils/
    │   ├── firebase.js
    │   ├── db.js
    │   └── helpers.js
    └── styles/
        └── main.css
```
