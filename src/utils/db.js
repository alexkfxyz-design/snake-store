import { db } from './firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, where,
  Timestamp, writeBatch, increment
} from 'firebase/firestore'

// ── Categorías ──────────────────────────────────
export const subscribeCategories = cb => {
  const q = query(collection(db, 'categories'), orderBy('name'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}
export const addCategory    = data => addDoc(collection(db, 'categories'), data)
export const updateCategory = (id, data) => updateDoc(doc(db, 'categories', id), data)
export const deleteCategory = id => deleteDoc(doc(db, 'categories', id))

// ── Productos ───────────────────────────────────
export const subscribeProducts = cb => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}
export const addProduct    = data => addDoc(collection(db, 'products'), { ...data, createdAt: Date.now() })
export const updateProduct = (id, data) => updateDoc(doc(db, 'products', id), data)
export const deleteProduct = id => deleteDoc(doc(db, 'products', id))

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
  items.forEach(item => {
    const ref = doc(db, 'products', item.id)
    batch.update(ref, { stock: increment(-item.qty) })
  })

  await batch.commit()
  return ventaRef.id
}

// Suscripción a ventas (tiempo real)
export const subscribeVentas = cb => {
  const q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}
