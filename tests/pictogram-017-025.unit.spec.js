const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),crypto=require('node:crypto');
const {readInputs,buildQueue}=require('../scripts/word-illustration-queue');
const r=require('../docs/experiments/pictogram-release-2026-09-23/registration.json');
test('第17〜25回の600画像・617キーを追加し既存登録と語彙を保持する',()=>{
 const x=readInputs(),previous=x.illustrations.slice(0,r.previousWords);
 expect(crypto.createHash('sha256').update(JSON.stringify(previous)).digest('hex')).toBe(r.previousManifestSha256);
 expect(x.vocabularySha256).toBe(r.vocabularySha256);
 expect(x.illustrations.length).toBe(1292);
 expect(new Set(x.illustrations.map(e=>e.src)).size).toBe(1247);
 expect(x.illustrations.slice(675)).toEqual(r.entries);
 const keys=r.entries.map(e=>x.utils.getWordKey(e,e.level,x.database));
 expect(new Set(keys).size).toBe(617);
 const pending=buildQueue({...x,illustrations:previous}).entries.filter(e=>e.status==='pending');
 expect([...keys].sort()).toEqual(pending.slice(0,617).map(e=>e.key).sort());
 for(const e of r.entries)expect(fs.statSync(e.src).size).toBeGreaterThan(0);
 expect(buildQueue(x).entries.find(e=>e.status==='pending').word).toBe('shape');
});
