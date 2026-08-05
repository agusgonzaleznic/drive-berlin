// Objective measurements: WCAG contrast ratios and touch-target sizes.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

const SEED = { profile:{name:'Alex',path:'convert',residenceSince:'2026-05-15',startedAt:Date.now()}, xp:1180, level:5,
  badges:['ignition','translated'], streak:{last:new Date().toISOString().slice(0,10),count:6,best:9},
  counters:{correct:96,answered:132}, exams:[{date:Date.now(),errorPoints:8,passed:true,total:30}], tasks:{}, lessons:{}, quiz:{} };

async function boot(width, height) {
  const ctx = await b.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  { const _c = await ctx.newCDPSession(p); await _c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.evaluate(s => localStorage.setItem('gds-state-v1', JSON.stringify(s)), SEED);
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  return { ctx, p };
}

const CONTRAST_FN = `
function lum(rgb){const c=rgb.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]}
function parse(s){const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return {rgb:p.slice(0,3),a:p.length>3?p[3]:1}}
function over(fg,bg){return fg.a>=1?fg.rgb:fg.rgb.map((v,i)=>v*fg.a+bg[i]*(1-fg.a))}
function effBg(el){let n=el;while(n&&n!==document.documentElement){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c&&c.a>0)return over(c,[255,255,255]);n=n.parentElement}return [255,255,255]}
function ratio(el){const fg=parse(getComputedStyle(el).color);if(!fg)return null;const bg=effBg(el);if(!bg)return null;const f=over(fg,bg);const L1=lum(f),L2=lum(bg);const hi=Math.max(L1,L2),lo=Math.min(L1,L2);return (hi+0.05)/(lo+0.05)}
`;

const { ctx, p } = await boot(1280, 900);
console.log('=== CONTRAST (WCAG 1.4.3: 4.5:1 normal, 3:1 large >=24px or >=18.66px bold) ===');
for (const [hash, label] of [['#/journey','journey'],['#/stats','stats'],['#/learn','learn'],['#/glossary','glossary']]) {
  await p.evaluate(h => { location.hash = h; }, hash);
  await p.waitForTimeout(700);
  const rows = await p.evaluate(`(() => { ${CONTRAST_FN}
    const out = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('#view *, .app-header *, .tabs a')) {
      const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
      if (!t) continue;
      const s = getComputedStyle(el);
      const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
      const large = size >= 24 || (bold && size >= 18.66);
      const r = ratio(el);
      if (r == null) return out;
      const need = large ? 3 : 4.5;
      const key = el.className + '|' + Math.round(size) + '|' + s.color;
      if (seen.has(key)) continue; seen.add(key);
      if (r < need) out.push({ cls: String(el.className).slice(0,34) || el.tagName, size: Math.round(size*10)/10, bold, color: s.color, ratio: Math.round(r*100)/100, need, text: t.slice(0,32) });
    }
    return out;
  })()`);
  if (!rows.length) console.log('  ' + label + ': all text passes');
  else rows.forEach(r => console.log(`  ${label}: FAIL ${r.ratio}:1 (needs ${r.need}) ${r.size}px${r.bold?' bold':''} ${r.color} .${r.cls} "${r.text}"`));
}
await ctx.close();

const { ctx: c2, p: p2 } = await boot(390, 844);
console.log('\n=== TOUCH TARGETS (WCAG 2.5.8 minimum 24x24; 44x44 recommended) ===');
for (const [hash, sel, label] of [['#/journey','.tabs a','bottom tab items'],['#/exam','#start-btn','start exam'],['#/glossary','.glossary-search','search field'],['#/journey','.task-card .card','task cards']]) {
  await p2.evaluate(h => { location.hash = h; }, hash);
  await p2.waitForTimeout(700);
  const r = await p2.evaluate(s => {
    const els=[...document.querySelectorAll(s)];
    if(!els.length) return null;
    const b=els.map(e=>e.getBoundingClientRect());
    return { n:els.length, minW:Math.round(Math.min(...b.map(x=>x.width))), minH:Math.round(Math.min(...b.map(x=>x.height))) };
  }, sel);
  if (r) console.log(`  ${label}: ${r.n} items, smallest ${r.minW}x${r.minH}px ${r.minH>=44&&r.minW>=44?'(comfortable)':r.minH>=24?'(passes 24px, below 44px)':'(FAILS 24px)'}`);
}
// exam grid needs the exam started
await p2.evaluate(() => { location.hash = '#/exam'; });
await p2.waitForTimeout(600);
if (await p2.locator('#start-btn').isEnabled().catch(()=>false)) {
  await p2.click('#start-btn'); await p2.waitForTimeout(600);
  const g = await p2.evaluate(() => { const b=[...document.querySelectorAll('[data-nav]')].map(e=>e.getBoundingClientRect());
    return { n:b.length, minW:Math.round(Math.min(...b.map(x=>x.width))), minH:Math.round(Math.min(...b.map(x=>x.height))) }; });
  console.log(`  exam grid cells: ${g.n} items, smallest ${g.minW}x${g.minH}px ${g.minH>=44&&g.minW>=44?'(comfortable)':g.minH>=24?'(passes 24px, below 44px)':'(FAILS 24px)'}`);
  const o = await p2.evaluate(() => { const b=[...document.querySelectorAll('.option')].map(e=>e.getBoundingClientRect());
    return b.length? { n:b.length, minH:Math.round(Math.min(...b.map(x=>x.height))) } : null; });
  if (o) console.log(`  quiz options: ${o.n} items, smallest height ${o.minH}px`);
}
await c2.close();
await b.close();
