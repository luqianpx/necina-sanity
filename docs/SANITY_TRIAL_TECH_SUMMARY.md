# Sanity events trial: technical summary for review

Branch: `sanity-events-trial` (one commit on top of `main` at `2060c99`)
Scope: a side-by-side trial of reading events from Sanity instead of the hard-coded `EVENTS_LIST`. Nothing on the existing routes changes. Not intended to be merged as-is; intended to let the team compare and decide.

> 中文摘要：这个分支在不改动原有 `/events` 页面的前提下，新增 `/sanity/events` 路由，从 Sanity 读取活动数据。目的是让团队对比两种方式后再决定是否采用。下面是改了什么、为什么、测了什么、结果如何，以及已知问题。

---

## 1. Problem

Events live in `officialContent.ts` as a TypeScript array. Publishing or editing an event requires a code change, a commit, and a Vercel deploy. The goal is to let several non-technical admins publish events from a browser, from anywhere, without touching the repo.

## 2. Options considered

| Option | Rejected / chosen | Reason |
|---|---|---|
| Edit the TS file via GitHub web UI | Rejected | Admins need GitHub accounts and git literacy; a syntax slip breaks the build; images must be committed by hand |
| Decap CMS (git-based) | Rejected for the trial | Still needs GitHub accounts and an OAuth proxy; every save is a commit + rebuild, so publishing is not immediate |
| **Sanity (hosted headless CMS)** | **Chosen for the trial** | Hosted editor (Studio), roles, image CDN, version history out of the box; publish is immediate; free tier covers this scale |
| Supabase + custom admin UI | Rejected for the trial | Most flexible and data stays ours, but requires building auth, RLS, upload and a whole admin UI before anything can be compared |

Sanity was picked because it needed the least code to produce something testable. Supabase remains the fallback if the team wants full data ownership.

## 3. What changed

```
 .env.example                  |   4 +     two new VITE_SANITY_* keys (empty)
 App.tsx                       |   4 +     three /sanity/... routes
 pages/EventsPage.tsx          |  19 ++-   optional dataSource prop, status banner
 pages/EventDetailPage.tsx     |  21 +++-  optional dataSource prop, loading state
 services/sanityEvents.ts      |  65 +     fetch + hook, no SDK
 sanity/schemaTypes/event.mjs  |  97 +     Studio schema
 scripts/seed-sanity.mjs       |  97 +     one-time import
 SANITY_TRIAL.md               |  52 +     developer setup notes
 docs/HOW_TO_PUBLISH_EVENTS.md | 287 +     admin tutorial (Chinese)
 9 files changed, 637 insertions(+), 9 deletions(-)
```

Only 43 changed lines touch existing components. The rest is new files.

### 3.1 Data access (`services/sanityEvents.ts`)

- Plain `fetch` against `https://<projectId>.apicdn.sanity.io/v2024-01-01/data/query/<dataset>` with a GROQ query. No `@sanity/client` dependency added, so `package.json` is untouched.
- Anonymous read; the dataset is public. No token in the browser bundle.
- `useSanityEvents(enabled)` only fires when `enabled` is true, so the original pages never make a network call.
- GROQ: `*[_type == "event"] | order(sortOrder asc) { ..., "image": image.asset->url, "posterImage": posterImage.asset->url, "photoImage": photoImage.asset->url }`. The spread keeps every field, so the returned shape matches `OfficialEvent` without a mapping layer; image references are resolved to CDN URLs.

### 3.2 Pages

`EventsPage` and `EventDetailPage` get an optional `dataSource?: 'local' | 'sanity'` prop, default `'local'`. With `'local'` the code path is exactly what it was. With `'sanity'`:

- the list is `sanity.events` instead of `EVENTS_LIST`
- `getEventBySlug` is replaced by a `find` over the chosen list (same predicate: `slug === x || id === x`)
- prev/next navigation indexes into the chosen list
- a banner shows loading / error / count so testers can tell the two versions apart

### 3.3 Routes (`App.tsx`)

```
/sanity/events
/sanity/events/:slug
/sanity/events/:slug/poster
```

mounted alongside the unchanged `/events*` routes.

### 3.4 Schema (`sanity/schemaTypes/event.mjs`)

Derived field-for-field from the `OfficialEvent` interface (`officialContent.ts:44`), which itself was written around the six existing events. Two fields were added that the interface does not have:

- `sortOrder` (number): preserves today's array order. Lower first.
- `startDate` (date, optional): not used by the site yet; reserved so `status` and ordering can be computed instead of typed by hand.

`category` and `status` are enumerated (dropdown / radio). `id`, `slug`, `category`, `status` are required. Image fields are Sanity `image` types.

### 3.5 Seed (`scripts/seed-sanity.mjs`)

One-time import of `EVENTS_LIST`. Uploads each referenced image (from `public/`, or downloads it when the path is an absolute URL, which one event's YouTube thumbnail is), then `createOrReplace` with `_id = event-<id>`. Requires a write token via `SANITY_WRITE_TOKEN`; never a `VITE_` variable. Imports `officialContent.ts` directly, so it needs Node ≥ 23.6 (type stripping). Re-running overwrites Studio edits, which the docs call out.

## 4. What was tested and the results

| Check | How | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | exit 0 |
| Production build | `npx vite build` | success; same single-chunk size warning as `main` (840 kB, pre-existing) |
| Seed dry run | `node scripts/seed-sanity.mjs --dry-run` | lists the 6 events in order |
| Seed real run | with project `3p40dgwx`, dataset `production` | `Wrote 6 events to production.` |
| Data round-trip | GROQ via curl: `count(*[_type=="event"])` and the app's full query | 6 documents; `image` resolved to `cdn.sanity.io` URLs; `status`/`category` preserved |
| CORS | curl with `Origin: http://localhost:3000` | `403` before the origin was added in Sanity manage; `200` + `access-control-allow-origin: http://localhost:3000` after |
| Dev server route | `curl http://localhost:3000/sanity/events` | 200 (SPA shell) |
| Browser render of `/sanity/events` | manual, by the project owner after the CORS fix | reported as loading successfully |

Environment note: on the BMS network, Node needed `NODE_USE_ENV_PROXY=1` and `NODE_EXTRA_CA_CERTS=<exported system roots>` to reach npm and Sanity. This is a local network condition, not a property of the branch.

### Not tested

- `/sanity/events/:slug` detail and `/poster` views in a browser (code path is shared with the original page, but the async loading branch is new)
- Chinese locale rendering of Sanity-sourced content
- Sanity Studio itself: not created yet. The schema file has not been loaded into a running Studio, so field validation callbacks and the `.mjs` import into a TypeScript Studio project are unverified.
- Vercel preview deployment (needs `VITE_SANITY_*` env vars and the preview domain added to CORS)
- Behaviour when Sanity is unreachable: the page shows the error banner and an empty list; there is no fallback to the local data by design, so the two versions stay distinguishable

## 5. Known limitations of the trial (intentional)

- Internal links inside the trial pages (`prev/next`, "Back to All Events", home page cards) still point at `/events`, so navigation drops out of the Sanity version. Fixing this means parametrising link bases, which was left out to keep the diff small.
- `OfficialHome` still reads `EVENTS_LIST`; only the two events pages were switched.
- Ordering is `sortOrder`, maintained by hand. `status` is a manual radio. Both should eventually derive from `startDate`.
- The category filter UI lists four categories; `Community` events only appear under "All". Pre-existing behaviour, now visible in Studio's dropdown.
- Free plan: two roles (Administrator, Viewer). Multiple editors all have to be Administrators until the Growth plan.

## 6. Security notes

- No secrets in the repo. `.env.local` (project ID only) is git-ignored. Project ID is not sensitive; it is in every API URL.
- The dataset is public by requirement of anonymous reads on the free plan. Anything published is world-readable. Drafts are not.
- A write token was used for seeding and was shared over chat during the trial. It should be treated as leaked and revoked in Sanity manage → API → Tokens. Nothing in the branch needs it.
- Pre-existing, unrelated: `VITE_GEMINI_API_KEY` in `.env.example` is bundled into the client by Vite. If that key is live, it is exposed to every visitor. Worth moving the Gemini call behind a Vercel function regardless of this trial.

## 7. If the team adopts Sanity

1. Switch `/events*` routes to `dataSource="sanity"` (or make Sanity the default and remove the prop), delete the `/sanity/*` routes, and point `OfficialHome` at the same hook.
2. Decide whether `EVENTS_LIST` stays as an offline fallback or is removed.
3. Compute `status` from `startDate` and order by it; remove `sortOrder` or keep it as a manual override.
4. Add `VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` to Vercel; add the production and preview domains to CORS origins.
5. Create and deploy Studio (`npx sanity deploy`), invite admins, hand them `docs/HOW_TO_PUBLISH_EVENTS.md` or `docs/ADMIN_QUICKSTART.md`.
6. Consider a `@sanity/client` + `@sanity/image-url` dependency for hotspot/crop and typed queries once the approach is settled; the raw `fetch` was deliberate for the trial.

## 8. How to review locally

```bash
git checkout sanity-events-trial
npm ci
printf 'VITE_SANITY_PROJECT_ID=3p40dgwx\nVITE_SANITY_DATASET=production\n' > .env.local
npm run dev
```

Open `http://localhost:3000/events` and `http://localhost:3000/sanity/events` side by side. `http://localhost:3000` is already in the project's CORS list; any other port needs adding first.

Related docs: [`SANITY_TRIAL.md`](../SANITY_TRIAL.md) (setup), [`HOW_TO_PUBLISH_EVENTS.md`](HOW_TO_PUBLISH_EVENTS.md) (full admin tutorial), [`ADMIN_QUICKSTART.md`](ADMIN_QUICKSTART.md) (one-page admin version).
