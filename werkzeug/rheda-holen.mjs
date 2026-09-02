// Holt die Spielplaene der beiden Herrenmannschaften des FSC Rheda von
// fussball.de und legt sie als daten/rheda.json ab.
//
// Was NICHT geholt wird: die Ergebnisse. fussball.de setzt sie als
// Zeichen aus dem privaten Unicode-Bereich, die erst eine eigene
// Schriftart zu Ziffern macht - eine bewusste Sperre. Sie wird hier
// nicht umgangen. Die Tore traegt die Anwendung von Hand nach; dieser
// Abruf nimmt ihr nur das Nachschlagen von Datum, Gegner und Wettbewerb ab.

import { writeFileSync, mkdirSync } from "node:fs";

const MANNSCHAFTEN = [
  { appName: "FSC Rheda I",  name: "FSC Rheda",    teamId: "011MIB0SGC000000VTVG0001VTR8C1K7" },
  { appName: "FSC Rheda II", name: "FSC Rheda II", teamId: "011MI95U5G000000VTVG0001VTR8C1K7" }
];

const KOPF = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9"
};

// ME = Meisterschaft, PO = Pokal, FS = Freundschaftsspiel, TU = Turnier.
// Gezahlt wird nur fuer Meisterschaftsspiele.
const ARTEN = { ME: "liga", PO: "pokal", FS: "freund", TU: "turnier" };

const sauber = s => String(s||"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
  .replace(/&#x([0-9A-Fa-f]+);/g, (_,h) => {
    const n = parseInt(h,16);
    // Zeichen aus dem privaten Bereich sind die verschleierten Ziffern.
    // Sie werden verworfen, nicht entschluesselt.
    return (n >= 0xE000 && n <= 0xF8FF) ? "•" : String.fromCodePoint(n);
  })
  .replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

async function hole(url){
  const r = await fetch(url, { headers: KOPF, redirect: "follow" });
  if (!r.ok) throw new Error(url + " antwortete mit " + r.status);
  return r.text();
}

function spieleAus(html, mannschaft){
  const zeilen = html.split(/<tr\b/i).slice(1);
  const raus = [];
  let datum = null, zeit = null, wettbewerb = null, art = null, nr = null;

  for (const roh of zeilen){
    const klasse = (roh.match(/^[^>]*class="([^"]*)"/i) || [,""])[1];

    if (/row-headline/.test(klasse)){
      const t = sauber(roh);
      const d = t.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      const u = t.match(/(\d{1,2}):(\d{2})/);
      datum = d ? d[3]+"-"+d[2]+"-"+d[1] : null;
      zeit  = u ? u[1].padStart(2,"0")+":"+u[2] : null;
      const teile = t.split("|");
      wettbewerb = teile.length > 1 ? teile[teile.length-1].trim() : null;
      art = null; nr = null;
      continue;
    }

    if (/row-competition/.test(klasse)){
      const k = roh.match(/<a[^>]*>\s*([A-Z]{2})\s*\|\s*(\d+)\s*<\/a>/);
      if (k){ art = ARTEN[k[1]] || "sonstiges"; nr = k[2]; }
      const w = roh.match(/class="column-team"[^]*?<a[^>]*>([^<]+)<\/a>/);
      if (w && !wettbewerb) wettbewerb = sauber(w[1]);
      continue;
    }

    // Die Paarungszeile: zwei Vereinsnamen nebeneinander.
    const namen = [...roh.matchAll(/class="club-name"[^>]*>\s*([^<]+?)\s*<\/div>/g)].map(x => sauber(x[1]));
    if (namen.length !== 2) continue;

    const kennungen = [...roh.matchAll(/team-id\/([A-Z0-9]{20,})/g)].map(x => x[1]);
    let eigenIdx = kennungen.indexOf(mannschaft.teamId);
    if (eigenIdx < 0) eigenIdx = namen.findIndex(n => n === mannschaft.name);
    if (eigenIdx < 0) continue;                       // fremde Paarung

    const txt = sauber(roh);
    raus.push({
      nr, datum, zeit,
      wettbewerb: wettbewerb || "unbekannt",
      art: art || "sonstiges",
      heim: eigenIdx === 0,
      gegner: namen[eigenIdx === 0 ? 1 : 0],
      abgesetzt: /Absetzung|abgesetzt|Ausfall/i.test(txt)
    });
    datum = zeit = wettbewerb = art = nr = null;
  }
  return raus;
}

const prüfmodus = process.argv.includes("--pruefen");

(async () => {
  const mannschaften = [];
  for (const m of MANNSCHAFTEN){
    const alle = new Map();
    for (const art of ["prev","next"]){
      const html = await hole("https://www.fussball.de/ajax.team."+art+".games/-/mode/PAGE/team-id/"+m.teamId);
      for (const s of spieleAus(html, m)) if (s.nr) alle.set(s.nr, s);
    }
    const spiele = [...alle.values()].sort((a,b) => String(a.datum||"").localeCompare(String(b.datum||"")));
    const liga = spiele.filter(s => s.art === "liga").map(s => s.wettbewerb)
                       .sort((a,b)=>a.localeCompare(b))[0] || null;
    mannschaften.push({ appName: m.appName, name: m.name, teamId: m.teamId, liga, spiele });

    console.log("\n" + m.appName + "  (" + (liga||"?") + ")");
    console.log("  " + spiele.length + " Spiele, davon " +
      spiele.filter(s=>s.art==="liga").length + " Meisterschaft, " +
      spiele.filter(s=>s.art==="pokal").length + " Pokal, " +
      spiele.filter(s=>s.art==="freund").length + " Freundschaft");
    for (const s of spiele.slice(0,6))
      console.log("   " + (s.datum||"?") + " " + (s.zeit||"") + "  " +
        (s.heim ? "H" : "A") + "  " + (s.gegner||"?").padEnd(28) +
        s.art.padEnd(9) + (s.abgesetzt ? "abgesetzt" : "") + "  #" + s.nr);
  }

  const gesamt = mannschaften.reduce((n,m) => n + m.spiele.length, 0);
  if (!gesamt) { console.error("\nFEHLER: kein einziges Spiel erkannt – die Seitenstruktur hat sich geändert."); process.exit(1); }

  if (prüfmodus){ console.log("\nPrüflauf – es wird nichts geschrieben."); return; }

  mkdirSync("daten", { recursive: true });
  writeFileSync("daten/rheda.json", JSON.stringify({
    stand: new Date().toISOString(),
    quelle: "fussball.de",
    hinweis: "Nur Spielpaarungen. Die Ergebnisse sind auf fussball.de nicht maschinenlesbar und werden in der Anwendung von Hand nachgetragen.",
    mannschaften
  }, null, 2) + "\n");
  console.log("\ndaten/rheda.json geschrieben (" + gesamt + " Spiele).");
})();
