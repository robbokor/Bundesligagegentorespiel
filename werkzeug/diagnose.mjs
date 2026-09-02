// Einmaliger Erkundungslauf: Was liefert fussball.de ueberhaupt aus?
// Laeuft auf GitHubs Servern, nicht im Browser - die Same-Origin-Grenze
// gilt hier nicht. Das Ergebnis steht im Protokoll des Arbeitsablaufs.

const VEREIN = "https://www.fussball.de/verein/fsc-rheda-westfalen/-/id/00ES8GN8TC000068VV0AG08LVUPGND5I";

const KOPF = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9"
};

function zeile(s){ console.log(s); }
function trenner(t){ zeile("\n" + "=".repeat(70) + "\n" + t + "\n" + "=".repeat(70)); }

async function hole(url){
  const t0 = Date.now();
  try{
    const r = await fetch(url, { headers: KOPF, redirect: "follow" });
    const text = await r.text();
    zeile("Status      : " + r.status + " " + r.statusText);
    zeile("Endadresse  : " + r.url);
    zeile("Inhaltstyp  : " + (r.headers.get("content-type") || "-"));
    zeile("Groesse     : " + text.length + " Zeichen");
    zeile("Dauer       : " + (Date.now()-t0) + " ms");
    return text;
  }catch(e){
    zeile("FEHLER: " + e.message);
    return null;
  }
}

function bots(h){
  const verdacht = [];
  if (/captcha|cf-browser-verification|challenge-platform|Just a moment/i.test(h)) verdacht.push("Bot-Schutz-Merkmale gefunden");
  if (/<noscript>[^]*?aktivier/i.test(h)) verdacht.push("verlangt moeglicherweise JavaScript");
  if (h.length < 3000) verdacht.push("auffaellig kurze Antwort");
  return verdacht;
}

(async () => {
  trenner("1) Vereinsseite FSC Rheda");
  const v = await hole(VEREIN);
  if (v){
    const w = bots(v);
    zeile("Auffaelligkeiten: " + (w.length ? w.join("; ") : "keine"));
    const titel = v.match(/<title[^>]*>([^<]*)<\/title>/i);
    zeile("Titel       : " + (titel ? titel[1].trim() : "-"));

    // Mannschaftslinks samt Kennung einsammeln
    const treffer = [...v.matchAll(/href="([^"]*\/mannschaft\/[^"]*team-id\/([A-Z0-9]{20,})[^"]*)"/gi)];
    const gesehen = new Map();
    for (const t of treffer) if (!gesehen.has(t[2])) gesehen.set(t[2], t[1]);
    zeile("\nGefundene Mannschaften: " + gesehen.size);
    let i = 0;
    for (const [id, href] of gesehen){
      if (++i > 25) { zeile("  ... weitere ausgelassen"); break; }
      const name = decodeURIComponent(href).match(/\/mannschaft\/([^\/]+)/);
      zeile("  " + id + "  " + (name ? name[1] : "?"));
    }
    if (!gesehen.size){
      zeile("\n--- Anfang der Antwort (1200 Zeichen) ---");
      zeile(v.slice(0, 1200));
    }
  }

  trenner("2) Sind die Widget-Endpunkte offen? (Vermutung, wird hier geprueft)");
  for (const pfad of [
    "https://www.fussball.de/ajax.team.prev.games/-/mode/PAGE/team-id/PLATZHALTER",
    "https://www.fussball.de/ajax.club.matchplan/-/mode/PAGE/club-id/00ES8GN8TC000068VV0AG08LVUPGND5I"
  ]){
    zeile("\n> " + pfad);
    const a = await hole(pfad);
    if (a) zeile("Anfang: " + a.slice(0,200).replace(/\s+/g," "));
  }

  trenner("3) Ergebnis");
  zeile("Bewertung erfolgt von Hand anhand der Ausgabe oben.");
})();
