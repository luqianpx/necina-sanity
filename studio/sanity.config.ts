import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';

// Studio for the NECINA events trial. Project/dataset match the site's VITE_SANITY_* values.
export default defineConfig({
  name: 'default',
  title: 'NECINA Events',
  projectId: '3p40dgwx',
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
