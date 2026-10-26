const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');

function fixture(start = Date.parse('2026-10-26T03:00:00Z'), initial = {}, options = {}) {
    let now = start;
    let tick;
    const values = new Map(Object.entries(initial));
    const handlers = {};
    const classes = new Set();
    const nodes = new Map();
    const work = { reads: 0, writes: 0 };
    const document = {
        hidden: false, body: { classList: { contains: name => classes.has(name) } },
        getElementById(id) {
            work.reads++;
            if (!options.dom) return null;
            if (!nodes.has(id)) nodes.set(id, { style: { display: 'none' }, textContent: '',
                classList: { toggle() {} }, addEventListener() {} });
            return nodes.get(id);
        },
        addEventListener: (name, callback) => { handlers[name] = callback; }
    };
    const ctx = vm.createContext({
        console, document, learningSessionStarted: true,
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
        localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => {
            work.writes++;
            if (options.storageFull) throw new Error('Storage full');
            values.set(key, value);
        } },
        addEventListener() {}, setInterval: callback => { tick = callback; },
    });
    ctx.window = ctx;
    ctx.gameState = { currentWord: { word: 'apple' } };
    vm.runInContext(fs.readFileSync('js/daily_study.js', 'utf8'), ctx);
    return {
        api: ctx.DailyStudy, ctx, document, classes,
        advance: ms => { now += ms; },
        read: () => { ctx.DailyStudy.pause(); return JSON.parse(values.get('vocabGame_dailyStudy_v1')); },
        values, work, init: () => handlers.DOMContentLoaded(), tick: () => tick(),
        visibility: hidden => { document.hidden = hidden; handlers.visibilitychange(); }
    };
}

test('今日の学習：10秒で停止し、操作で再開、待機・非表示・設定中は延長しない', () => {
    const f = fixture();
    f.api.touch();
    f.advance(9000);
    f.api.touch();
    f.advance(60000);
    expect(f.read().elapsedMs).toBe(19000);
    f.advance(60000);
    expect(f.read().elapsedMs).toBe(19000);
    f.api.touch();
    f.advance(3000);
    f.api.pause();
    f.document.hidden = true;
    f.api.touch();
    f.advance(60000);
    expect(f.read().elapsedMs).toBe(22000);
    f.document.hidden = false;
    f.classes.add('dismissible-modal-open');
    f.api.touch();
    f.advance(10000);
    expect(f.read().elapsedMs).toBe(22000);
});

test('今日の学習：語数は重複せず苦手→得意→完璧も内訳に入り、Undoは件数だけ戻す', () => {
    const f = fixture();
    const key = 'basic_apple_名';
    f.api.touch();
    f.api.recordAnswer(key, 'weak', 'learned');
    const snapshot = f.api.captureAnswer(key);
    f.advance(2000);
    f.api.recordAnswer(key, 'learned', 'perfect');
    f.api.recordAnswer(key, 'perfect', 'perfect');
    expect(f.read()).toMatchObject({ answered: 3, perfectKeys: [key], recoveredKeys: [key], elapsedMs: 2000 });
    f.api.undoAnswer(key, snapshot);
    expect(f.read()).toMatchObject({ answered: 1, perfectKeys: [], recoveredKeys: [], weakKeys: [key], elapsedMs: 2000 });
    f.api.recordAnswer(key, 'learned', 'perfect');
    f.api.recordAnswer(key, 'weak', 'perfect');
    expect(f.read()).toMatchObject({ answered: 3, perfectKeys: [key], recoveredKeys: [key] });
});

test('今日の学習：JSTの日付変更をまたぐ時間を分け、昨日のUndoは今日を変えない', () => {
    const f = fixture(Date.parse('2026-10-26T14:59:57Z'));
    const snapshot = f.api.captureAnswer('apple');
    f.api.touch();
    f.advance(7000);
    expect(f.read()).toMatchObject({ date: '2026-10-27', elapsedMs: 4000, answered: 0 });
    f.api.recordAnswer('banana', 'unlearned', 'perfect');
    f.api.undoAnswer('apple', snapshot);
    expect(f.read()).toMatchObject({ answered: 1, perfectKeys: ['banana'] });
});

test('今日の学習：再起動で復元し、破損した集計は学習保存と無料残量へ触れない', () => {
    const f = fixture(undefined, {
        vocabGame_dailyStudy_v1: '{broken', vocabClickerSave: 'original-save',
        vocabGame_trialState_v2: 'original-allowance'
    });
    f.api.recordAnswer('apple', 'unlearned', 'perfect');
    f.api.touch(); f.advance(5000); f.api.pause();
    const restored = fixture(undefined, Object.fromEntries(f.values));
    expect(restored.api.captureAnswer('apple')).toMatchObject({ answered: 1, perfect: true });
    expect(restored.values.get('vocabClickerSave')).toBe('original-save');
    expect(restored.values.get('vocabGame_trialState_v2')).toBe('original-allowance');
    restored.api.reset();
    expect(restored.read()).toMatchObject({ answered: 0, elapsedMs: 0, perfectKeys: [] });
});

test('今日の学習：待機・非表示中はDOMを参照せず、日付変更と再表示で更新する', () => {
    const f = fixture(Date.parse('2026-10-26T14:58:00Z'), {}, { dom: true });
    f.init();
    f.work.reads = 0;
    for (let i = 0; i < 60; i++) { f.advance(1000); f.tick(); }
    expect(f.work).toEqual({ reads: 0, writes: 0 });
    f.visibility(true);
    f.work.reads = 0;
    for (let i = 0; i < 90; i++) { f.advance(1000); f.tick(); }
    expect(f.work).toEqual({ reads: 0, writes: 0 });
    f.visibility(false);
    expect(f.work.reads).toBeGreaterThan(0);
    expect(f.read()).toMatchObject({ date: '2026-10-27', elapsedMs: 0 });
});

test('今日の学習：大量の旧配列を復元し重複を除き、同じ保存形式とUndoを維持する', () => {
    const keys = Array.from({ length: 8000 }, (_, i) => `basic_word-${i}_名`);
    const f = fixture(undefined, { vocabGame_dailyStudy_v1: JSON.stringify({
        date: '2026-10-26', answered: 8000, perfectKeys: [...keys, keys[0]], weakKeys: keys,
        recoveredKeys: [...keys, 'not-perfect']
    }) });
    const before = f.api.captureAnswer(keys[0]);
    expect(before).toMatchObject({ perfect: true, recovered: true });
    f.api.recordAnswer('new-word', 'weak', 'perfect');
    const saved = f.read();
    expect(saved.perfectKeys).toHaveLength(8001);
    expect(saved.recoveredKeys).toHaveLength(8001);
    f.api.undoAnswer('new-word', { ...before, perfect: false, weak: false, recovered: false });
    expect(f.read()).toMatchObject({ answered: 8000, perfectKeys: keys, recoveredKeys: keys });
});

test('今日の学習：保存できない場合も毎秒再保存せず、時間と学習は継続する', () => {
    const f = fixture(undefined, {}, { dom: true, storageFull: true });
    f.init();
    f.api.touch();
    f.advance(1000); f.tick();
    expect(f.work.writes).toBe(1);
    for (let i = 0; i < 14; i++) { f.advance(1000); f.tick(); }
    expect(f.work.writes).toBe(1);
    f.advance(1000); f.tick();
    expect(f.work.writes).toBe(2);
    expect(() => f.api.recordAnswer('apple', 'unlearned', 'perfect')).not.toThrow();
    expect(f.api.captureAnswer('apple')).toMatchObject({ answered: 1, perfect: true });
});
