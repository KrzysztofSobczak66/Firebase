
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  // Funkcja do tworzenia/aktualizacji profilu w Firestore
  const syncUserProfile = async (uid: string, userEmail: string) => {
    try {
      await setDoc(doc(db, "userProfiles", uid), {
        email: userEmail,
        createdAt: new Date().toISOString(),
        lastLogin: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.error("Błąd synchronizacji profilu:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(cred.user.uid, email);
      router.push('/dashboard');
      toast({ title: 'Witaj ponownie!', description: 'Zalogowano pomyślnie.' });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Błąd logowania', 
        description: 'Nieprawidłowy e-mail lub hasło.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await syncUserProfile(cred.user.uid, email);
      router.push('/dashboard');
      toast({ title: 'Konto utworzone', description: 'Witaj w systemie KSeF Studio.' });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Błąd rejestracji', 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="text-white h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">KSeF Studio</h1>
          <p className="text-slate-500">Zarządzaj fakturami profesjonalnie i bezpiecznie</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Logowanie</TabsTrigger>
            <TabsTrigger value="signup">Rejestracja</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Zaloguj się</CardTitle>
                <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp do panelu.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="biuro@firma.pl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Hasło</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Zaloguj się'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Utwórz konto</CardTitle>
                <CardDescription>Dołącz do użytkowników KSeF Studio i izoluj swoje dane.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-new">E-mail firmowy</Label>
                    <Input id="email-new" type="email" placeholder="biuro@firma.pl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-new">Hasło</Label>
                    <Input id="password-new" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-accent text-white" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Utwórz konto firmowe'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-widest">
          <ShieldCheck className="h-4 w-4" />
          Bezpieczne połączenie i izolacja danych
        </div>
      </div>
    </div>
  );
}
