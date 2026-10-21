const crypto = require('node:crypto');
const { validBlocklist } = require('../functions/account-security');
const PROJECT = 'tenioha-game';
const RULES_API = `https://firebaserules.googleapis.com/v1/projects/${PROJECT}`;
const DOCUMENT = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/security_private/blocklist`;

function legacyBlocklist(source) {
    if (source.includes('security_private/blocklist') && !source.includes('request.auth.uid in [')) return null;
    function array(expression) {
        const match = source.match(expression);
        if (!match) throw new Error('Unrecognized deployed blocklist.');
        const values = [...match[1].matchAll(/(['"])([^'"\\]*)\1/g)].map(item => item[2]);
        if (match[1].replace(/(['"])([^'"\\]*)\1/g, '').replace(/[\s,]/g, '') || values.some(value => !value)) {
            throw new Error('Unrecognized deployed blocklist values.');
        }
        return values;
    }
    return { schemaVersion: 1, blockedUids: array(/request\.auth\.uid\s+in\s+\[([^\]]*)\]/),
        blockedEmails: array(/request\.auth\.token\.email\s+in\s+\[([^\]]*)\]/) };
}

function unpack(document) {
    if (!document?.fields) return null;
    const fields = document.fields;
    return { schemaVersion: Number(fields.schemaVersion?.integerValue),
        blockedUids: fields.blockedUids?.arrayValue?.values?.map(item => item.stringValue) || (fields.blockedUids?.arrayValue ? [] : null),
        blockedEmails: fields.blockedEmails?.arrayValue?.values?.map(item => item.stringValue) || (fields.blockedEmails?.arrayValue ? [] : null) };
}

async function run(mode = '--dry-run') {
    if (!['--dry-run', '--check', '--apply'].includes(mode)) throw new Error('Use --dry-run, --check, or --apply.');
    if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== PROJECT) throw new Error('Unexpected deployment project.');
    // Do not use shell credential dumps, write token files, or log API bodies.
    require('../node_modules/firebase-tools/lib/logger').logger.silent = true;
    const auth = require('../node_modules/firebase-tools/lib/auth');
    const account = auth.getProjectDefaultAccount(process.cwd());
    if (!account) throw new Error('Existing Firebase CLI login required.');
    const credentials = await auth.getAccessToken(account.tokens.refresh_token,
        ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']);
    async function api(url, options = {}) {
        const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000), headers: {
            Authorization: `Bearer ${credentials.access_token}`, 'Content-Type': 'application/json'
        } });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Management request failed (${response.status}).`);
        return response.json();
    }
    const release = await api(`${RULES_API}/releases/cloud.firestore`);
    if (!release?.rulesetName?.startsWith(`projects/${PROJECT}/rulesets/`)) throw new Error('Unexpected deployed ruleset.');
    const ruleset = await api(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
    const source = ruleset?.source?.files?.find(file => file.name.endsWith('.rules'))?.content;
    if (!source) throw new Error('Deployed rules could not be read.');
    const legacy = legacyBlocklist(source);
    const existing = await api(DOCUMENT), current = unpack(existing);
    const ready = validBlocklist(current) && (!legacy || (
        legacy.blockedUids.every(value => current.blockedUids.includes(value))
        && legacy.blockedEmails.every(value => current.blockedEmails.includes(value))));
    let changed = false;
    if (mode === '--apply' && !ready) {
        if (!legacy || (existing && !validBlocklist(current))) throw new Error('Manual review required; existing data will not be overwritten.');
        const merged = { blockedUids: [...new Set([...(current?.blockedUids || []), ...legacy.blockedUids])],
            blockedEmails: [...new Set([...(current?.blockedEmails || []), ...legacy.blockedEmails])] };
        const list = values => ({ arrayValue: { values: values.map(stringValue => ({ stringValue })) } });
        const fields = { ...(existing?.fields || {}), schemaVersion: { integerValue: '1' },
            blockedUids: list(merged.blockedUids), blockedEmails: list(merged.blockedEmails),
            sourceRulesSha256: { stringValue: crypto.createHash('sha256').update(source).digest('hex') } };
        const condition = existing ? 'currentDocument.updateTime=' + encodeURIComponent(existing.updateTime) : 'currentDocument.exists=false';
        await api(DOCUMENT + '?' + condition, { method: 'PATCH', body: JSON.stringify({ fields }) });
        const confirmed = unpack(await api(DOCUMENT));
        if (!validBlocklist(confirmed) || !merged.blockedUids.every(value => confirmed.blockedUids.includes(value))
            || !merged.blockedEmails.every(value => confirmed.blockedEmails.includes(value))) throw new Error('Migration verification failed.');
        changed = true;
    }
    const result = { project: PROJECT, mode, ready: ready || changed, changed,
        privateDocumentExists: !!existing || changed,
        legacyCounts: legacy ? { uids: legacy.blockedUids.length, emails: legacy.blockedEmails.length } : null };
    console.log(JSON.stringify(result));
    if (mode === '--check' && !result.ready) throw new Error('Private blocklist is not ready. Do not deploy rules or Functions.');
}

module.exports = { legacyBlocklist, unpack };
if (require.main === module) run(process.argv[2]).catch(() => {
    console.error('Security configuration check failed. No credentials or policy values are logged. Review docs/security.md.');
    process.exitCode = 1;
});
