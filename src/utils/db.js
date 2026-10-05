import { db } from './firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, where,
  Timestamp, writeBatch, increment,
  getDoc, setDoc, deleteField, getDocFromServer
} from 'firebase/firestore'

// ── Categorías ──────────────────────────────────
const logErr = label => err => console.error(`[Firestore] ${label}:`, err.code, err.message)

export const subscribeCategories = (cb, onError = logErr('categories')) => {
  const q = query(collection(db, 'categories'), orderBy('name'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
}
export const addCategory    = data => addDoc(collection(db, 'categories'), data)
export const updateCategory = (id, data) => updateDoc(doc(db, 'categories', id), data)
export const deleteCategory = id => deleteDoc(doc(db, 'categories', id))

// ── Productos ───────────────────────────────────
export const subscribeProducts = (cb, onError = logErr('products')) => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
}

// Un solo producto (página pública del QR): no descarga todo el catálogo
export const subscribeProduct = (id, cb) =>
  onSnapshot(
    doc(db, 'products', id),
    snap => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    err  => { console.error(err); cb(null) }
  )

export const getCategory = async id => {
  if (!id) return null
  const snap = await getDoc(doc(db, 'categories', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Imágenes completas (colección aparte) ───────
export async function getProductImage(productId) {
  const snap = await getDoc(doc(db, 'productImages', productId))
  return snap.exists() ? snap.data().data : null
}
export const setProductImage = (productId, full) =>
  setDoc(doc(db, 'productImages', productId), { data: full, updatedAt: Date.now() })

export async function getProductCard(productId) {
  const snap = await getDoc(doc(db, 'productCards', productId))
  return snap.exists() ? snap.data().data : null
}
export const setProductCard = (productId, card) =>
  setDoc(doc(db, 'productCards', productId), { data: card, updatedAt: Date.now() })

const deleteProductImage = productId => Promise.all([
  deleteDoc(doc(db, 'productImages', productId)).catch(() => {}),
  deleteDoc(doc(db, 'productCards',  productId)).catch(() => {}),
])

// images = { full, card, thumb } (opcional, solo cuando se sube una imagen nueva)
const imageFields = images => {
  const v = Date.now()
  return { thumb: images.thumb, hasImage: true, hasCard: true, imageVersion: v, cardVersion: v }
}

export async function addProduct(data, images = null) {
  const ref = doc(collection(db, 'products'))
  if (images) {
    await setProductImage(ref.id, images.full)
    await setProductCard(ref.id, images.card)
  }
  await setDoc(ref, { ...data, ...(images ? imageFields(images) : {}), createdAt: Date.now() })
  return ref.id
}

export async function updateProduct(id, data, images = null) {
  if (images) {
    await setProductImage(id, images.full)
    await setProductCard(id, images.card)
    data = { ...data, ...imageFields(images), image: deleteField() }
  }
  return updateDoc(doc(db, 'products', id), data)
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id))
  await deleteProductImage(id)
}

// ── Ventas ──────────────────────────────────────
// Registra una venta y descuenta stock en un batch atómico
export async function registrarVenta(items) {
  const batch = writeBatch(db)
  const now   = Date.now()

  // Calcular total
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  // Guardar venta
  const ventaRef = doc(collection(db, 'ventas'))
  batch.set(ventaRef, {
    items: items.map(i => ({
      productId:   i.id,
      productName: i.name,
      talla:       i.talla || null,
      price:       i.price,
      qty:         i.qty,
      subtotal:    i.price * i.qty,
    })),
    total,
    fecha:     now,
    fechaISO:  new Date(now).toISOString(),
    dia:       new Date(now).toLocaleDateString('es-PE'),
    mes:       `${new Date(now).getFullYear()}-${String(new Date(now).getMonth()+1).padStart(2,'0')}`,
    anio:      new Date(now).getFullYear(),
  })

  // Descontar stock de cada producto
  // (si el producto tiene tallas, también se descuenta la talla vendida)
  items.forEach(item => {
    const ref = doc(db, 'products', item.id)
    if (item.talla) {
      batch.update(ref, {
        stock: increment(-item.qty),
        [`tallas.${item.talla}`]: increment(-item.qty),
      })
    } else {
      batch.update(ref, { stock: increment(-item.qty) })
    }
  })

  await batch.commit()

  // Los productos que quedaron en 0 unidades se eliminan (con su imagen)
  const ids = [...new Set(items.map(i => i.id))]
  await Promise.all(ids.map(async id => {
    try {
      const snap = await getDocFromServer(doc(db, 'products', id))
      if (snap.exists() && (snap.data().stock ?? 0) <= 0) await deleteProduct(id)
    } catch (err) {
      console.error('No se pudo eliminar el producto agotado', id, err)
    }
  }))

  return ventaRef.id
}

// Elimina todos los productos sin stock (botón del panel admin)
export async function deleteOutOfStock(products) {
  const agotados = products.filter(p => (p.stock ?? 0) <= 0)
  let ok = 0, failed = 0
  for (const p of agotados) {
    try { await deleteProduct(p.id); ok++ }
    catch (err) { console.error('No se pudo eliminar', p.id, err); failed++ }
  }
  return { ok, failed }
}

// Suscripción a ventas (tiempo real)
export const subscribeVentas = (cb, onError = logErr('ventas')) => {
  const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
}
