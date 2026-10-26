const { test, expect } = require('@playwright/test');

const save = (count, time, first = 1) => ({ lastSaveTime: time, firstPlayedAt: first,
    globalQuestionCount: count, wordStates: Object.fromEntries(Array.from({ length: count }, (_, i) => [`fixture-${i}`, 'learned'])),
    srsData: {}, wordKeySchemaVersion: 2, wordGroupingVersion: 1, srsSchemaVersion: 5, srsBootstrapped: true });

async function setup(page, context, localData, cloudData, missingChunks = false) {
    const dialogs = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { dialogs.push(dialog.message());
        if (dialog.type() === 'confirm') await dialog.dismiss(); else await dialog.accept(); });
    await page.addInitScript(({ localData, cloudData, missingChunks }) => {
        if (!sessionStorage.getItem('fixture-initialized')) {
            localStorage.setItem('vocabClickerSave', JSON.stringify(localData)); sessionStorage.setItem('fixture-initialized', 'true');
        }
        for (const key of ['vocabGame_skipWelcome', 'vocabGame_skipLiveTutorial', 'vocabGame_disableAutoUpdate', 'vocabGame_installGuideDismissed']) localStorage.setItem(key, 'true');
        localStorage.setItem('vocabGame_speechSettings', JSON.stringify({ autoRead: false, volume: 0 }));
        window.cloudFixture = { documents: { 'users/fixture': missingChunks
            ? { saveStorage: 'chunked', saveChunkPrefix: 'missing', saveChunkCount: 1, saveRevision: 5 }
            : { saveStorage: 'inline', saveData: JSON.stringify(cloudData), saveRevision: 5 } }, writes: [], readComplete: false };
    }, { localData, cloudData, missingChunks });
    const modules = {
        'firebase-app.js': 'export const initializeApp = () => ({});',
        'firebase-analytics.js': 'export const getAnalytics = () => ({}); export const setUserId = () => {};',
        'firebase-auth.js': `const user={uid:'fixture',isAnonymous:false,displayName:'fixture',email:'fixture@example.invalid',getIdToken:async()=>'fixture'};
            export const getAuth=()=>({currentUser:user}); export const onAuthStateChanged=(_auth,callback)=>setTimeout(async()=>{await callback(user);window.cloudFixture.readComplete=true;},0);
            export const GoogleAuthProvider=class{};
            export const signInAnonymously=async()=>({user}); export const signInWithPopup=signInAnonymously;
            export const signInWithCredential=signInAnonymously; export const linkWithPopup=signInAnonymously; export const signOut=async()=>{};`,
        'firebase-firestore.js': `export const getFirestore=()=>({}); export const doc=(_db,...parts)=>({path:parts.join('/'),id:parts.at(-1)});
            const snap=ref=>({exists:()=>Object.hasOwn(window.cloudFixture.documents,ref.path),data:()=>window.cloudFixture.documents[ref.path]});
            export const getDoc=async ref=>snap(ref); export const setDoc=async(ref,data)=>{window.cloudFixture.documents[ref.path]=data;window.cloudFixture.writes.push(ref.path);};
            export const getDocs=async()=>({empty:true}); export const collection=()=>({}); export const query=()=>({}); export const orderBy=query; export const limit=query; export const where=query;
            export const deleteField=()=>null; export const deleteDoc=async()=>{}; export const serverTimestamp=()=>123;
            export const runTransaction=async(_db,callback)=>{const writes=[];const result=await callback({get:async ref=>snap(ref),set:(ref,data)=>writes.push([ref,data]),delete:()=>{}});
                for(const[ref,data]of writes){window.cloudFixture.documents[ref.path]={...window.cloudFixture.documents[ref.path],...data};window.cloudFixture.writes.push(ref.path);}return result;};`
    };
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'www.gstatic.com' && modules[url.pathname.split('/').pop()]) return route.fulfill({ contentType: 'application/javascript', body: modules[url.pathname.split('/').pop()], headers: { 'Access-Control-Allow-Origin': '*' } });
        if (url.hostname === 'us-central1-tenioha-game.cloudfunctions.net') return route.fulfill({ json: url.pathname.endsWith('/feedback') ? { items: [] } : { weekKey: '2026-10-26', todayKey: '2026-10-26', results: [], me: null } });
        if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue();
        return route.abort();
    });
    await page.goto('/index.html');
    await expect.poll(() => page.evaluate(() => window.cloudFixture?.readComplete)).toBe(true);
    return { dialogs, errors };
}

test('クラウド保護：再起動済みの空端末へ古い時刻のクラウド履歴を実際に復元', async ({ page, context }) => {
    const { dialogs, errors } = await setup(page, context, save(0, Date.now()), save(50, 100));
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabClickerSave')).globalQuestionCount)).toBe(50);
    expect(dialogs.some(message => message.includes('復元しました'))).toBe(true);
    await page.evaluate(() => window.uploadSaveData(true));
    expect(await page.evaluate(() => JSON.parse(window.cloudFixture.documents['users/fixture'].saveData).globalQuestionCount)).toBe(50);
    expect(errors).toEqual([]);
});

test('クラウド保護：大幅に減った端末では自動保存を停止し本体と退避を書き換えない', async ({ page, context }) => {
    const { dialogs, errors } = await setup(page, context, save(5, Date.now()), save(50, 100));
    expect(dialogs.some(message => message.includes('自動保存を止めました'))).toBe(true);
    await page.evaluate(() => window.uploadSaveData(true));
    expect(await page.evaluate(() => window.cloudFixture.writes)).toEqual([]);
    await expect(page.locator('#profileLastSync')).toContainText('自動保存停止');
    expect(errors).toEqual([]);
});

test('クラウド保護：新しいクラウドの復元を断っても古い端末で自動上書きしない', async ({ page, context }) => {
    const { errors } = await setup(page, context, save(50, 100), save(50, Date.now() + 60000));
    expect(await page.evaluate(() => window.cloudSaveConflict)).toBe(true);
    await page.evaluate(() => window.uploadSaveData(true));
    expect(await page.evaluate(() => window.cloudFixture.writes)).toEqual([]);
    expect(errors).toEqual([]);
});

test('クラウド保護：欠損した分割保存の初回読込失敗後は自動アップロードしない', async ({ page, context }) => {
    const { errors } = await setup(page, context, save(0, Date.now()), null, true);
    await page.evaluate(() => window.uploadSaveData(true, true));
    expect(await page.evaluate(() => window.cloudFixture.writes)).toEqual([]);
    expect(errors).toEqual([]);
});

test('クラウド保護：手動のクラウド復元は端末の未同期保存を残してから切り替える', async ({ page, context }) => {
    const { errors } = await setup(page, context, save(5, Date.now()), save(50, 100));
    page.removeAllListeners('dialog');
    page.on('dialog', dialog => dialog.accept());
    await page.evaluate(() => { void window.forceRestore(); });
    await expect.poll(async () => {
        try { return await page.evaluate(() => JSON.parse(localStorage.getItem('vocabClickerSave')).globalQuestionCount); }
        catch (_) { return null; } // The successful restore intentionally reloads this page.
    }).toBe(50);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabGame_beforeCloudRestore_v1')).globalQuestionCount)).toBe(5);
    expect(errors).toEqual([]);
});
