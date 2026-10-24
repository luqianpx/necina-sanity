# Sanity events trial

Docs in `docs/`:

- [`SANITY_TRIAL_TECH_SUMMARY.md`](docs/SANITY_TRIAL_TECH_SUMMARY.md): what changed, why, what was tested, known limits (for technical review)
- [`HOW_TO_PUBLISH_EVENTS.md`](docs/HOW_TO_PUBLISH_EVENTS.md): full admin tutorial (Chinese)
- [`ADMIN_QUICKSTART.md`](docs/ADMIN_QUICKSTART.md): one-page admin version (Chinese)

This branch adds a Sanity-backed copy of the events pages for comparison with the
original, file-based version. The original pages and routes are unchanged.

| Version | URL | Data source |
|---|---|---|
| Original | `/events`, `/events/:slug` | `EVENTS_LIST` in `officialContent.ts` |
| Sanity trial | `/sanity/events`, `/sanity/events/:slug` | Sanity dataset. If `VITE_SANITY_PROJECT_ID` is unset, the page shows an error in the status banner and no events. |

## What changed

- `services/sanityEvents.ts`: reads events from Sanity's public CDN API with `fetch`. No SDK, no token.
- `pages/EventsPage.tsx`, `pages/EventDetailPage.tsx`: new optional `dataSource` prop (default `local`, so the original behaviour is unchanged).
- `App.tsx`: three new `/sanity/...` routes.
- `sanity/schemaTypes/event.mjs`: Studio schema, field names mirror `OfficialEvent`.
- `studio/`: Sanity Studio (own `package.json`; `sanity.config.ts`, `sanity.cli.ts`, `schemaTypes/index.ts` importing the shared schema).
- `scripts/seed-sanity.mjs`: one-time import of `EVENTS_LIST` (images are uploaded from `public/`, remote URLs are downloaded first).

## Setup

1. Create a Sanity project at [sanity.io/manage](https://www.sanity.io/manage). Note the **project ID**.
2. Make the dataset `production` **public**. This is required for anonymous reads on the free plan.
3. Add the site origin (`http://localhost:3000`, and later the production domain) under **CORS origins** in Sanity manage. Without this, the browser shows "Failed to fetch".
4. Run the Studio, which lives in `studio/` and imports the shared schema from `sanity/schemaTypes/event.mjs`:
   ```bash
   cd studio && npm install && npm run dev
   ```
   Opens the editor at `localhost:3333` (first visit asks you to log in to Sanity). `npx sanity schema validate` checks the schema; `npx sanity login && npx sanity deploy` publishes the Studio to `<name>.sanity.studio`.
5. Create a write token: Sanity manage → API → Tokens → Editor. Keep it private.
6. Seed the data (dry run first):
   ```bash
   node scripts/seed-sanity.mjs --dry-run
   SANITY_PROJECT_ID=<PROJECT_ID> SANITY_DATASET=production SANITY_WRITE_TOKEN=<TOKEN> node scripts/seed-sanity.mjs
   ```
   Re-running overwrites documents with the same `_id`, including edits made in Studio. Run it once.
7. Put the project ID in `.env.local` (not committed):
   ```
   VITE_SANITY_PROJECT_ID=<PROJECT_ID>
   VITE_SANITY_DATASET=production
   ```
8. Run `npm run dev` and open `http://localhost:3000/sanity/events` and `/events` side by side.

## Known limits of the trial

- Links inside the trial pages (prev/next, "view all") still point to `/events`, so navigation leaves the trial.
- Only `dataSource` is switched. Other pages (home page event cards, navbar) still read the local data.
- `startDate` is optional and the seed does not fill it. Order follows `sortOrder`, which mirrors today's array order.
- Editors are not created by this trial. Add them in Sanity manage → Members. The free plan has only Administrator and Viewer roles, so editing by several people needs the Growth plan.
- The dataset is public, so anything saved as a published document in it is readable by anyone. Drafts in Studio are not returned by the public API.
