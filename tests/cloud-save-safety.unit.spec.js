const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { buildRecoveryPlan } = require('../scripts/cloud-recovery-plan.cjs');
const source = fs.readFileSync(path.join(__dirname, '../js/firebase_app_v2.js'), 'utf8');
const learning = count => ({ lastSaveTime: 100, firstPlayedAt: 50, globalQuestionCount: count,
    wordStates: Object.fromEntries(Array.from({ length: count }, (_, i) => [`key-${i}`, 'learned'])) });

function runtime(initial = learning(50)) {
    const store = new Map([['users/fixture', { saveRevision: 1, saveStorage: 'inline', saveData: JSON.stringify(initial) }]]);
    const local = new Map([['vocabClickerSave', JSON.stringify(initial)]]), writes = [], alerts = [];
    const keyOf = ref => typeof ref === 'string' ? ref : ref.path || `users/${ref.id}`;
    const profile = {}, snapshot = ref => ({ exists: () => store.has(keyOf(ref)), data: () => store.get(keyOf(ref)) });
    const context = vm.createContext({ window: { isDirty: true }, Blob, console: { log() {}, warn() {}, error() {} },
        crypto: { randomUUID: () => 'fixture-generation' }, db: {},
        auth: { currentUser: { uid: 'fixture', displayName: 'fixture', email: 'fixture@example.invalid' } },
        knownCloudSaveUserId: 'fixture', knownCloudSaveRevision: 1, knownCloudSaveBaseline: null, cloudSaveUploadPromise: null,
        isRegisteredFirebaseUser: () => true, alert: value => alerts.push(value), confirm: () => false,
        localStorage: { getItem: key => local.get(key) || null, setItem: (key, value) => local.set(key, value), removeItem: key => local.delete(key) },
        document: { getElementById: id => id === 'profileLastSync' ? profile : null },
        doc: (_db, ...parts) => ({ path: parts.join('/'), id: parts.at(-1) }), serverTimestamp: () => 123, deleteField: () => ({ deleteFixture: true }),
        getDoc: async ref => snapshot(ref), setDoc: async (ref, data) => { store.set(keyOf(ref), { ...data }); writes.push(['set', keyOf(ref)]); },
        collection: (_db, ...parts) => parts.join('/'), where: () => ({}), orderBy: () => ({}), limit: () => ({}), query: ref => ref,
        getDocs: async () => ({ empty: true }),
        runTransaction: async (_db, callback) => {
            const pending = [];
            const result = await callback({ get: async ref => snapshot(ref),
                set: (ref, data) => pending.push(['set', keyOf(ref), data]), delete: ref => pending.push(['delete', keyOf(ref)]) });
            for (const [op, ref, data] of pending) {
                if (op === 'delete') store.delete(ref);
                else {
                    const next = { ...(store.get(ref) || {}), ...data };
                    for (const [key, value] of Object.entries(next)) if (value?.deleteFixture) delete next[key];
                    store.set(ref, next);
                }
                writes.push([op, ref]);
            }
            return result;
        }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8'), context);
    vm.runInContext(source.slice(source.indexOf('// --- Large cloud save helpers'), source.indexOf('// --- SAFE UI INIT')), context);
    context.knownCloudSaveBaseline = context.window.GameUtils.getLearningSaveSummary(initial);
    return { context, store, local, writes, alerts, profile };
}

test('クラウド保護：再起動済みの空保存もクラウドを復元し、大幅減少は自動上書きしない', () => {
    const { context } = runtime(), utils = context.window.GameUtils;
    expect(utils.getLoginCloudSyncDecision({ hadExistingSaveAtBoot: true, localData: { ...learning(0), lastSaveTime: 200 }, cloudData: learning(50) })).toBe('restore-clean-device');
    expect(utils.getLoginCloudSyncDecision({ hadExistingSaveAtBoot: true, localData: { ...learning(5), lastSaveTime: 200 }, cloudData: learning(50) })).toBe('protect-cloud');
    expect(utils.getCloudSaveLossReason(learning(49), learning(50))).toBeNull();
    expect(utils.getCloudSaveLossReason(learning(51), learning(50))).toBeNull();
});

test('クラウド保護：空保存と大幅減少はトランザクションでも拒否し元データを保持', async () => {
    const { context, store, writes } = runtime();
    for (const count of [0, 5]) await expect(context.commitCloudSave({ id: 'fixture' }, { saveData: JSON.stringify(learning(count)) }, 1)).rejects.toMatchObject({ code: 'cloud-save-protection' });
    expect(JSON.parse(store.get('users/fixture').saveData).globalQuestionCount).toBe(50);
    expect(writes).toHaveLength(0);
});

test('クラウド保護：commit応答不明でも参照中の新しい保存片を削除しない', async () => {
    const { context, store } = runtime();
    context.splitStringByBytes = () => ['one', 'two', 'three', 'four'];
    context.commitCloudSave = async (_ref, fields) => { store.set('users/fixture', fields); throw new Error('acknowledgement unavailable'); };
    await expect(context.writeChunkedSaveData({ id: 'fixture' }, 'payload', 'fixture', 1, {})).rejects.toThrow('acknowledgement unavailable');
    expect([...store.keys()].filter(key => key.includes('/save_chunks/'))).toHaveLength(4);
    expect(store.get('users/fixture').saveChunkCount).toBe(4);
});

test('クラウド保護：現行と2つの退避世代は削除せず孤立世代だけ削除する', async () => {
    const { context, store } = runtime();
    store.set('users/fixture', { saveStorage: 'chunked', saveChunkPrefix: 'active' });
    store.set('users/fixture/save_backups/daily', { saveStorage: 'chunked', saveChunkPrefix: 'daily' });
    store.set('users/fixture/save_backups/before-replace', { saveStorage: 'chunked', saveChunkPrefix: 'manual' });
    for (const prefix of ['active', 'daily', 'manual', 'orphan']) store.set(`users/fixture/save_chunks/${prefix}_0`, { data: 'fixture' });
    for (const prefix of ['active', 'daily', 'manual']) expect(await context.deleteSaveChunkGeneration({ id: 'fixture' }, prefix, 1)).toBe(false);
    expect(await context.deleteSaveChunkGeneration({ id: 'fixture' }, 'orphan', 1)).toBe(true);
    expect([...store.keys()].filter(key => key.includes('/save_chunks/'))).toHaveLength(3);
});

test('クラウド保護：古い呼出元のprefixではなく実際の現行保存を確認して整理', async () => {
    const { context, store } = runtime();
    store.set('users/fixture', { saveStorage: 'chunked', saveChunkPrefix: 'new-active' });
    const docs = ['new-active_0', 'orphan_0'].map(id => ({ id, ref: `users/fixture/save_chunks/${id}` }));
    docs.forEach(doc => store.set(doc.ref, {}));
    context.getDocs = async () => ({ empty: false, size: 2, forEach: callback => docs.forEach(callback) });
    await context.maybeCleanupStaleSaveChunks({ id: 'fixture' }, 'outdated-prefix');
    expect(store.has(docs[0].ref)).toBe(true);
    expect(store.has(docs[1].ref)).toBe(false);
});

test('クラウド保護：退避は同日1回、明示上書き時は直前保存も保持', async () => {
    const { context, store, writes } = runtime();
    const commit = (data, revision, options) => context.commitCloudSave({ id: 'fixture' }, { saveStorage: 'inline', saveData: JSON.stringify(data) }, revision, options);
    await commit(learning(51), 1);
    await commit(learning(52), 2);
    expect(writes.filter(([op, ref]) => op === 'set' && ref.endsWith('/save_backups/daily'))).toHaveLength(1);
    expect(JSON.parse(store.get('users/fixture/save_backups/daily').saveData).globalQuestionCount).toBe(50);
    await commit(learning(0), 3, { allowProgressLoss: true, keepBeforeReplace: true });
    expect(JSON.parse(store.get('users/fixture/save_backups/before-replace').saveData).globalQuestionCount).toBe(52);
});

test('クラウド保護：自動保存は履歴減少と初回読込未完了で書き込まない', async () => {
    const { context, local, writes, profile } = runtime();
    local.set('vocabClickerSave', JSON.stringify(learning(0)));
    await context.performCloudSave(true);
    expect(context.window.cloudSaveConflict).toBe(true);
    expect(profile.textContent).toContain('自動保存停止');
    expect(writes).toHaveLength(0);
    context.window.cloudSaveConflict = false; context.knownCloudSaveBaseline = null;
    local.set('vocabClickerSave', JSON.stringify(learning(51)));
    await context.performCloudSave(true);
    expect(writes).toHaveLength(0);
});

test('クラウド保護：手動上書きをキャンセルすると元の保存と退避を変更しない', async () => {
    const { context, local, writes } = runtime();
    local.set('vocabClickerSave', JSON.stringify(learning(5)));
    await context.performCloudSave(false);
    expect(writes).toHaveLength(0);
    expect(context.window.cloudSaveConflict).toBe(true);
});

test('クラウド保護：実際のUndo対象だけを減少保護の例外とし、他の履歴は守る', async () => {
    const { context, local, store } = runtime(learning(1));
    local.set('vocabClickerSave', JSON.stringify(learning(0)));
    context.window.cloudSaveUndoKeys = new Set(['key-0']);
    await context.performCloudSave(true);
    expect(JSON.parse(store.get('users/fixture').saveData).wordStates).toEqual({});
    expect(context.window.cloudSaveConflict).not.toBe(true);
    expect(context.window.cloudSaveUndoKeys.size).toBe(0);
    expect(context.window.GameUtils.getCloudSaveLossReason(learning(0), learning(50), new Set(['key-0']))).toBe('empty-local');
});

test('クラウド保護：端末への復元は現在の保存を退避し、退避失敗なら置き換えない', () => {
    const { context, local } = runtime();
    vm.runInContext(source.slice(source.indexOf('function installRestoredCloudSave('), source.indexOf('window.forceRestore =')), context);
    const original = local.get('vocabClickerSave');
    context.installRestoredCloudSave(JSON.stringify(learning(51)));
    expect(local.get('vocabGame_beforeCloudRestore_v1')).toBe(original);
    const current = local.get('vocabClickerSave');
    context.localStorage.setItem = () => { throw new Error('quota'); };
    expect(() => context.installRestoredCloudSave(JSON.stringify(learning(52)))).toThrow('quota');
    expect(local.get('vocabClickerSave')).toBe(current);
});

test('部分復旧：既存の履歴と自作内容を保持し、最後の復習結果だけを追加', () => {
    const baseline = { wordStates: { existing: 'perfect' }, srsData: { existing: { recentAnswers: [true, true] } }, myWordbooks: [{ name: 'fixture' }] };
    const events = [{ wordHash: 'a', outcome: 'incorrect', isCorrect: false, updatedAt: '2026-10-01T00:00:00Z', lastEarnedDate: '2026-10-01' },
        { wordHash: 'b', outcome: 'scheduled-correct', isCorrect: true, updatedAt: '2026-10-02T00:00:00Z', lastEarnedDate: '2026-10-02' },
        { wordHash: 'c', outcome: 'incorrect', isCorrect: false }];
    const plan = buildRecoveryPlan(baseline, events, new Map([['a', 'missing-weak'], ['b', 'missing-learned'], ['c', 'existing']]), 12345);
    expect(plan.data.wordStates).toEqual({ existing: 'perfect', 'missing-weak': 'weak', 'missing-learned': 'learned' });
    expect(plan.data.srsData.existing).toEqual(baseline.srsData.existing);
    expect(plan.data.myWordbooks).toEqual(baseline.myWordbooks);
    expect(plan.data.srsData['missing-learned'].recentAnswers).toEqual([]);
    expect(plan.summary.restoredPerfect).toBe(0);
    expect(plan.summary.exactRecovery).toBe(false);
});

for (const flag of ['--cleanup-chunks', '--delete-all-save-chunks']) {
    test(`クラウド保護：旧管理スクリプトの${flag}実行は認証・通信より前で停止`, () => {
        const result = spawnSync(process.execPath, [path.join(__dirname, '../scripts/compact_firestore_saves.js'), '--execute', flag],
            { encoding: 'utf8', timeout: 5000, windowsHide: true });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Cloud save compaction writes are disabled');
        expect(result.stdout).toBe('');
    });
}
