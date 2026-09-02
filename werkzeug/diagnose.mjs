// Zweiter Erkundungslauf. Der erste hat gezeigt: die Vereinsseite kommt
// als vollstaendiges HTML zurueck, und der Endpunkt hinter den Widgets
// existiert - er wies nur die Platzhalter-Kennung ab.
// Jetzt: Welche Kennung gehoert zu welcher Mannschaft, und wie sieht der
// Spielplan aus, den der Endpunkt liefert?

const VEREIN = "https://www.fussball.de/verein/fsc-rheda-westfalen/-/id/00ES8GN8TC000068VV0AG08LVUPGND5I";
const KOPF = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9"
};
const zeile = s => console.log(s);
const trenner = t => zeile("\n" + "=".repeat(70) + "\n" + t + "\n" + "=".repeat(70));
const text = h => h.replace(/<script[^>]*>[^]*?<\/script>/gi," ")
                    .replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ")
                    .replace(/\s+/g," ").trim();

async function hole(url){
  const r = await fetch(url, { headers: KOPF, redirect: "follow" });
  const t = await r.text();
  zeile("  " + r.status + " " + r.statusText + " · " + t.length + " Zeichen");
  return { status: r.status, html: t };
}

(async () => {
  trenner("1) Kennung -> Mannschaftsname");
  const { html: v } = await hole(VEREIN);
  const gefunden = new Map();
  const re = /href="([^"]*\/mannschaft\/[^"]*team-id\/([A-Z0-9]{20,})[^"]*)"/gi;
  let m;
  while ((m = re.exec(v)) !== null){
    if (gefunden.has(m[2])) continue;
    const um = text(v.slice(Math.max(0, m.index - 500), m.index + 500));
    gefunden.set(m[2], um.slice(-220));
  }
  zeile("");
  for (const [id, um] of gefunden) zeile(id + "\n    …" + um + "\n");

  // Herrenmannschaften erkennen: der Spielplan nennt die Altersklasse
  const herren = [...gefunden].filter(([,u]) => /Herren/i.test(u)).map(([id]) => id);
  trenner("2) Als Herren erkannt: " + (herren.length ? herren.join(", ") : "keine"));

  const proben = herren.length ? herren.slice(0,2) : [...gefunden.keys()].slice(0,2);
  for (const id of proben){
    trenner("3) Spielplan-Endpunkt für " + id);
    for (const art of ["prev","next"]){
      const url = "https://www.fussball.de/ajax.team." + art + ".games/-/mode/PAGE/team-id/" + id;
      zeile("\n> " + art);
      const { status, html } = await hole(url);
      if (status !== 200) { zeile("  (kein Treffer)"); continue; }
      zeile("  Rohtext, erste 900 Zeichen:");
      zeile("  " + text(html).slice(0, 900));
      zeile("\n  HTML-Gerüst, erste 1600 Zeichen:");
      zeile(html.replace(/\s+/g," ").slice(0, 1600));
      // Welche Klassennamen tauchen auf? Daraus entsteht der Parser.
      const klassen = [...new Set([...html.matchAll(/class="([^"]+)"/g)].map(x=>x[1]))].slice(0,40);
      zeile("\n  Klassennamen: " + klassen.join(" | "));
    }
  }
})();
