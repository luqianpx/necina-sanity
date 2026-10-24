// One-time import of the local EVENTS_LIST into Sanity.
//
//   SANITY_PROJECT_ID=xxxx SANITY_DATASET=production SANITY_WRITE_TOKEN=xxxx \
//     node scripts/seed-sanity.mjs [--dry-run]
//
// The write token is server-side only. Never put it in a VITE_ variable.
// Re-running overwrites documents with the same _id (event-<id>), including edits made in Studio.
// Requires Node 23.6+ (runs officialContent.ts directly through type stripping).

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { EVENTS_LIST } = await import(join(root, 'officialContent.ts'));

const dryRun = process.argv.includes('--dry-run');
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_WRITE_TOKEN;
const API = `https://${projectId}.api.sanity.io/v2024-01-01`;

const IMAGE_FIELDS = ['image', 'posterImage', 'photoImage'];

const uploadCache = new Map();

// Uploads a file once and returns its asset _id.
// Local paths come from public/; absolute URLs (e.g. YouTube thumbnails) are downloaded first.
const uploadImage = async (path) => {
  if (uploadCache.has(path)) return uploadCache.get(path);
  const isRemote = /^https?:\/\//.test(path);
  const bytes = isRemote
    ? Buffer.from(await (await fetch(path)).arrayBuffer())
    : await readFile(join(root, 'public', decodeURIComponent(path)));
  const filename = path.split('?')[0].split('/').pop();
  const res = await fetch(`${API}/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed for ${path}: ${res.status} ${await res.text()}`);
  const { document } = await res.json();
  uploadCache.set(path, document._id);
  return document._id;
};

const imageRef = async (path) => {
  if (!path || dryRun) return undefined;
  const assetId = await uploadImage(path);
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
};

const toDocument = async (event, index) => {
  const { image, posterImage, photoImage, ...rest } = event;
  const doc = {
    _id: `event-${event.id}`,
    _type: 'event',
    ...rest,
    sortOrder: index,
  };
  for (const field of IMAGE_FIELDS) {
    if (event[field]) {
      const ref = await imageRef(event[field]);
      if (ref) doc[field] = ref;
    }
  }
  return doc;
};

const main = async () => {
  if (dryRun) {
    console.log(`Dry run: ${EVENTS_LIST.length} events would be written to ${dataset}.`);
    EVENTS_LIST.forEach((e, i) => console.log(`  ${i}. ${e.id} (${e.status}, ${e.category})`));
    return;
  }
  if (!projectId || !token) {
    throw new Error('Set SANITY_PROJECT_ID and SANITY_WRITE_TOKEN first (or use --dry-run).');
  }

  const docs = [];
  for (let i = 0; i < EVENTS_LIST.length; i++) {
    docs.push(await toDocument(EVENTS_LIST[i], i));
  }

  const res = await fetch(`${API}/data/mutate/${dataset}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations: docs.map((d) => ({ createOrReplace: d })) }),
  });
  if (!res.ok) throw new Error(`Mutation failed: ${res.status} ${await res.text()}`);
  console.log(`Wrote ${docs.length} events to ${dataset}.`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
