import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getFirestore,
  limit
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  
  const apiKey = firebaseConfig.apiKey;
  const isConfigured = !!apiKey && !apiKey.includes('TWÓJ') && apiKey !== 'dummy-key';
  
  if (!isConfigured) {
    console.warn("Baza danych nie jest skonfigurowana. Dane nie zostaną zapisane w chmurze.");
    return initializeApp({ ...firebaseConfig, apiKey: 'dummy-key' });
  }
  
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();
export const db = getFirestore(app);

export async function findInvoiceByDetails(invoiceNumber: string) {
  if (!invoiceNumber) return null;
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey.includes('TWÓJ') || apiKey === 'dummy-key') return null;
  
  try {
    const q = query(
      collection(db, "invoices"), 
      where("invoiceNumber", "==", invoiceNumber),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    console.error("Błąd wyszukiwania duplikatu:", error);
    return null;
  }
}

export async function saveInvoice(invoiceData: any) {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey.includes('TWÓJ') || apiKey === 'dummy-key') {
    throw new Error("Brak konfiguracji Firebase w pliku .env");
  }

  try {
    const existing = await findInvoiceByDetails(invoiceData.invoiceNumber);
    
    if (existing) {
      const docRef = doc(db, "invoices", existing.id);
      await updateDoc(docRef, {
        ...invoiceData,
        updatedAt: new Date().toISOString()
      });
      return { status: 'updated', id: existing.id };
    }

    const docRef = await addDoc(collection(db, "invoices"), {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACCEPTED'
    });
    return { status: 'added', id: docRef.id };
  } catch (error) {
    console.error("Błąd zapisu w Firestore:", error);
    throw error;
  }
}

export async function getAllInvoices() {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey.includes('TWÓJ') || apiKey === 'dummy-key') return [];
  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Błąd pobierania faktur:", error);
    return [];
  }
}

export async function deleteInvoice(id: string) {
  await deleteDoc(doc(db, "invoices", id));
}

export async function updateInvoice(id: string, data: any) {
  const docRef = doc(db, "invoices", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}
