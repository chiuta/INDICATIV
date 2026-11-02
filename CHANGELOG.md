# Jurnal de modificări — INDICATIV

## 2.3.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.3.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — testul de cunoștințe poate fi trimis către Undava ca quiz (plic .fff.json, cu confirmare înainte de import). Fără rețea, fără telemetrie.

## 2.2.0 — 2026-10-27 (anterior: 2.1.0)

- Test nou `tests/barem.test.mjs`: baremul simulării rămâne egal cu art. 14 din Decizia ANCOM 245/2017 (textul inițial). Fără schimbări de comportament.
- Nu implementat: validare oficială a băncii; confirmarea baremului din textul consolidat / Decizia 139/2022 (nicio sursă verificată accesibilă); durata oficială a examenului; procentul de întrebări verificate rămâne nemăsurat.

## 2.1.0 — 2026-10-27 (anterior: 2.0.0)

- Nou: buton „Raportează o greșeală” la fiecare întrebare (mailto către alexio@trom.tf, precompletat cu codul întrebării; nimic nu se trimite automat).
- Nou: mențiune vizibilă pe ecranul Acasă — „bancă nevalidată oficial ANCOM”, cu ce s-a verificat efectiv (răspunsuri numerice de radiotehnică, peste 150 din 723). Procentul exact de întrebări verificate nu este afirmat.
- Nou: notă „Barem” pe ecranul Examen, cu valorile comparate cu art. 14 din Decizia ANCOM 245/2017 (text inițial); modificările ulterioare marcate „de verificat”.
- README: „Stare” și „Offline: complet”.
- Existau deja (nu s-au modificat): simulare de examen cu timp opțional, istoric al examenelor, estimare de reușită.
- Nu implementat: validare oficială a băncii; confirmarea baremului din textul consolidat în vigoare; durata oficială a examenului (nestabilită în decizie).
