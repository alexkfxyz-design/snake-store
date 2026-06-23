import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyDao2U8vEi8OGLOBFM9NcbgJq_bWsd181s",
  authDomain:        "snake-store-168ca.firebaseapp.com",
  projectId:         "snake-store-168ca",
  storageBucket:     "snake-store-168ca.firebasestorage.app",
  messagingSenderId: "281656007665",
  appId:             "1:281656007665:web:3039a3884d2e0322250250"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
