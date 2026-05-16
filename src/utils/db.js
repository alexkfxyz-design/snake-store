// src/utils/db.js
import { db } from './firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy
} from 'firebase/firestore'

export function subscribeCategories(callback) {
  const q = query(collection(db, 'categories'), orderBy('name'))
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export function subscribeProducts(callback) {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

export const addCategory    = data => addDoc(collection(db, 'categories'), data)
export const updateCategory = (id, data) => updateDoc(doc(db, 'categories', id), data)
export const deleteCategory = id => deleteDoc(doc(db, 'categories', id))

export const addProduct    = data => addDoc(collection(db, 'products'), { ...data, createdAt: Date.now() })
export const updateProduct = (id, data) => updateDoc(doc(db, 'products', id), data)
export const deleteProduct = id => deleteDoc(doc(db, 'products', id))
