// INDICATIV — garda de regresie pentru baremul simulării: EXAM_STRUCTURE trebuie să rămână egal cu art. 14 din Decizia ANCOM 245/2017
// (textul inițial, M.Of. 261/2017, comparat la 2026-10-27). NU validează textul consolidat în vigoare (neconfirmat de o sursă verificată).
// Rulare: node tests/barem.test.mjs  (fără browser)
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import {fileURLToPath} from "node:url";
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const h = fs.readFileSync(path.join(R, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL:", m); } };
const m = /const EXAM_STRUCTURE = (\{[\s\S]*?\n\});/.exec(h); ok(!!m, "EXAM_STRUCTURE găsit");
const ES = vm.runInNewContext("(" + m[1] + ")");
const A = {radiotehnica: [20, 15], protectia_muncii: [10, 7], proceduri: [8, 6], reglementari: [25, 20]};          // art. 14 alin. 1 (clasele I și II)
const B = {radiotehnica: [16, 12], protectia_muncii: [10, 7], proceduri: [8, 6], reglementari: [20, 15]};          // alin. 2 (clasa III)
const C = {protectia_muncii: [10, 7], proceduri: [8, 6], reglementari: [20, 15]};                                  // alin. 3 (clasa IV)
const ref = {"I-II": A, "III": B, "IV": C};
for (const [cls, exp] of Object.entries(ref)) {
  const got = Object.fromEntries((ES[cls] || []).map(s => [s.section, [s.count, s.min]]));
  ok(JSON.stringify(got, Object.keys(got).sort()) === JSON.stringify(exp, Object.keys(exp).sort()), "clasa " + cls + ": " + JSON.stringify(got));
}
ok(Object.keys(ES).sort().join() === "I-II,III,IV", "clase: " + Object.keys(ES));
console.log(`\n${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
