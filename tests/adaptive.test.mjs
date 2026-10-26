// INDICATIV 2.0 — simulator de examen adaptiv: selecție țintită pe lacune (SM-2) și estimare de reușită.
import {launch, check, summary, hOverflow} from "./_lib.mjs";

async function fresh(o) {
  const L = await launch(o);
  await L.page.evaluate(() => { const b = document.getElementById("welcomeOverlay"); if (b) b.style.display = "none"; });
  return L;
}
const nav = (page, s) => page.evaluate(x => document.querySelector(`.navitem[data-screen="${x}"]`).click(), s);

console.log("1. interfață");
{
  const {browser, page, st} = await fresh();
  await nav(page, "examsetup");
  check("selector de mod cu 2 opțiuni, implicit Adaptiv", (await page.locator("#examModeSeg button").count()) === 2 && (await page.getAttribute('#examModeSeg button[data-mode="adapt"]', "aria-pressed")) === "true");
  const est0 = await page.textContent("#examEst");
  check("cardul de estimare arată un procent, acoperirea și avertismentul", /\d+%/.test(est0) && /neoficial/i.test(est0) && /Din bancă ai văzut 0%/.test(est0), est0.slice(0, 300));
  check("fără date: estimarea avertizează că e nesigură", /Date puține/.test(est0));
  await page.click('#examModeSeg button[data-mode="rand"]');
  check("modul Aleator se salvează", (await page.evaluate(() => DB.settings.examMode)) === "rand" && (await page.getAttribute('#examModeSeg button[data-mode="rand"]', "aria-pressed")) === "true");
  await page.reload(); await page.waitForTimeout(500); await page.evaluate(() => { const b = document.getElementById("welcomeOverlay"); if (b) b.style.display = "none"; });
  await nav(page, "examsetup");
  check("modul persistă după reîncărcare", (await page.getAttribute('#examModeSeg button[data-mode="rand"]', "aria-pressed")) === "true");
  check("fără depășire orizontală", (await hOverflow(page)) <= 0);
  check("fără erori/rețea", st.errs.length === 0 && st.net.length === 0, [st.errs, st.net]);
  await browser.close();
}

console.log("2. selecția țintește lacunele");
{
  const {browser, page} = await fresh();
  const r = await page.evaluate(() => {
    const cls = "IV";
    // jumătate din întrebările fiecărei probe sunt „stăpânite”, restul nevăzute
    const mastered = new Set();
    EXAM_STRUCTURE[cls].forEach(spec => { const pool = poolFor([spec.section], cls); pool.forEach((q, i) => { if (i % 2 === 0) { mastered.add(q.id); DB.cards[q.id] = {reps: 5, ease: 2.6, interval: 30, due: Date.now() + 20 * 86400000, seen: true, lastCorrect: true}; } }); });
    const frac = mode => { let m = 0, n = 0; for (let k = 0; k < 40; k++) buildExamSession(cls, mode).forEach(b => b.questions.forEach(q => { n++; if (mastered.has(q.id)) m++; })); return m / n; };
    const sizes = buildExamSession(cls, "adapt").map(b => [b.questions.length, b.spec.count, new Set(b.questions.map(q => q.id)).size]);
    return {adapt: frac("adapt"), rand: frac("rand"), sizes};
  });
  check("aleator: ~50% întrebări stăpânite", r.rand > 0.4 && r.rand < 0.6, r.rand);
  check("adaptiv: sub 20% întrebări stăpânite (țintește lacunele)", r.adapt < 0.2, r.adapt);
  check("adaptiv păstrează structura (număr de întrebări per probă, fără duplicate)", r.sizes.every(s => s[0] === s[1] && s[2] === s[0]), r.sizes);
  await browser.close();
}

console.log("3. estimarea de reușită");
{
  const {browser, page} = await fresh();
  const r = await page.evaluate(() => {
    const cls = "IV"; const e0 = estimateExam(cls);
    // greșite recent -> și mai jos sau egal
    const some = poolFor(sectionsForClass(cls), cls);
    some.forEach(q => { DB.cards[q.id] = {reps: 0, ease: 2.3, interval: 0, due: Date.now(), seen: true, lastCorrect: false}; });
    const eFail = estimateExam(cls);
    some.forEach(q => { DB.cards[q.id] = {reps: 5, ease: 2.6, interval: 30, due: Date.now() + 20 * 86400000, seen: true, lastCorrect: true}; });
    const eOk = estimateExam(cls);
    // restante: aceleași cărți dar scadente de mult
    some.forEach(q => { DB.cards[q.id].due = Date.now() - 200 * 86400000; });
    const eLate = estimateExam(cls);
    return {e0: e0.p, eFail: eFail.p, eOk: eOk.p, eLate: eLate.p, cov: eOk.cov, bt: [binTail(10, 0.5, 5), binTail(20, 0.9, 15), binTail(5, 0.3, 0), binTail(5, 0.3, 6)]};
  });
  check("fără istoric: șanse mici", r.e0 <= 5, r.e0);
  check("totul stăpânit: șanse mari", r.eOk >= 90, r.eOk);
  check("tot greșit: sub fără istoric sau egal", r.eFail <= r.e0 + 1, [r.eFail, r.e0]);
  check("întârzierea la repetiții scade estimarea", r.eLate < r.eOk, [r.eLate, r.eOk]);
  check("acoperirea banca văzută = 100%", r.cov === 100, r.cov);
  check("coada binomială corectă (0,623; 0,989; 1; 0)", Math.abs(r.bt[0] - 0.623046875) < 1e-6 && Math.abs(r.bt[1] - 0.9887) < 2e-3 && r.bt[2] === 1 && r.bt[3] === 0, r.bt);
  await browser.close();
}

console.log("4. examen adaptiv complet, rezultat și istoric");
{
  const {browser, page, st} = await fresh();
  await nav(page, "examsetup");
  const estShown = parseInt((await page.textContent("#examEstP")).match(/(\d+)%/)[1]);
  await page.click("#btnExamStart");
  check("examenul pornește în mod adaptiv", (await page.evaluate(() => activeQuiz && activeQuiz.kind === "exam" && activeQuiz.mode)) === "adapt");
  const counts = await page.evaluate(() => activeQuiz.blocks.map(b => b.questions.length));
  check("structura reală a clasei IV (10+8+20)", JSON.stringify(counts.slice().sort((a, b) => a - b)) === "[8,10,20]", counts);
  await page.evaluate(() => examTimeUp());
  await page.waitForSelector("#screen-examresult.active, #screen-examresult[style*=block], #screen-examresult", {state: "attached"});
  check("rezultatul afișează modul și estimarea dinainte", (await page.textContent("#examResNote")).includes("Adaptiv") && (await page.textContent("#examResNote")).includes(estShown + "%"), await page.textContent("#examResNote"));
  await nav(page, "examsetup");
  check("istoricul arată estimarea", /est\. \d+%/.test(await page.textContent("#examHistory")), await page.textContent("#examHistory"));
  const saved = await page.evaluate(() => DB.stats.examLog.slice(-1)[0]);
  check("jurnalul salvează mode și est", saved.mode === "adapt" && saved.est === estShown, saved);
  // import curat: câmpuri invalide sunt eliminate
  const clean = await page.evaluate(() => { const d = sanitizeDB({version: 1, cards: {}, stats: {examLog: [{date: 1, cls: "IV", pass: true, mode: "<x>", est: 999}, {date: 2, cls: "IV", pass: false, mode: "rand", est: 42.4}]}, settings: {examMode: "evil"}}); return [d.stats.examLog, d.settings.examMode]; });
  check("sanitizeDB: mod/estimare invalide eliminate, valide păstrate", clean[0][0].mode === undefined && clean[0][0].est === undefined && clean[0][1].mode === "rand" && clean[0][1].est === 42 && clean[1] === undefined, clean);
  check("fără erori", st.errs.length === 0, st.errs);
  await browser.close();
}
summary();
