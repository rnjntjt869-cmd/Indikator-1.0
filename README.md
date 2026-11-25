# Website David Papa – Der Kilo-Pakt

Statische Website aus HTML, CSS und JavaScript. Es gibt keinen Build-Schritt und keine Abhängigkeiten. Du lädst die Dateien einfach auf einen Webspace hoch.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Quittung im Hero, Problem, Traumergebnis, Davids Geschichte, Methode (Körper, Kopf, Konsequenz), Ziel-Rechner, Ergebnisse, Ablauf, Fragen, Call-to-Action |
| `ueber-mich.html` | Davids Geschichte, Vorher-nachher-Regler, was er mitbringt und was nicht |
| `angebot.html` | Der Kilo-Pakt im Detail: Leistungen, für wen, Abrechnungsregeln mit Beispiel, Vergleich, Pflichten, Ziel-Rechner, alle Fragen |
| `erfolge.html` | Ergebnisse aus der Familie, Kundenstimmen-Karussell, Vorher-nachher-Regler |
| `kontakt.html` | Erstgespräch: Kalender, Uhrzeit, Gesprächsart, kurzes Formular |
| `impressum.html`, `datenschutz.html` | Rechtliches, noch mit Platzhaltern |

## Einstellungen ändern

Alles Wichtige steht in `assets/js/config.js`:

- `preisProKilo`: Preis pro verlorenem Kilo. Quittung, Rechner und Preisangaben passen sich automatisch an. Nur die strukturierten Daten (JSON-LD) im Kopf von `index.html` musst du von Hand ändern.
- `neueKlientenProWoche`: echte Kapazität, wird auf mehreren Seiten angezeigt.
- `formularEndpunkt`: Adresse des Formular-Dienstes. Solange das Feld leer ist, läuft das Formular im Vorschau-Modus und verschickt nichts.
- `uhrzeiten`, `freieTage`, `tageVoraus`: was der Buchungskalender anbietet.

## Vor dem Livegang

- [ ] Rosa markierte Platzhalter ersetzen: Fotos, Zitate, eigene Kilozahl, Kontaktdaten (Suche nach `ph`).
- [ ] Impressum vollständig ausfüllen. Ohne Impressum darf die Seite in Deutschland nicht online gehen.
- [ ] Datenschutzerklärung mit einem Generator (z. B. eRecht24) oder von einer Anwältin prüfen lassen.
- [ ] Formular-Dienst anbinden und in der Datenschutzerklärung nennen.
- [ ] Domain festlegen.
- [ ] Die Zeile `<meta name="robots" content="noindex, nofollow">` aus allen Seiten entfernen, damit Google die Seite findet.
- [ ] Vertrag für den Kilo-Pakt juristisch prüfen lassen: Wiegen, Tiefstwert, Abrechnung, Kündigung, Widerrufsrecht.

## Fotos einbauen

- Vorher-nachher: Im jeweiligen `ba__layer--before` bzw. `ba__layer--after` den Platzhalter `<div class="ph-box">…</div>` ersetzen durch `<img src="assets/img/matteo-vorher.jpg" alt="Matteo vorher">`.
- Porträt auf der Startseite: Im `figure class="portrait"` den Platzhalter durch ein `<img>` ersetzen.
- Bilder vorher auf etwa 1200 Pixel Breite verkleinern und als JPG oder WebP speichern.

## Lokal ansehen

```bash
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

## Veröffentlichen

- GitHub Pages: im Repository unter Settings, Pages den Branch und den Ordner `/` wählen.
- Netlify oder Cloudflare Pages: Ordner hochladen oder das Repository verbinden. Ein Build-Befehl ist nicht nötig.

## Technik

- Schrift: Archivo (SIL Open Font License, siehe `assets/fonts/OFL.txt`), lokal eingebunden. Die Seite stellt keine Verbindung zu Google her.
- Keine Cookies, kein Tracking.
- Getestet auf 1440 und 375 Pixel Breite, ohne Konsolenfehler, mit automatischem Barrierefreiheits-Check (axe-core, WCAG 2.1 AA).
