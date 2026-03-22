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
  limit,
  writeBatch
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

const LOCAL_STORAGE_KEY = 'ksef_invoices_local_db';

export const isFirebaseConfigured = !!firebaseConfig.apiKey && 
                                   !firebaseConfig.apiKey.includes('TWÓJ') && 
                                   firebaseConfig.apiKey !== 'dummy-key' &&
                                   firebaseConfig.apiKey.length > 10;

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  
  if (!isFirebaseConfigured) {
    return initializeApp({ ...firebaseConfig, apiKey: 'dummy-key', projectId: 'demo-project' });
  }
  
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();
export const db = getFirestore(app);

function getLocalInvoices() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveToLocal(invoice: any) {
  if (typeof window === 'undefined') return;
  const current = getLocalInvoices();
  const existingIndex = current.findIndex((inv: any) => inv.invoiceNumber === invoice.invoiceNumber);
  
  const invoiceWithMeta = {
    ...invoice,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...invoiceWithMeta };
  } else {
    current.push({ 
      ...invoiceWithMeta, 
      id: 'local-' + Date.now() + Math.random().toString(36).substr(2, 5), 
      createdAt: new Date().toISOString() 
    });
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
}

export async function findInvoiceByDetails(invoiceNumber: string) {
  if (!invoiceNumber) return null;
  
  const local = getLocalInvoices();
  const foundLocal = local.find((inv: any) => inv.invoiceNumber === invoiceNumber);
  if (foundLocal) return foundLocal;

  if (!isFirebaseConfigured) return null;
  
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
  saveToLocal(invoiceData);

  if (!isFirebaseConfigured) {
    return { status: 'added', id: 'local-id' };
  }

  try {
    const existing = await findInvoiceByDetails(invoiceData.invoiceNumber);
    
    if (existing && !existing.id.startsWith('local-')) {
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
  const localInvoices = getLocalInvoices();
  
  if (!isFirebaseConfigured) {
    return localInvoices;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    const firestoreInvoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const merged = [...firestoreInvoices];
    localInvoices.forEach((localInv: any) => {
      if (!merged.some(f => f.invoiceNumber === localInv.invoiceNumber)) {
        merged.push(localInv);
      }
    });
    
    return merged;
  } catch (error) {
    console.error("Błąd pobierania faktur:", error);
    return localInvoices;
  }
}

export async function deleteInvoice(id: string) {
  if (id.startsWith('local-')) {
    const current = getLocalInvoices();
    const updated = current.filter((inv: any) => inv.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return;
  }

  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, "invoices", id));
}

export async function deleteAllInvoices() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("Local storage wyczyszczone.");
  }

  if (!isFirebaseConfigured) {
    return true;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    if (querySnapshot.empty) return true;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((d) => {
      batch.delete(doc(db, "invoices", d.id));
    });
    await batch.commit();
    console.log("Firestore wyczyszczone.");
    return true;
  } catch (error) {
    console.error("Błąd czyszczenia bazy danych:", error);
    throw error;
  }
}

export async function updateInvoice(id: string, data: any) {
  if (id.startsWith('local-')) {
    const current = getLocalInvoices();
    const index = current.findIndex((inv: any) => inv.id === id);
    if (index >= 0) {
      current[index] = { ...current[index], ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
    return;
  }

  if (!isFirebaseConfigured) return;
  const docRef = doc(db, "invoices", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}
