import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:8899';
const OUT = '/home/user/Autopiolot/pdfs';
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { slug: 'index',     title: 'Home' },
  { slug: 'solutions', title: 'Solutions' },
  { slug: 'cases',     title: 'What-you-can-achieve' },
  { slug: 'demo',      title: 'Live-demo' },
  { slug: 'pricing',   title: 'Pricing' },
  { slug: 'process',   title: 'Process' },
  { slug: 'about',     title: 'About' },
  { slug: 'contact',   title: 'Contact' },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1.25,
});

for (const p of pages) {
  const url = `${BASE}/${p.slug}.html`;
  console.log(`▸ ${p.slug} …`);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  // Let animations + lazy SVGs settle
  await page.waitForTimeout(600);
  // Make sure sticky topbar won't repeat on every PDF page
  await page.addStyleTag({ content: `
    .topbar { position: static !important; }
    .mobile-nav, .scroll-prog, .ticker { display: none !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
    * { animation: none !important; transition: none !important; }
    html { scroll-behavior: auto; }
    body { background: #fff; }
  `});
  const outFile = path.join(OUT, `${String(pages.indexOf(p) + 1).padStart(2,'0')}-${p.title}.pdf`);
  await page.pdf({
    path: outFile,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' },
    preferCSSPageSize: false,
  });
  await page.close();
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`  saved ${outFile} (${kb} KB)`);
}

await browser.close();
console.log('\nAll PDFs written to', OUT);
