#!/usr/bin/env node

const { execFileSync, execSync } = require("child_process");

const CLOUD_SAVE_DOC_LIMIT_BYTES = 1040000;
const CLOUD_SAVE_CHUNK_BYTES = 350000;

function parseArgs(argv) {
  const args = {
    project: "tenioha-game",
    limit: 20,
    execute: false,
    cleanupChunks: false,
    deleteAllSaveChunks: false,
    chunkDeleteLimit: 200,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--execute") args.execute = true;
    else if (arg === "--cleanup-chunks") args.cleanupChunks = true;
    else if (arg === "--delete-all-save-chunks") args.deleteAllSaveChunks = true;
    else if (arg === "--project") args.project = argv[++i];
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--chunk-delete-limit") args.chunkDeleteLimit = Number(argv[++i]);
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.limit) || args.limit <= 0) {
    throw new Error("--limit must be a positive integer");
  }
  if (!Number.isInteger(args.chunkDeleteLimit) || args.chunkDeleteLimit < 0) {
    throw new Error("--chunk-delete-limit must be a non-negative integer");
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/compact_firestore_saves.js [options]

Options:
  --project <id>              Firebase project ID. Default: tenioha-game
  --limit <n>                 Max user documents to scan. Default: 20
  --execute                   Apply writes. Without this, dry-run only.
  --cleanup-chunks            Delete stale save_chunks after successful rewrite.
  --delete-all-save-chunks    Delete every save_chunks doc after verifying no user is chunked.
  --chunk-delete-limit <n>    Max stale chunks to delete per user. Default: 200
`);
}

function byteSize(value) {
  return Buffer.byteLength(value, "utf8");
}

function splitStringByBytes(str, maxBytes) {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    let lo = i + 1;
    let hi = str.length;
    let best = lo;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const part = str.slice(i, mid);
      if (byteSize(part) <= maxBytes) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best <= i) throw new Error("Failed to split saveData safely by bytes");
    chunks.push(str.slice(i, best));
    i = best;
  }
  return chunks;
}

function compactSaveData(rawSaveData) {
  const data = JSON.parse(rawSaveData);

  delete data.dailyHistory;

  if (data.wordStates && typeof data.wordStates === "object") {
    const compactWordStates = {};
    for (const [key, state] of Object.entries(data.wordStates)) {
      if (state && state !== "unlearned") compactWordStates[key] = state;
    }
    data.wordStates = compactWordStates;
  }

  if (data.srsData && typeof data.srsData === "object") {
    const compactSrs = {};
    for (const [key, s] of Object.entries(data.srsData)) {
      if (!s || typeof s !== "object") continue;
      const hasReviewHistory =
        (s.successCount || 0) > 0 ||
        (s.failCount || 0) > 0 ||
        s.everWrong === true ||
        s.firstTryPerfect === true;
      if (!hasReviewHistory) continue;

      const c = {};
      if (typeof s.dueAt === "number") c.dueAt = s.dueAt;
      if (typeof s.successCount === "number") c.successCount = s.successCount;
      if (typeof s.failCount === "number") c.failCount = s.failCount;
      if (typeof s.reviewStep === "number" && s.reviewStep !== 0) c.reviewStep = s.reviewStep;
      if (typeof s.lastReviewedAt === "number" && s.lastReviewedAt !== 0) c.lastReviewedAt = s.lastReviewedAt;
      if (typeof s.stability === "number" && s.stability !== 1) c.stability = s.stability;
      if (typeof s.streak === "number" && s.streak !== 0) c.streak = s.streak;
      if (s.everWrong === true) c.everWrong = true;
      if (s.firstTryPerfect === true) c.firstTryPerfect = true;
      compactSrs[key] = c;
    }
    data.srsData = compactSrs;
  }

  data.cloudCompactVersion = 2;
  return JSON.stringify(data);
}

async function fetchCloudSaveData(userRef, userData) {
  if (userData.saveStorage === "chunked" && userData.saveChunkCount > 0) {
    const prefix = userData.saveChunkPrefix;
    const count = userData.saveChunkCount;
    const chunks = [];
    for (let i = 0; i < count; i++) {
      const chunkSnap = await userRef.collection("save_chunks").doc(`${prefix}_${i}`).get();
      if (!chunkSnap.exists) throw new Error(`missing chunk ${i + 1}/${count}`);
      chunks.push(chunkSnap.data().data || "");
    }
    return chunks.join("");
  }
  return userData.saveData || null;
}

function getFirebaseAccessToken() {
  let raw;
  try {
    raw = execFileSync(process.platform === "win32" ? "firebase.cmd" : "firebase", ["login:list", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    raw = execSync("npx firebase login:list --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  const parsed = JSON.parse(raw);
  const token = parsed && parsed.result && parsed.result[0] && parsed.result[0].tokens && parsed.result[0].tokens.access_token;
  if (!token) throw new Error("Could not read Firebase CLI access token. Run `firebase login` first.");
  return token;
}

function valueToJs(value) {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  return undefined;
}

function docToUser(doc) {
  const fields = doc.fields || {};
  const id = doc.name.split("/").pop();
  return {
    id,
    name: doc.name,
    updateTime: doc.updateTime,
    data: {
      saveData: valueToJs(fields.saveData),
      saveStorage: valueToJs(fields.saveStorage),
      saveChunkCount: valueToJs(fields.saveChunkCount),
      saveChunkPrefix: valueToJs(fields.saveChunkPrefix),
      cloudCleanupVersion: valueToJs(fields.cloudCleanupVersion),
    },
  };
}

function firestoreBaseUrl(project) {
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
}

async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 500)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function listUsers(project, token, limit) {
  const users = [];
  let pageToken = "";

  while (users.length < limit) {
    const pageSize = Math.min(100, limit - users.length);
    const url = new URL(`${firestoreBaseUrl(project)}/users`);
    url.searchParams.set("pageSize", String(pageSize));
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    for (const field of ["saveData", "saveStorage", "saveChunkCount", "saveChunkPrefix", "cloudCleanupVersion"]) {
      url.searchParams.append("mask.fieldPaths", field);
    }

    const body = await apiFetch(url.toString(), token);
    users.push(...((body.documents || []).map(docToUser)));
    pageToken = body.nextPageToken || "";
    if (!pageToken || !(body.documents || []).length) break;
  }

  return users;
}

async function fetchCloudSaveDataRest(project, token, user) {
  const userData = user.data;
  if (userData.saveStorage === "chunked" && userData.saveChunkCount > 0) {
    const chunks = [];
    for (let i = 0; i < userData.saveChunkCount; i++) {
      const url = `${firestoreBaseUrl(project)}/users/${encodeURIComponent(user.id)}/save_chunks/${encodeURIComponent(`${userData.saveChunkPrefix}_${i}`)}`;
      const doc = await apiFetch(url, token);
      chunks.push(valueToJs((doc.fields || {}).data) || "");
    }
    return chunks.join("");
  }
  return userData.saveData || null;
}

async function patchUser(project, token, user, fields, deleteFields = []) {
  const url = new URL(`${firestoreBaseUrl(project)}/users/${encodeURIComponent(user.id)}`);
  for (const field of Object.keys(fields)) url.searchParams.append("updateMask.fieldPaths", field);
  for (const field of deleteFields) url.searchParams.append("updateMask.fieldPaths", field);
  url.searchParams.set("currentDocument.updateTime", user.updateTime);
  await apiFetch(url.toString(), token, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

async function putChunk(project, token, userId, docId, idx, data) {
  const url = `${firestoreBaseUrl(project)}/users/${encodeURIComponent(userId)}/save_chunks/${encodeURIComponent(docId)}`;
  await apiFetch(url, token, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        idx: { integerValue: String(idx) },
        data: { stringValue: data },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
}

async function rewriteSaveRest(project, token, user, compactRaw) {
  const compactBytes = byteSize(compactRaw);

  if (compactBytes <= CLOUD_SAVE_DOC_LIMIT_BYTES) {
    await patchUser(project, token, user, {
      saveData: { stringValue: compactRaw },
      saveStorage: { stringValue: "inline" },
      saveChunkPrefix: { nullValue: null },
      saveChunkCount: { integerValue: "0" },
      cloudSaveTooLarge: { booleanValue: false },
      cloudCleanupVersion: { integerValue: "2" },
    });
    return { storage: "inline", activePrefix: null, chunkCount: 0 };
  }

  const chunks = splitStringByBytes(compactRaw, CLOUD_SAVE_CHUNK_BYTES);
  const prefix = `cleanup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  for (let i = 0; i < chunks.length; i++) {
    await putChunk(project, token, user.id, `${prefix}_${i}`, i, chunks[i]);
  }

  await patchUser(
    project,
    token,
    user,
    {
      saveStorage: { stringValue: "chunked" },
      saveChunkPrefix: { stringValue: prefix },
      saveChunkCount: { integerValue: String(chunks.length) },
      cloudSaveTooLarge: { booleanValue: false },
      cloudCleanupVersion: { integerValue: "2" },
    },
    ["saveData"],
  );
  return { storage: "chunked", activePrefix: prefix, chunkCount: chunks.length };
}

async function cleanupStaleChunksRest(project, token, userId, activePrefix, limit) {
  if (limit <= 0) return 0;
  const url = new URL(`${firestoreBaseUrl(project)}/users/${encodeURIComponent(userId)}/save_chunks`);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.append("mask.fieldPaths", "__name__");
  const body = await apiFetch(url.toString(), token);
  let deleted = 0;
  for (const doc of body.documents || []) {
    const id = doc.name.split("/").pop();
    const keep = activePrefix && id.startsWith(`${activePrefix}_`);
    if (!keep) {
      await apiFetch(`${firestoreBaseUrl(project)}/users/${encodeURIComponent(userId)}/save_chunks/${encodeURIComponent(id)}`, token, {
        method: "DELETE",
      });
      deleted++;
    }
  }
  return deleted;
}

async function listSaveChunksCollectionGroup(project, token, limit) {
  const url = `${firestoreBaseUrl(project)}:runQuery`;
  const body = await apiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        select: { fields: [{ fieldPath: "__name__" }] },
        from: [{ collectionId: "save_chunks", allDescendants: true }],
        limit,
      },
    }),
  });
  return body.map((row) => row.document && row.document.name).filter(Boolean);
}

async function deleteDocumentByName(project, token, documentName) {
  const prefix = `projects/${project}/databases/(default)/documents/`;
  const documentPath = documentName.slice(documentName.indexOf(prefix) + prefix.length);
  await apiFetch(`${firestoreBaseUrl(project)}/${documentPath.split("/").map(encodeURIComponent).join("/")}`, token, {
    method: "DELETE",
  });
}

async function deleteAllSaveChunks(project, token, users, batchLimit) {
  const chunkedUsers = users.filter((user) => user.data.saveStorage === "chunked" && user.data.saveChunkCount > 0);
  if (chunkedUsers.length > 0) {
    throw new Error(`Refusing to delete save_chunks: ${chunkedUsers.length} user(s) still use chunked saves.`);
  }

  let totalDeleted = 0;
  for (;;) {
    const chunkNames = await listSaveChunksCollectionGroup(project, token, batchLimit);
    if (chunkNames.length === 0) break;
    for (const name of chunkNames) {
      await deleteDocumentByName(project, token, name);
      totalDeleted++;
    }
    console.log(`Deleted save_chunks batch: ${chunkNames.length} (total ${totalDeleted})`);
    if (chunkNames.length < batchLimit) break;
  }
  return totalDeleted;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function main() {
  const args = parseArgs(process.argv);
  const token = getFirebaseAccessToken();

  console.log(`Project: ${args.project}`);
  console.log(`Mode: ${args.execute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`Scan limit: ${args.limit}`);

  const users = await listUsers(args.project, token, args.limit);

  if (args.deleteAllSaveChunks) {
    if (!args.execute) {
      const chunkedUsers = users.filter((user) => user.data.saveStorage === "chunked" && user.data.saveChunkCount > 0);
      console.log(`Chunked users: ${chunkedUsers.length}`);
      console.log("Dry-run only. Add --execute to delete all save_chunks.");
      return;
    }
    const deleted = await deleteAllSaveChunks(args.project, token, users, args.chunkDeleteLimit);
    console.log(`Deleted all stale save_chunks: ${deleted}`);
    return;
  }
  const totals = {
    scanned: 0,
    eligible: 0,
    changed: 0,
    parseErrors: 0,
    beforeBytes: 0,
    afterBytes: 0,
    deletedChunks: 0,
  };

  for (const user of users) {
    totals.scanned++;
    const userData = user.data;
    if (!userData.saveData && !(userData.saveStorage === "chunked" && userData.saveChunkCount > 0)) {
      continue;
    }

    totals.eligible++;
    let raw;
    let compact;
    try {
      raw = await fetchCloudSaveDataRest(args.project, token, user);
      if (!raw) continue;
      compact = compactSaveData(raw);
    } catch (error) {
      totals.parseErrors++;
      console.warn(`SKIP ${user.id}: ${error.message}`);
      continue;
    }

    const before = byteSize(raw);
    const after = byteSize(compact);
    totals.beforeBytes += before;
    totals.afterBytes += after;

    const reduction = before > 0 ? (((before - after) / before) * 100).toFixed(1) : "0.0";
    const shouldRewrite =
      compact !== raw ||
      userData.saveStorage === "chunked" ||
      userData.cloudCleanupVersion !== 2;

    console.log(
      `${shouldRewrite ? "CHANGE" : "OK"} ${user.id}: ${formatBytes(before)} -> ${formatBytes(after)} (${reduction}% less)`,
    );

    if (!shouldRewrite || !args.execute) {
      if (!shouldRewrite && args.execute && args.cleanupChunks && userData.saveStorage !== "chunked") {
        const deleted = await cleanupStaleChunksRest(args.project, token, user.id, null, args.chunkDeleteLimit);
        if (deleted > 0) {
          totals.deletedChunks += deleted;
          console.log(`  cleanup-only deletedChunks=${deleted}`);
        }
      }
      continue;
    }

    try {
      const result = await rewriteSaveRest(args.project, token, user, compact);
      let deleted = 0;
      if (args.cleanupChunks) {
        deleted = await cleanupStaleChunksRest(args.project, token, user.id, result.activePrefix, args.chunkDeleteLimit);
      }
      totals.changed++;
      totals.deletedChunks += deleted;
      console.log(`  wrote ${result.storage}${result.chunkCount ? ` (${result.chunkCount} chunks)` : ""}, deletedChunks=${deleted}`);
    } catch (error) {
      console.warn(`  WRITE SKIP ${userSnap.id}: ${error.message}`);
    }
  }

  const saved = totals.beforeBytes - totals.afterBytes;
  console.log("\nSummary");
  console.log(`  scanned: ${totals.scanned}`);
  console.log(`  eligible: ${totals.eligible}`);
  console.log(`  changed: ${totals.changed}`);
  console.log(`  parseErrors: ${totals.parseErrors}`);
  console.log(`  estimated before: ${formatBytes(totals.beforeBytes)}`);
  console.log(`  estimated after: ${formatBytes(totals.afterBytes)}`);
  console.log(`  estimated saved: ${formatBytes(saved)}`);
  console.log(`  deletedChunks: ${totals.deletedChunks}`);

  if (!args.execute) {
    console.log("\nDry-run only. Add --execute to apply changes.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
