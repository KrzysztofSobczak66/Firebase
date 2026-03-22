
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  limit,
  writeBatch,
  getFirestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

// Lista administratorów
const adminEmails = ['admin@ksef.pl', 'krzysztof.sobczak@sp-partner.eu'];

/**
 * Czyści obiekt z wartości 'undefined', których Firestore nie akceptuje.
 */
function sanitizeForFirestore(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Funkcja pomocnicza do pobierania instancji bazy danych.
 */
function getDb() {
  const { firestore } = initializeFirebase();
  return firestore;
}

/**
 * Sprawdza czy faktura o danym numerze już istnieje w globalnej bazie.
 */
export async function findInvoiceByDetails(invoiceNumber: string) {
  if (!invoiceNumber) return null;
  const db = getDb();
  
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

/**
 * Zapisuje fakturę w globalnej kolekcji. Dostępne tylko dla administratorów.
 * Jeśli faktura istnieje, aktualizuje ją.
 */
export async function saveInvoice(invoiceData: any): Promise<{ status: 'added' | 'updated', id: string }> {
  const db = getDb();
  const { firebaseApp } = initializeFirebase();
  
  try {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    const isAdmin = user && adminEmails.includes(user.email || '');

    if (!isAdmin) {
      throw new Error("Brak uprawnień do zapisu. Tylko administrator może modyfikować bazę.");
    }

    const existing = await findInvoiceByDetails(invoiceData.invoiceNumber);
    
    // Usuwamy undefined przed zapisem
    const cleanData = sanitizeForFirestore({
      ...invoiceData,
      lastModifiedBy: user.email,
      updatedAt: new Date().toISOString()
    });

    if (existing) {
      const docRef = doc(db, "invoices", existing.id);
      await updateDoc(docRef, cleanData);
      return { status: 'updated', id: existing.id };
    }

    const docRef = await addDoc(collection(db, "invoices"), {
      ...cleanData,
      createdAt: new Date().toISOString(),
      status: 'ACCEPTED'
    });
    return { status: 'added', id: docRef.id };
  } catch (error) {
    console.error("Błąd zapisu w Firestore:", error);
    throw error;
  }
}

/**
 * Pobiera wszystkie faktury z globalnej kolekcji.
 */
export async function getAllInvoices() {
  const db = getDb();
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

/**
 * Usuwa fakturę. Dostępne tylko dla administratorów.
 */
export async function deleteInvoice(id: string) {
  const db = getDb();
  const { firebaseApp } = initializeFirebase();
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;
  const isAdmin = user && adminEmails.includes(user.email || '');

  if (!isAdmin) throw new Error("Brak uprawnień do usuwania.");

  await deleteDoc(doc(db, "invoices", id));
}

/**
 * Czyści całą bazę faktur. Dostępne tylko dla administratorów.
 */
export async function deleteAllInvoices() {
  const db = getDb();
  const { firebaseApp } = initializeFirebase();
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;
  const isAdmin = user && adminEmails.includes(user.email || '');

  if (!isAdmin) throw new Error("Brak uprawnień do czyszczenia bazy.");

  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    if (querySnapshot.empty) return true;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((d) => {
      batch.delete(doc(db, "invoices", d.id));
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Błąd czyszczenia bazy danych:", error);
    throw error;
  }
}
