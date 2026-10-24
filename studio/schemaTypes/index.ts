// The event schema lives at the repo root so the site and the seed script share it.
// @ts-ignore: plain JS module without type declarations
import event from '../../sanity/schemaTypes/event.mjs';

export const schemaTypes = [event];
