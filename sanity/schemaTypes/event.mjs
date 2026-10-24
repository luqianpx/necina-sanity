// Sanity Studio schema for `event`. Field names mirror OfficialEvent in officialContent.ts,
// so the seed script and the site query need no mapping layer.
// Plain objects are accepted by Sanity Studio's schema array; defineType is optional.

const str = (name, title, options = {}) => ({ name, title, type: 'string', ...options });
const text = (name, title) => ({ name, title, type: 'text', rows: 4 });
const strList = (name, title) => ({ name, title, type: 'array', of: [{ type: 'string' }] });
const bilingual = (base, title) => [
  str(base, `${title} (EN)`),
  str(`${base}_zh`, `${title} (中文)`),
];
const pairedText = (base, title) => [
  text(base, `${title} (EN)`),
  text(`${base}_zh`, `${title} (中文)`),
];
const block = (name, title) => ({
  name,
  title,
  type: 'array',
  of: [
    {
      type: 'object',
      fields: [
        str('title', 'Title (EN)'),
        str('title_zh', 'Title (中文)'),
        text('desc', 'Description (EN)'),
        text('desc_zh', 'Description (中文)'),
      ],
    },
  ],
});

export const eventSchema = {
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    str('id', 'Stable ID (kebab-case, unique)', { validation: (r) => r.required() }),
    str('slug', 'URL slug', { validation: (r) => r.required() }),
    { name: 'sortOrder', title: 'Sort order (lower = shown first)', type: 'number' },
    ...bilingual('title', 'Title'),
    ...bilingual('subtitle', 'Subtitle'),
    ...bilingual('date', 'Date (display text)'),
    {
      name: 'startDate',
      title: 'Start date (for sorting and status)',
      type: 'date',
      description: 'Optional for now. Recommended so status can be computed later.',
    },
    ...bilingual('publishDate', 'Publish date label'),
    ...bilingual('venue', 'Venue'),
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Flagship', 'AI & Tech', 'Youth', 'Entrepreneurship', 'Community'],
        layout: 'dropdown',
      },
      validation: (r) => r.required(),
    },
    str('category_zh', 'Category (中文)'),
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['upcoming', 'past'], layout: 'radio' },
      validation: (r) => r.required(),
    },
    ...pairedText('description', 'Description'),
    strList('speakers', 'Speakers (EN)'),
    strList('speakers_zh', 'Speakers (中文)'),
    str('registrationUrl', 'Registration URL'),
    str('registrationText', 'Registration button text (EN)'),
    str('registrationText_zh', 'Registration button text (中文)'),
    { name: 'image', title: 'Cover image', type: 'image', options: { hotspot: true } },
    { name: 'posterImage', title: 'Poster image', type: 'image' },
    { name: 'photoImage', title: 'Photo image', type: 'image' },
    ...bilingual('organizer', 'Organizer'),
    strList('coOrganizers', 'Co-organizers (EN)'),
    strList('coOrganizers_zh', 'Co-organizers (中文)'),
    ...bilingual('targetAudience', 'Target audience'),
    str('sourceUrl', 'Source URL'),
    str('sourceName', 'Source name (EN)'),
    str('sourceName_zh', 'Source name (中文)'),
    strList('highlights', 'Highlights (EN)'),
    strList('highlights_zh', 'Highlights (中文)'),
    block('curriculum', 'Curriculum'),
    strList('paragraphs', 'Paragraphs (EN)'),
    strList('paragraphs_zh', 'Paragraphs (中文)'),
  ],
  preview: {
    select: { title: 'title', subtitle: 'date' },
  },
};

export default eventSchema;
