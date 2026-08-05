// Scan the rendered DOM of every route for emoji characters.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
{ const c = await ctx.newCDPSession(p); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.setItem('gds-state-v1', JSON.stringify({
  profile:{name:'Alex',path:'convert',residenceSince:'2026-05-15',startedAt:Date.now()},
  xp:1180, level:5, badges:['ignition','translated','bookworm','sharp-shooter'],
  streak:{last:new Date().toISOString().slice(0,10),count:6,best:9},
  counters:{correct:96,answered:132}, daily:{day:new Date().toISOString().slice(0,10),answered:7,correct:5},
  exams:[{date:Date.now(),errorPoints:8,passed:true,total:30}],
  tasks:{'c-verdict':{done:true,steps:{}}}, lessons:{'m01-system':{done:true}}, quiz:{} })));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1000);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const routes = ['#/journey','#/learn','#/lesson/m03-priority','#/task/c-firstaid','#/exam','#/stats','#/glossary','#/phrases','#/map','#/practice'];
let total = 0;
for (const r of routes) {
  await p.evaluate(h => { location.hash = h; }, r);
  await p.waitForTimeout(700);
  const found = await p.evaluate(() => {
    const re = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    const hits = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent;
      if (re.test(t)) hits.push((n.parentElement?.className || n.parentElement?.tagName || '?') + ' :: ' + t.trim().slice(0, 40));
    }
    return [...new Set(hits)];
  });
  console.log(`${found.length ? 'EMOJI' : 'clean'}  ${r}${found.length ? ' :: ' + found.slice(0,3).join(' | ') : ''}`);
  total += found.length;
}
// also the onboarding screen
await p.evaluate(() => localStorage.clear());
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const ob = await p.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}]/u;
  const hits = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (re.test(n.textContent)) hits.push(n.textContent.trim().slice(0,40));
  return hits;
});
console.log(`${ob.length ? 'EMOJI' : 'clean'}  #/welcome${ob.length ? ' :: ' + ob.join(' | ') : ''}`);
total += ob.length;
const icons = await p.evaluate(() => document.querySelectorAll('svg.ico, svg.emblem, svg.flag').length);
console.log(`\nSVG marks rendered on the welcome screen: ${icons}`);
console.log(total ? `\nEMOJI REMAINING: ${total}` : '\nNO EMOJI IN THE RENDERED UI');
await b.close();
process.exit(total ? 1 : 0);
