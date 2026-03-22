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
import { getAuth } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

const { firebaseApp, firestore: db } = initializeFirebase();

const LOCAL_STORAGE_KEY = 'ksef_invoices_local_db';

// Pomocnicza funkcja do pobierania UID aktualnego użytkownika
function getCurrentUserId() {
  const auth = getAuth(firebaseApp);
  return auth.currentUser?.uid;
}

// Ścieżka do kolekcji faktur użytkownika
function getUserInvoicesPath() {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return `users/${uid}/companyProfile/invoices`;
}

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

  const path = getUserInvoicesPath();
  if (!path) return null;
  
  try {
    const q = query(
      collection(db, path), 
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
  const path = getUserInvoicesPath();
  
  if (!path) {
    saveToLocal(invoiceData);
    return { status: 'added', id: 'local-id' };
  }

  try {
    const existing = await findInvoiceByDetails(invoiceData.invoiceNumber);
    
    const uid = getCurrentUserId();
    const dataWithUser = {
      ...invoiceData,
      userId: uid,
      companyProfileId: 'companyProfile' // Uproszczenie dla MVP
    };

    if (existing && !existing.id.startsWith('local-')) {
      const docRef = doc(db, path, existing.id);
      await updateDoc(docRef, {
        ...dataWithUser,
        updatedAt: new Date().toISOString()
      });
      return { status: 'updated', id: existing.id };
    }

    const docRef = await addDoc(collection(db, path), {
      ...dataWithUser,
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
  const path = getUserInvoicesPath();
  
  if (!path) {
    return localInvoices;
  }

  try {
    const querySnapshot = await getDocs(collection(db, path));
    const firestoreInvoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return firestoreInvoices;
  } catch (error) {
    console.error("Błąd pobierania faktur:", error);
    return localInvoices;
  }
}

export async function deleteInvoice(id: string) {
  const path = getUserInvoicesPath();
  if (id.startsWith('local-')) {
    const current = getLocalInvoices();
    const updated = current.filter((inv: any) => inv.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return;
  }

  if (!path) return;
  await deleteDoc(doc(db, path, id));
}

export async function deleteAllInvoices() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  const path = getUserInvoicesPath();
  if (!path) return true;

  try {
    const querySnapshot = await getDocs(collection(db, path));
    if (querySnapshot.empty) return true;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((d) => {
      batch.delete(doc(db, path, d.id));
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Błąd czyszczenia bazy danych:", error);
    throw error;
  }
}
