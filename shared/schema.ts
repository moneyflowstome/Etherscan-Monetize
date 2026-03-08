import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  walletTracked: text("wallet_tracked"),
  chain: text("chain"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({ id: true, createdAt: true });
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;

export const hiddenNews = pgTable("hidden_news", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull().unique(),
  title: text("title").notNull(),
  reason: text("reason"),
  hiddenAt: timestamp("hidden_at").defaultNow().notNull(),
});

export const insertHiddenNewsSchema = createInsertSchema(hiddenNews).omit({ id: true, hiddenAt: true });
export type InsertHiddenNews = z.infer<typeof insertHiddenNewsSchema>;
export type HiddenNews = typeof hiddenNews.$inferSelect;

export const pinnedNews = pgTable("pinned_news", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull().unique(),
  title: text("title").notNull(),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
});

export const insertPinnedNewsSchema = createInsertSchema(pinnedNews).omit({ id: true, pinnedAt: true });
export type InsertPinnedNews = z.infer<typeof insertPinnedNewsSchema>;
export type PinnedNews = typeof pinnedNews.$inferSelect;
