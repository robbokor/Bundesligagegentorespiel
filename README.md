# Bundesligagegentorespiel

Das Gegentorespiel der Mannschaft: Jeder zieht zu Saisonbeginn eine Mannschaft
und zahlt für jedes ihrer Gegentore einen festgelegten Betrag in die
Mannschaftskasse. Wer am Saisonende die meisten Gegentore gesammelt hat, hat am
meisten bezahlt.

**Zur Anwendung:** https://robbokor.github.io/Bundesligagegentorespiel/

## Was hier liegt

Eine einzige HTML-Datei (`index.html`). Kein Server, kein Build, keine
Abhängigkeiten.

## Wie gespielt wird

1. **Auslosung** – Namen eintragen, den Lostopf zusammenstellen, ziehen.
   Angekreuzt wird gezogen: so kommen einzelne Vereine dazu, ohne ihre ganze
   Liga mitzuschleppen – etwa der SC Verl aus der 3. Liga neben den beiden
   Bundesligen und den eigenen Mannschaften. Standardmäßig bekommt jede
   Mannschaft nur einen Spieler.
2. **Ergebnisse** – die Bundesliga-Spieltage auf Knopfdruck abrufen; die
   eigenen Mannschaften von Hand eintragen.
3. **Stand** – Rangliste nach Gegentoren, dazu fällig, bezahlt und offen.
4. **Kasse** – Zahlungen buchen.

Einsatz je Gegentor, ein optionaler Höchstbetrag je Spieler und die Saison
stehen unter **Mehr**.

## Woher die Ergebnisse kommen

1. Bundesliga, 2. Bundesliga und 3. Liga von
[OpenLigaDB](https://www.openligadb.de/) – frei zugänglich, ohne Anmeldung,
ohne Schlüssel. Nach außen geht dabei nur die Anfrage nach Spielplan und
Ergebnissen einer Liga, nichts über die Mitspieler.

Nach dem Laden der 3. Liga liegt von dort zunächst *keine* Mannschaft im
Lostopf – die gewünschte wird unter *Auslosung* einzeln angekreuzt.

Für Kreisligen gibt es keine öffentliche Schnittstelle. Die Spiele der eigenen
Mannschaften werden deshalb von Hand erfasst. Ein erneuter Abruf der Bundesliga
lässt diese Einträge unangetastet.

## Wo die Daten liegen

**Nicht hier.** Mitspieler, Ergebnisse und Kasse entstehen ausschließlich im
Browser des Geräts, auf dem die Seite geöffnet wird (`localStorage`), und
verlassen es nie. Dieses Repository enthält keine personenbezogenen Daten.

Daraus folgen zwei Dinge:

* **Ein Gerät führt die Kasse.** Wer die Seite auf einem anderen Gerät öffnet,
  fängt bei null an. Es gibt keinen gemeinsamen Stand über mehrere Geräte.
* **Regelmäßig sichern.** Unter *Mehr → Sicherung* lässt sich der ganze Stand
  als Datei speichern und wieder einlesen. Wird der Browserverlauf gelöscht,
  ist der Stand sonst weg.

## Aufs Handy oder Tablet legen

1. Die Adresse oben im Browser öffnen.
2. Teilen-Symbol → **Zum Home-Bildschirm**.

Die Seite startet dann im Vollbild wie eine App.
