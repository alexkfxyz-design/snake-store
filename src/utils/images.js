// src/utils/images.js
// Manejo de imágenes de productos:
//  - "thumb": vista previa diminuta (~1-2 KB) dentro del producto → se muestra al instante (borrosa)
//  - imagen de tarjeta: buena calidad (600px), colección "productCards" → se carga solo al verse en pantalla
//  - imagen completa: colección "productImages" → solo se descarga al abrir el producto
import { useEffect, useState } from 'react'
import { getProductImage, setProductImage, getProductCard, setProductCard } from './db'
import { doc, updateDoc, deleteField, collection, query, orderBy, limit, startAfter, getDocsFromServer, documentId } from 'firebase/firestore'
import { db } from './firebase'

export const FULL_MAX   = 800
export const FULL_Q     = 0.7
export const THUMB_MAX  = 320   // (formato anterior)
export const THUMB_Q    = 0.6
export const CARD_MAX   = 600   // tarjetas del catálogo: nítidas también en pantallas de alta resolución
export const CARD_Q     = 0.82
export const BLUR_MAX   = 40    // vista previa borrosa que viaja con el producto
export const BLUR_Q     = 0.5

// Redimensiona una imagen (dataURL o URL) y devuelve un dataURL JPEG
export function resizeImage(src, max, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > max) { h = h * max / w; w = max }
      if (h > max) { w = w * max / h; h = max }
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(w)
      canvas.height = Math.round(h)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = src
  })
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Genera imagen completa + tarjeta + vista previa a partir de un archivo o dataURL
export async function buildImages(source) {
  const dataUrl = typeof source === 'string' ? source : await readFileAsDataURL(source)
  const full  = await resizeImage(dataUrl, FULL_MAX, FULL_Q)
  const card  = await resizeImage(dataUrl, CARD_MAX, CARD_Q)
  const thumb = await resizeImage(card,    BLUR_MAX, BLUR_Q)
  return { full, card, thumb }
}

// A partir de una imagen completa ya guardada (para mejorar productos existentes)
export async function buildCardFromFull(full) {
  const card  = await resizeImage(full, CARD_MAX, CARD_Q)
  const thumb = await resizeImage(card, BLUR_MAX, BLUR_Q)
  return { card, thumb }
}

// Miniatura para listas (compatible con productos antiguos que aún tienen "image")
export const getThumb = p => p?.thumb || p?.image || null

// ¿El producto tiene alguna imagen?
export const productHasImage = p => !!(p?.thumb || p?.image || p?.hasImage)

// Caché en memoria de imágenes completas ya descargadas (clave: id + versión)
const fullCache = new Map()
const cacheKey  = p => `${p.id}:${p.imageVersion || 0}`

// Hook: devuelve la imagen completa del producto. Mientras carga, devuelve la miniatura.
export function useFullImage(product) {
  const legacy     = product?.image || null
  const id         = product?.id
  const key        = id ? cacheKey(product) : null
  const needsFetch = !legacy && !!product?.hasImage && !!id
  const [full, setFull] = useState(() => legacy || (key && fullCache.get(key)) || null)

  useEffect(() => {
    if (legacy)      { setFull(legacy); return }
    if (!needsFetch) { setFull(null);   return }
    if (fullCache.has(key)) { setFull(fullCache.get(key)); return }
    setFull(null)
    let alive = true
    getProductImage(id)
      .then(data => {
        if (data) fullCache.set(key, data)
        if (alive) setFull(data || null)
      })
      .catch(err => console.warn('No se pudo cargar la imagen completa', err))
    return () => { alive = false }
  }, [id, key, legacy, needsFetch])

  // Mientras carga la completa: la de tarjeta si ya está en memoria, si no la vista previa
  return full || (product?.hasCard && cardCache.get(cardKey(product))) || getThumb(product)
}

// ── Imagen de tarjeta (buena calidad, carga perezosa) ──
const cardCache = new Map()
const cardKey   = p => `${p.id}:${p.cardVersion || p.imageVersion || 0}`

// Devuelve { src, sharp }: la imagen de tarjeta cuando ya cargó; mientras tanto la vista previa.
// Solo descarga cuando `visible` es true.
export function useCardImage(product, visible = true) {
  const id      = product?.id
  const hasCard = !!product?.hasCard && !!id
  const key     = hasCard ? cardKey(product) : null
  const [card, setCard] = useState(() => (key && cardCache.get(key)) || null)

  useEffect(() => {
    if (!hasCard) { setCard(null); return }
    if (cardCache.has(key)) { setCard(cardCache.get(key)); return }
    if (!visible) return
    let alive = true
    getProductCard(id)
      .then(data => { if (data) cardCache.set(key, data); if (alive) setCard(data || null) })
      .catch(err => console.warn('No se pudo cargar la imagen', err))
    return () => { alive = false }
  }, [id, key, hasCard, visible])

  if (card) return { src: card, sharp: true }
  // Productos aún no mejorados: su "thumb" es la miniatura de 320px de antes
  return { src: getThumb(product), sharp: !hasCard }
}

// ── Mejora de calidad de productos existentes ───
export const needsCardUpgrade = p => !p?.hasCard && productHasImage(p)

// Crea la imagen de tarjeta (600px) desde la imagen completa ya guardada, de a pocos productos.
export async function upgradeCardsInBatches(onProgress = () => {}, batchSize = 10) {
  let last = null, scanned = 0, done = 0, failed = 0
  while (true) {
    const q = last
      ? query(collection(db, 'products'), orderBy(documentId()), startAfter(last), limit(batchSize))
      : query(collection(db, 'products'), orderBy(documentId()), limit(batchSize))
    const snap = await getDocsFromServer(q)
    if (snap.empty) break
    for (const d of snap.docs) {
      scanned++
      const p = { id: d.id, ...d.data() }
      if (needsCardUpgrade(p)) {
        try {
          const full = p.image || await getProductImage(p.id)
          if (full) {
            const { card, thumb } = await buildCardFromFull(full)
            if (p.image) await setProductImage(p.id, p.image)   // productos aún no migrados
            await setProductCard(p.id, card)
            const v = Date.now()
            await updateDoc(doc(db, 'products', p.id), {
              thumb, hasImage: true, hasCard: true, cardVersion: v, imageVersion: p.imageVersion || v,
              ...(p.image ? { image: deleteField() } : {}),
            })
            cardCache.set(cardKey({ id: p.id, cardVersion: v }), card)
            done++
          }
        } catch (err) {
          console.error('No se pudo mejorar', p.id, err)
          failed++
        }
      }
      onProgress({ scanned, done, failed })
    }
    last = snap.docs[snap.docs.length - 1]
  }
  return { scanned, done, failed }
}

// ── Migración de productos antiguos ─────────────
// Productos que aún guardan la imagen completa dentro del documento
export const needsImageMigration = p => !!p?.image && !p?.thumb

// Para cada producto antiguo: genera la miniatura, mueve la imagen completa
// a "productImages" y la quita del documento del producto.
export async function migrateProductImages(products, onProgress = () => {}) {
  const pending = products.filter(needsImageMigration)
  let done = 0, failed = 0
  for (const p of pending) {
    try {
      const thumb = await resizeImage(p.image, THUMB_MAX, THUMB_Q)
      await setProductImage(p.id, p.image)               // la original se conserva tal cual
      const imageVersion = Date.now()
      await updateDoc(doc(db, 'products', p.id), {
        thumb, hasImage: true, imageVersion, image: deleteField(),
      })
      fullCache.set(cacheKey({ id: p.id, imageVersion }), p.image)
      done++
    } catch (err) {
      console.error('No se pudo migrar', p.id, err)
      failed++
    }
    onProgress({ done, failed, total: pending.length })
  }
  return { done, failed, total: pending.length }
}

// Igual que la anterior, pero SIN necesitar la lista completa de productos:
// recorre la colección de a pocos documentos (cada uno pesa como máximo ~1 MB),
// así funciona aunque el catálogo completo sea demasiado pesado para cargar de una vez.
export async function migrateAllInBatches(onProgress = () => {}, batchSize = 2) {
  let last = null, scanned = 0, done = 0, failed = 0
  while (true) {
    const q = last
      ? query(collection(db, 'products'), orderBy(documentId()), startAfter(last), limit(batchSize))
      : query(collection(db, 'products'), orderBy(documentId()), limit(batchSize))
    const snap = await getDocsFromServer(q)
    if (snap.empty) break
    for (const d of snap.docs) {
      scanned++
      const p = { id: d.id, ...d.data() }
      if (needsImageMigration(p)) {
        try {
          const thumb = await resizeImage(p.image, THUMB_MAX, THUMB_Q)
          await setProductImage(p.id, p.image)
          await updateDoc(doc(db, 'products', p.id), {
            thumb, hasImage: true, imageVersion: Date.now(), image: deleteField(),
          })
          done++
        } catch (err) {
          console.error('No se pudo migrar', p.id, err)
          failed++
        }
      }
      onProgress({ scanned, done, failed })
    }
    last = snap.docs[snap.docs.length - 1]
  }
  return { scanned, done, failed }
}
