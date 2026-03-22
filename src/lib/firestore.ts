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
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicjalizacja Firebase z obsługą braku konfiguracji
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export async function findInvoiceByDetails(invoiceNumber: string) {
  if (!invoiceNumber) return null;
  
  // Uproszczone zapytanie tylko po numerze faktury, aby uniknąć problemów z indeksami
  const q = query(
    collection(db, "invoices"), 
    where("invoiceNumber", "==", invoiceNumber),
    limit(1)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    console.error("Błąd podczas wyszukiwania faktury:", error);
    return null;
  }
}

export async function saveInvoice(invoiceData: any) {
  try {
    const invoiceNumber = invoiceData.invoiceNumber;
    if (!invoiceNumber) {
      throw new Error("Brak numeru faktury w danych wejściowych.");
    }

    const existing = await findInvoiceByDetails(invoiceNumber);
    
    if (existing) {
      const docRef = doc(db, "invoices", existing.id);
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (invoiceData.pdfDataUri && !(existing as any).pdfDataUri) {
        updateData.pdfDataUri = invoiceData.pdfDataUri;
      }
      
      if (invoiceData.items && !(existing as any).items) {
        Object.assign(updateData, invoiceData);
      }

      await updateDoc(docRef, updateData);
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
    console.error("Szczegółowy błąd zapisu faktury:", error);
    throw error;
  }
}

export async function getAllInvoices() {
  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Błąd pobierania wszystkich faktur:", error);
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
