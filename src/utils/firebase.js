import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Caché local (IndexedDB): quien vuelve a entrar ve el catálogo al instante
// mientras Firestore trae los cambios en segundo plano.
function canUsePersistentCache() {
  try {
    if (typeof indexedDB === 'undefined') return false
    // Dentro de un iframe/webview (ej. navegador integrado de VS Code) la caché
    // persistente puede bloquearse; ahí usamos caché en memoria.
    if (window.self !== window.top) return false
    return true
  } catch { return false }
}

function createDb() {
  if (!canUsePersistentCache()) {
    return initializeFirestore(app, { localCache: memoryLocalCache() })
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch (err) {
    console.warn('Caché local no disponible, usando memoria:', err)
    return initializeFirestore(app, { localCache: memoryLocalCache() })
  }
}

export const db   = createDb()
export const auth = getAuth(app)
