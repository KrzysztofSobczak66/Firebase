
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
  setDoc,
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
  const q = query(
    collection(db, "invoices"), 
    where("invoiceNumber", "==", invoiceNumber),
    where("sellerNip", "==", sellerNip),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
}

export async function saveInvoice(invoiceData: any) {
  const existing = await findInvoiceByDetails(invoiceData.invoiceNumber, invoiceData.sellerNip || invoiceData.seller?.nip || "");
  
  if (existing) {
    // Jeśli rekord istnieje, a my dodajemy nowe dane (np. PDF), aktualizujemy go
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
    status: 'ACCEPTED'
  });
  return { status: 'added', id: docRef.id };
}

export async function getAllInvoices() {
  const querySnapshot = await getDocs(collection(db, "invoices"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function deleteInvoice(id: string) {
  await deleteDoc(doc(db, "invoices", id));
}

export async function updateInvoice(id: string, data: any) {
  const docRef = doc(db, "invoices", id);
  await updateDoc(docRef, data);
}
