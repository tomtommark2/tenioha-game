const {test,expect}=require('@playwright/test');
const crypto=require('node:crypto');
const {readInputs}=require('../scripts/word-illustration-queue');
const repairs=require('../docs/experiments/alpha-repair-2026-09-14/repairs.json');
test('dishは旧版を採用し、その他6画像7項目だけを差し替える',()=>{
 const entries=readInputs().illustrations;
 const old=new Map(repairs.entries.filter(e=>e.selected!==false).map(e=>[e.delivery,e.previous]));
 expect(entries.filter(e=>old.has(e.src))).toHaveLength(7);
 expect(entries.find(e=>e.word==='dish').src).toBe('assets/word-illustrations/dish-pictogram-v1.webp');
 const restored=entries.map(e=>({...e,src:old.get(e.src)||e.src}));
 expect(crypto.createHash('sha256').update(JSON.stringify(restored)).digest('hex')).toBe(repairs.previousManifestSha256);
});
