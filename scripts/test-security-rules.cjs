const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

(async () => {
    const jar = process.env.TENIOHA_FIRESTORE_EMULATOR_JAR
        || path.join(os.homedir(), '.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar');
    assert.ok(fs.existsSync(jar), 'Install the Firebase Firestore emulator first.');
    const reservation = net.createServer();
    await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const project = 'demo-tenioha-security';
    const base = `http://127.0.0.1:${port}/v1/projects/${project}/databases/(default)/documents/`;
    const child = spawn('java', ['-jar', jar, '--host', '127.0.0.1', '--port', String(port),
        '--project_id', project, '--single_project_mode', 'true', '--single_project_mode_error', 'true', '--rules', path.resolve('firestore.rules')],
        { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let startupError = '', exitCode = null;
    child.stderr.on('data', data => { startupError = (startupError + data.toString()).slice(-4000); });
    child.on('exit', code => { exitCode = code; });
    child.on('error', error => { startupError = error.message; });
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
            if (exitCode !== null) throw new Error(startupError || 'Emulator exited.');
            try { await fetch(base + 'config/probe', { signal: AbortSignal.timeout(250) }); ready = true; break; } catch {}
            await delay(200);
        }
        assert.ok(ready, 'Local emulator startup failed: ' + startupError);
        function identity(uid, email, provider = 'google.com') {
            const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
            const now = Math.floor(Date.now() / 1000);
            return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: uid, user_id: uid, aud: project,
                iss: `https://securetoken.google.com/${project}`, iat: now, exp: now + 3600,
                firebase: { sign_in_provider: provider }, ...(email ? { email } : {}) })}.`;
        }
        async function request(method, document, token, fields) {
            const result = await fetch(base + document, { method,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                ...(fields ? { body: JSON.stringify({ fields }) } : {}), signal: AbortSignal.timeout(5000) });
            return result.status;
        }
        const admin = 'owner', member = identity('member'), other = identity('other'), guest = identity('guest', null, 'anonymous');
        const emptyList = { arrayValue: { values: [] } };
        const policy = { schemaVersion: { integerValue: '1' }, blockedUids: { arrayValue: { values: [{ stringValue: 'blocked' }] } },
            blockedEmails: { arrayValue: { values: [{ stringValue: 'blocked@invalid.example' }] } } };
        let checks = 0;
        async function check(method, document, token, fields, expected) {
            assert.equal(await request(method, document, token, fields), expected, `${method} ${document}`);
            checks++;
        }
        await check('PATCH', 'users/member', member, { points: { integerValue: '1' } }, 403);
        await check('PATCH', 'security_private/blocklist', admin, policy, 200);
        await check('PATCH', 'users/member', member, { points: { integerValue: '1' } }, 200);
        await check('GET', 'users/member', member, null, 200);
        await check('GET', 'users/member', other, null, 403);
        await check('PATCH', 'users/other', member, { points: { integerValue: '2' } }, 403);
        await check('PATCH', 'users/member', member, { isPremium: { booleanValue: true } }, 403);
        await check('PATCH', 'users/other', other, { premiumExpiresAt: { timestampValue: '2125-01-01T00:00:00Z' } }, 403);
        await check('PATCH', 'users/member/save_chunks/fixture', member, { data: { stringValue: 'fixture' } }, 200);
        await check('GET', 'users/member/save_chunks/fixture', other, null, 403);
        await check('PATCH', 'users/guest', guest, { points: { integerValue: '1' } }, 403);
        for (const token of [null, member, other, guest]) {
            await check('GET', 'security_private/blocklist', token, null, 403);
            await check('PATCH', 'security_private/blocklist', token, { schemaVersion: { integerValue: '1' }, blockedUids: emptyList, blockedEmails: emptyList }, 403);
        }
        await check('PATCH', 'users/blocked', identity('blocked'), { points: { integerValue: '1' } }, 403);
        await check('PATCH', 'users/email-blocked', identity('email-blocked', 'blocked@invalid.example'), { points: { integerValue: '1' } }, 403);
        for (const collection of ['promocodes', 'feedback_posts', 'review_score_events', 'review_score_daily', 'review_score_weekly', 'sensitive_action_limits']) {
            await check('PATCH', collection + '/fixture', member, { data: { stringValue: 'fixture' } }, 403);
        }
        await check('PATCH', 'config/fixture', member, { value: { integerValue: '1' } }, 403);
        await check('PATCH', 'security_private/blocklist', admin, { schemaVersion: { integerValue: '1' }, blockedUids: { stringValue: 'broken' }, blockedEmails: emptyList }, 200);
        await check('GET', 'users/member', member, null, 403);
        await check('DELETE', 'security_private/blocklist', admin, null, 200);
        await check('GET', 'users/member', member, null, 403);
        console.log(JSON.stringify({ project, checks, productionRequests: 0 }));
    } finally { child.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
