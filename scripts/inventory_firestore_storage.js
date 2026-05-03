#!/usr/bin/env node

const { execFileSync, execSync } = require("child_process");

function parseArgs(argv) {
  const args = {
    project: "tenioha-game",
    maxDepth: 8,
    limitDocs: 200000,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--project") args.project = argv[++i];
    else if (arg === "--max-depth") args.maxDepth = Number(argv[++i]);
    else if (arg === "--limit-docs") args.limitDocs = Number(argv[++i]);
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.maxDepth) || args.maxDepth < 1) {
    throw new Error("--max-depth must be a positive integer");
  }
  if (!Number.isInteger(args.limitDocs) || args.limitDocs < 1) {
    throw new Error("--limit-docs must be a positive integer");
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/inventory_firestore_storage.js [options]

Options:
  --project <id>       Firebase project ID. Default: tenioha-game
  --max-depth <n>      Max document path depth to inspect. Default: 8
  --limit-docs <n>     Safety cap for scanned documents. Default: 200000
`);
}

function getFirebaseAccessToken() {
  let raw;
  try {
    raw = execFileSync(process.platform === "win32" ? "firebase.cmd" : "firebase", ["login:list", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (_error) {
    raw = execSync("npx firebase login:list --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  const parsed = JSON.parse(raw);
  const token = parsed?.result?.[0]?.tokens?.access_token;
  if (!token) throw new Error("Could not read Firebase CLI access token. Run `firebase login` first.");
  return token;
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
  return res.json();
}

function bytes(value) {
  return Buffer.byteLength(value, "utf8");
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  const units = ["KiB", "MiB", "GiB"];
  let value = n;
  let unit = "B";
  for (const next of units) {
    value /= 1024;
    unit = next;
    if (value < 1024) break;
  }
  return `${value.toFixed(2)} ${unit}`;
}

function relativeDocPath(fullName) {
  return fullName.split("/documents/")[1] || "";
}

function collectionIdFromPath(collectionPath) {
  const parts = collectionPath.split("/");
  return parts[parts.length - 1];
}

function collectionPattern(collectionPath) {
  return collectionPath
    .split("/")
    .map((part, index) => (index % 2 === 1 ? "{doc}" : part))
    .join("/");
}

function addSummary(map, key, docSize) {
  const current = map.get(key) || { docs: 0, bytes: 0 };
  current.docs += 1;
  current.bytes += docSize;
  map.set(key, current);
}

async function listCollectionIds(project, token, docPath = "") {
  const base = firestoreBaseUrl(project);
  const url = docPath ? `${base}/${docPath}:listCollectionIds` : `${base}:listCollectionIds`;
  const body = await apiFetch(url, token, {
    method: "POST",
    body: JSON.stringify({ pageSize: 1000 }),
  });
  return body.collectionIds || [];
}

async function listCollectionDocs(project, token, collectionPath) {
  const docs = [];
  let pageToken = "";
  do {
    const url = new URL(`${firestoreBaseUrl(project)}/${collectionPath}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const body = await apiFetch(url.toString(), token);
    docs.push(...(body.documents || []));
    pageToken = body.nextPageToken || "";
  } while (pageToken);
  return docs;
}

async function main() {
  const args = parseArgs(process.argv);
  const token = getFirebaseAccessToken();
  const queue = [];
  const byCollectionId = new Map();
  const byCollectionPattern = new Map();
  const largestDocs = [];
  const errors = [];
  let scannedDocs = 0;
  let totalFieldBytes = 0;

  const rootCollections = await listCollectionIds(args.project, token);
  for (const collectionId of rootCollections) {
    queue.push({ collectionPath: collectionId, depth: 1 });
  }

  while (queue.length && scannedDocs < args.limitDocs) {
    const item = queue.shift();
    let docs;
    try {
      docs = await listCollectionDocs(args.project, token, item.collectionPath);
    } catch (error) {
      errors.push({ path: item.collectionPath, message: error.message });
      continue;
    }

    for (const doc of docs) {
      if (scannedDocs >= args.limitDocs) break;
      const fields = doc.fields || {};
      const docSize = bytes(JSON.stringify(fields));
      const docPath = relativeDocPath(doc.name);
      scannedDocs += 1;
      totalFieldBytes += docSize;

      addSummary(byCollectionId, collectionIdFromPath(item.collectionPath), docSize);
      addSummary(byCollectionPattern, collectionPattern(item.collectionPath), docSize);
      largestDocs.push({ path: docPath, bytes: docSize });
      largestDocs.sort((a, b) => b.bytes - a.bytes);
      if (largestDocs.length > 20) largestDocs.pop();

      const nextDepth = item.depth + 1;
      if (nextDepth <= args.maxDepth) {
        try {
          const subcollections = await listCollectionIds(args.project, token, docPath);
          for (const subcollection of subcollections) {
            queue.push({ collectionPath: `${docPath}/${subcollection}`, depth: nextDepth });
          }
        } catch (error) {
          errors.push({ path: docPath, message: error.message });
        }
      }
    }
  }

  function printTable(title, rows) {
    console.log(`\n${title}`);
    for (const row of rows) {
      console.log(`  ${row.key}: ${row.docs} docs, ${formatBytes(row.bytes)}`);
    }
  }

  const topIds = [...byCollectionId.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20);
  const topPatterns = [...byCollectionPattern.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 30);

  console.log(`Project: ${args.project}`);
  console.log(`Scanned docs: ${scannedDocs}`);
  console.log(`Estimated JSON field bytes: ${formatBytes(totalFieldBytes)}`);
  if (scannedDocs >= args.limitDocs) {
    console.log(`Stopped at --limit-docs ${args.limitDocs}`);
  }
  printTable("Top collection IDs", topIds);
  printTable("Top collection paths", topPatterns);

  console.log("\nLargest documents");
  for (const doc of largestDocs) {
    console.log(`  ${doc.path}: ${formatBytes(doc.bytes)}`);
  }

  if (errors.length) {
    console.log("\nErrors");
    for (const error of errors.slice(0, 20)) {
      console.log(`  ${error.path}: ${error.message}`);
    }
    if (errors.length > 20) console.log(`  ...and ${errors.length - 20} more`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
