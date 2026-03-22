
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export async function findInvoiceByDetails(invoiceNumber: string, sellerNip: string) {
  if (!invoiceNumber) return null;
  
  const q = query(
    collection(db, "invoices"), 
    where("invoiceNumber", "==", invoiceNumber),
    where("sellerNip", "==", sellerNip),
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
  const invoiceNumber = invoiceData.invoiceNumber;
  const sellerNip = invoiceData.sellerNip || invoiceData.seller?.nip || "";
  
  const existing = await findInvoiceByDetails(invoiceNumber, sellerNip);
  
  if (existing) {
    const docRef = doc(db, "invoices", existing.id);
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Aktualizujemy tylko puste pola, np. dodajemy PDF do istniejącego rekordu XML
    if (invoiceData.pdfDataUri && !existing.pdfDataUri) {
      updateData.pdfDataUri = invoiceData.pdfDataUri;
    }
    
    // Jeśli przesyłamy pełne dane z XML, a mamy tylko PDF, aktualizujemy całość
    if (invoiceData.items && !existing.items) {
      Object.assign(updateData, invoiceData);
    }

    await updateDoc(docRef, updateData);
    return { status: 'updated', id: existing.id };
  }

  try {
    const docRef = await addDoc(collection(db, "invoices"), {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACCEPTED'
    });
    return { status: 'added', id: docRef.id };
  } catch (error) {
    console.error("Błąd podczas dodawania faktury:", error);
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
