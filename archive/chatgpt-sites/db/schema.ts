import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
 id:text('id').primaryKey(), owner:text('owner').notNull(), name:text('name').notNull(),
 draftKey:text('draft_key').notNull(), publishedKey:text('published_key'), previousKey:text('previous_key'),
 revision:integer('revision').notNull().default(1), updatedAt:text('updated_at').notNull(), publishedAt:text('published_at'),
}, t=>[index('projects_owner_idx').on(t.owner)]);
