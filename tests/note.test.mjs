// INDICATIV — câmpul `note` al întrebărilor se afișează după răspuns (antrenament), cu etichetă tradusă în toate limbile.
// Rulare: node tests/note.test.mjs  (fără browser)
import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url";
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const h = fs.readFileSync(path.join(R, "index.html"), "utf8");
let bad = 0; const ok = (n, c) => { console.log((c ? "  ok   " : "  FAIL ") + n); if (!c) bad++; };
for (const l of ["ro", "en", "fr", "it", "es", "pt", "de", "hu"]) ok("fb_note în " + l, new RegExp("Object\\.assign\\(I18N\\." + l + ", \\{fb_note:\"[^\"]+\"\\}\\)").test(h));
ok("paintTrainFeedback adaugă q.note", /typeof q\.note === "string" && q\.note \? "\\n" \+ t\("fb_note"\) \+ q\.note/.test(h));
const m = h.match(/const QUESTIONS = (\[[\s\S]*?\]);\n/);
const Q = JSON.parse(m[1]);
ok("există întrebări cu notă nenulă (>=2)", Q.filter((x) => typeof x.note === "string" && x.note).length >= 2);
console.log(bad ? bad + " eșecuri" : "toate testele au trecut"); process.exit(bad ? 1 : 0);
