import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, serial } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp AT TIME ZONE 'UTC')::text`),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  stock: integer("stock").default(0).notNull(),
  needsRepair: boolean("needs_repair").default(false).notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp AT TIME ZONE 'UTC')::text`),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp AT TIME ZONE 'UTC')::text`),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp AT TIME ZONE 'UTC')::text`),
});
