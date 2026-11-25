/*
  Zentrale Einstellungen der Website.
  Wenn du hier etwas änderst, passt sich die Seite überall an
  (Quittung, Ziel-Rechner, Preisangaben, Terminbuchung).
*/
window.SITE = {
  // Euro pro verlorenem Kilo
  preisProKilo: 50,

  // Echte Kapazität: so viele neue Leute startest du pro Woche
  neueKlientenProWoche: 4,

  // Erstgespräch-Formular.
  // Leer lassen = Vorschau-Modus: Das Formular funktioniert, verschickt aber nichts.
  // Später z. B. die Adresse von Formspree oder einem anderen Formular-Dienst eintragen.
  formularEndpunkt: "",

  // Wunschzeiten, die im Kalender angeboten werden
  uhrzeiten: ["09:00", "11:00", "13:00", "16:00", "18:00", "20:00"],

  // Wochentage ohne Termine (0 = Sonntag, 6 = Samstag)
  freieTage: [0],

  // So viele Tage im Voraus kann man einen Termin wählen
  tageVoraus: 30
};
