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
  writeBatch,
  setDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

const { firebaseApp, firestore: db } = initializeFirebase();

const LOCAL_STORAGE_KEY = 'ksef_invoices_local_db';
const INVOICES_COLLECTION = "invoices";

// Lista administratorów
const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu'];

function getLocalInvoices() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function findInvoiceByDetails(invoiceNumber: string) {
  if (!invoiceNumber) return null;
  
  try {
    const q = query(
      collection(db, INVOICES_COLLECTION), 
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
  try {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    const isAdmin = user && adminEmails.includes(user.email || '');

    // Tylko admin może zapisywać w Firebase
    if (!isAdmin) {
      throw new Error("Brak uprawnień do zapisu.");
    }

    const existing = await findInvoiceByDetails(invoiceData.invoiceNumber);
    
    const dataToSave = {
      ...invoiceData,
      lastModifiedBy: user.email,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      const docRef = doc(db, INVOICES_COLLECTION, existing.id);
      await updateDoc(docRef, dataToSave);
      return { status: 'updated', id: existing.id };
    }

    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
      ...dataToSave,
      createdAt: new Date().toISOString(),
      status: 'ACCEPTED'
    });
    return { status: 'added', id: docRef.id };
  } catch (error) {
    console.error("Błąd zapisu w Firestore:", error);
    throw error;
  }
}

export async function getAllInvoices() {
  try {
    const querySnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Błąd pobierania faktur:", error);
    return getLocalInvoices();
  }
}

export async function deleteInvoice(id: string) {
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;
  const isAdmin = user && adminEmails.includes(user.email || '');

  if (!isAdmin) throw new Error("Brak uprawnień.");

  await deleteDoc(doc(db, INVOICES_COLLECTION, id));
}

export async function deleteAllInvoices() {
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;
  const isAdmin = user && adminEmails.includes(user.email || '');

  if (!isAdmin) throw new Error("Brak uprawnień.");

  try {
    const querySnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    if (querySnapshot.empty) return true;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((d) => {
      batch.delete(doc(db, INVOICES_COLLECTION, d.id));
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Błąd czyszczenia bazy danych:", error);
    throw error;
  }
}
