# **App Name**: KSeF Faktury

## Core Features:

- Uwierzytelnianie użytkowników i profil: Bezpieczna rejestracja, logowanie i zarządzanie profilem firmy (NIP, REGON, adres itp.) dla potrzeb KSeF, z danymi profilu przechowywanymi w Firestore.
- Tworzenie i zarządzanie fakturami: Intuicyjny interfejs do tworzenia, edytowania i zarządzania fakturami sprzedaży i zakupu, w tym pozycjami, stawkami VAT i warunkami płatności. Podstawowa struktura danych w Firestore będzie oparta na polach wyodrębnionych z dostarczonego wzorca pliku XML faktury, zapewniając zgodność i kompleksowe gromadzenie danych.
- Generowanie XML KSeF: Automatyczne generowanie plików XML zgodnych z KSeF na podstawie danych faktury, zgodnie z najnowszymi specyfikacjami schematu KSeF.
- Wysyłka i śledzenie statusu KSeF: Bezpośrednie przesyłanie wygenerowanych plików XML do systemu KSeF za pośrednictwem API i śledzenie statusów przesyłki w czasie rzeczywistym (np. odebrane, przetworzone, odrzucone), z logami statusów przechowywanymi w Firestore.
- Narzędzie AI do walidacji XML: Narzędzie oparte na AI, które analizuje pliki XML KSeF przed przesłaniem, dostarczając sugestie dotyczące korekty błędów i zapewnienia zgodności z zasadami schematu KSeF.
- Wyszukiwanie i filtrowanie faktur z paginacją: Rozbudowane funkcje wyszukiwania i filtrowania, umożliwiające szybkie znajdowanie konkretnych faktur według daty, klienta, kwoty lub numeru referencyjnego KSeF, wyświetlane w tabeli z paginacją (50 rekordów na stronę) i zaawansowanym filtrowaniem kolumn, wszystko zasilane danymi z Firestore.
- Akcje dokumentów faktur: Umożliwienie działań na pojedynczych wpisach faktur, w tym podglądu PDF, pobierania plików XML KSeF oraz generowania Potwierdzeń Odbioru (PZ) w formacie TXT, z interakcją z plikami przechowywanymi w Firebase Storage.
- Panel administratora - masowy import dokumentów: Sekcja administracyjna umożliwiająca masowe przesyłanie i przetwarzanie plików XML i PDF faktur do systemu, z przechowywaniem plików w Firebase Storage i ich metadanych w Firestore.

## Style Guidelines:

- Główny ciemny niebieski (#226EDB) symbolizuje profesjonalizm i zaufanie. Tło to bardzo jasny, nasycony błękit (#ECF2F9) dla czystego, spokojnego płótna. Akcentowy kolor to żywy cyjan (#33CCCC), który zapewnia wyraźne podkreślenia i elementy akcji, kontrastując ostro, lecz harmonijnie z głównymi odcieniami.
- 'Inter', bezszeryfowy krój pisma w stylu groteski, charakteryzujący się nowoczesnym, obiektywnym i bardzo czytelnym stylem, odpowiednim dla aplikacji finansowej.
- Użyj czystego, nowoczesnego zestawu ikon liniowych dla przejrzystości i intuicyjnej nawigacji, szczególnie dla akcji związanych z fakturami, takich jak 'Podgląd PDF', 'Pobierz XML' i 'Generuj PZ (TXT)', zgodnie z profesjonalną i efektywną estetyką.
- Przyjmij ustrukturyzowany i responsywny układ, wykorzystując spójny system siatki i dużą przestrzeń wokół elementów, aby zmniejszyć wizualny bałagan. Priorytetem jest czytelność danych, zwłaszcza w tabelach z paginacją i zaawansowanym filtrowaniem, zapewniając logiczny przepływ krytycznych informacji finansowych.
- Wprowadź subtelne i funkcjonalne animacje dla informacji zwrotnej użytkownika, takie jak wskaźniki ładowania danych (np. paginacja tabeli, filtrowanie), potwierdzenia pomyślnego przesłania lub podkreślanie nowo zaktualizowanych wpisów danych, aby poprawić doświadczenie użytkownika bez rozpraszania.