import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  stock: integer("stock").default(0).notNull(),
  needsRepair: integer("needs_repair", { mode: "boolean" }).default(false).notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
