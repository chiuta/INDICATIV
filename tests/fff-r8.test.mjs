// INDICATIV — teste pentru funcția nouă (runda 8): cronometru opțional în examenul simulat + istoric.
import {launch, axeRun, hOverflow, check, summary, kitSmoke, kitLabel} from "./_lib.mjs";

async function fresh(o) {
  const L = await launch(o);
  await L.page.evaluate(() => { const b = document.getElementById("welcomeOverlay"); if (b) b.style.display = "none"; });
  return L;
}
const nav = (page, s) => page.evaluate(x => document.querySelector(`.navitem[data-screen="${x}"]`).click(), s);

console.log("1. pornire și versiune");
{
  const {browser, page, st} = await fresh();
  await page.waitForTimeout(3500);
  check("0 erori", st.errs.length === 0, st.errs);
  check("0 cereri de rețea", st.net.length === 0, st.net);
  check("0 violări CSP", (await page.evaluate(() => window.__csp)).length === 0);
  check("meta application-version 1.3.7", (await page.getAttribute('meta[name="application-version"]', "content")) === "1.3.7");
  check("#app-version vizibil", /1\.3\.7 · 2026-10-23/.test(await page.textContent("#app-version")));
  check("fără depășire orizontală 1280", (await hOverflow(page)) <= 0);
  await browser.close();
}

console.log("2. cronometru de examen");
{
  const {browser, page, st} = await fresh();
  await page.clock.install();
  page.on("dialog", d => d.accept());
  await nav(page, "examsetup");
  check("selector de timp prezent (4 opțiuni)", (await page.locator("#examTimeSeg button").count()) === 4);
  check("implicit: fără limită", (await page.getAttribute('#examTimeSeg button[data-min="0"]', "aria-pressed")) === "true");
  await page.click('#examTimeSeg button[data-min="30"]');
  check("30 min selectat", (await page.getAttribute('#examTimeSeg button[data-min="30"]', "aria-pressed")) === "true");
  const saved = await page.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join("").includes('"examMinutes":30'));
  check("alegerea se salvează local", saved);
  await page.click("#btnExamStart");
  check("cronometrul e vizibil și are role=timer", (await page.isVisible("#quizTimer")) && (await page.getAttribute("#quizTimer", "role")) === "timer");
  check("pornește la 30:00", /^(30:00|29:5\d)$/.test((await page.textContent("#quizTimer")).trim()), await page.textContent("#quizTimer"));
  // răspunde la 3 întrebări
  for (let i = 0; i < 3; i++) { await page.click("#cardOpts .opt"); await page.click("#btnNext"); }
  await page.clock.fastForward(10 * 60 * 1000);
  await page.waitForTimeout(1200);
  check("după 10 minute: ~20:00", /^(19:[0-5]\d|20:0\d)$/.test((await page.textContent("#quizTimer")).trim()), await page.textContent("#quizTimer"));
  await page.clock.fastForward(25 * 60 * 1000);
  await page.waitForTimeout(1500);
  check("la expirare se afișează rezultatul", await page.isVisible("#screen-examresult"));
  const sub = await page.textContent("#examVerdictSub");
  check("mesaj despre timpul expirat", /Timpul a expirat/.test(sub), sub);
  const counts = (await page.locator(".exam-probe-result").allTextContents()).map(t => t.trim());
  const tot = counts.reduce((a, c) => a + (+c.split("/")[0]), 0);
  check("întrebările rămase se numără ca greșite (corecte ≤ 3)", tot <= 3 && counts.length >= 3, counts);
  check("RESPINS", /RESPINS/.test(await page.textContent("#examVerdictWord")));
  check("cronometrul dispare după examen", await page.isHidden("#quizTimer"));
  const log = await page.evaluate(() => { for (const k of Object.keys(localStorage)) { const v = localStorage.getItem(k); if (v.includes("examLog")) { try { return JSON.parse(v).stats.examLog; } catch (e) {} } } return null; });
  check("examLog păstrează timeUp:true", log && log[log.length - 1].timeUp === true, log);
  await nav(page, "examsetup");
  check("istoricul arată ultimul examen", /Ultimele examene simulate/.test(await page.textContent("#examHistory")) && /timpul a expirat/.test(await page.textContent("#examHistory")));
  // fără limită: fără cronometru
  await page.click('#examTimeSeg button[data-min="0"]');
  await page.click("#btnExamStart");
  check("fără limită: cronometru ascuns", await page.isHidden("#quizTimer"));
  await page.click("#quizClose");
  // abandon oprește cronometrul
  await nav(page, "examsetup");
  await page.click('#examTimeSeg button[data-min="60"]'); await page.click("#btnExamStart");
  check("60 min: vizibil", await page.isVisible("#quizTimer"));
  await page.click("#quizClose");
  check("abandonul oprește și ascunde cronometrul", await page.isHidden("#quizTimer"));
  await page.clock.fastForward(70 * 60 * 1000); await page.waitForTimeout(500);
  check("nimic nu se întâmplă după abandon (fără ecran de rezultat)", !(await page.isVisible("#screen-examresult")));
  check("fără erori", st.errs.length === 0, st.errs);
  await browser.close();
}

console.log("3. promovare normală cu cronometru (răspunsuri corecte) nu e marcată ca expirată");
{
  const {browser, page} = await fresh();
  page.on("dialog", d => d.accept());
  await nav(page, "examsetup");
  await page.click('#examTimeSeg button[data-min="90"]'); await page.click("#btnExamStart");
  // răspunde corect la toate: ia varianta corectă din memorie
  let guard = 0;
  while (await page.isVisible("#screen-quiz") && guard++ < 80) {
    const idx = await page.evaluate(() => { const q = currentQuizQuestion(); return q.correct; }).catch(() => 0);
    await page.locator("#cardOpts .opt").nth(idx).click();
    await page.click("#btnNext");
  }
  check("examen terminat cu toate corecte -> ADMIS", /ADMIS/.test(await page.textContent("#examVerdictWord")));
  check("fără mesaj de timp expirat", !/Timpul a expirat/.test(await page.textContent("#examVerdictSub")));
  await browser.close();
}

console.log("4. accesibilitate");
{
  const {browser, page} = await fresh({bypassCSP: true, w: 360, h: 740});
  await nav(page, "examsetup");
  check("fără depășire orizontală la 360 (setup)", (await hOverflow(page)) <= 1);
  await page.click('#examTimeSeg button[data-min="30"]');
  let v = await axeRun(page); if (v) check("axe 0 violări (setup examen)", v.length === 0, v);
  await page.click("#btnExamStart");
  check("fără depășire orizontală la 360 (cu cronometru)", (await hOverflow(page)) <= 1);
  v = await axeRun(page); if (v) check("axe 0 violări (examen cu cronometru)", v.length === 0, v);
  await browser.close();
}

console.log("K. kit (Transparență + copie de siguranță)");
{
  const {browser, page, st} = await launch({});
  await page.waitForTimeout(800); await page.evaluate(() => { const b = document.getElementById("welcomeOverlay"); if (b) b.style.display = "none"; }); await page.click(".navitem[data-screen=settings]");
  await kitLabel(page, "indicativ");
  await kitSmoke(page, "indicativ", ["indicativ.test", "{\"a\":1}"]);
  check("kit: fără erori", st.errs.length === 0, st.errs);
  await browser.close();
}
summary();
