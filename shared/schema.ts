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

export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  url: text("url").notNull(),
  affiliateUrl: text("affiliate_url"),
  description: text("description"),
  type: text("type").notNull().default("centralized"),
  country: text("country"),
  year: integer("year"),
  tradingPairs: integer("trading_pairs"),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const insertExchangeSchema = createInsertSchema(exchanges).omit({ id: true });
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, read: true, createdAt: true });
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author").default("Admin"),
  category: text("category"),
  tags: text("tags").array(),
  coverImage: text("cover_image"),
  published: boolean("published").default(false),
  featured: boolean("featured").default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, views: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const seoMeta = pgTable("seo_meta", {
  id: serial("id").primaryKey(),
  pagePath: text("page_path").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  canonical: text("canonical"),
});

export const insertSeoMetaSchema = createInsertSchema(seoMeta).omit({ id: true });
export type InsertSeoMeta = z.infer<typeof insertSeoMetaSchema>;
export type SeoMeta = typeof seoMeta.$inferSelect;

export const airdrops = pgTable("airdrops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  website: text("website"),
  description: text("description"),
  tokenSymbol: text("token_symbol"),
  rewardType: text("reward_type").notNull().default("Task"),
  rewardAmount: text("reward_amount"),
  referralReward: text("referral_reward"),
  blockchain: text("blockchain").notNull().default("Ethereum"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  steps: text("steps").array(),
  requirements: text("requirements"),
  status: text("status").notNull().default("pending"),
  featured: boolean("featured").default(false),
  submitterEmail: text("submitter_email"),
  submitterName: text("submitter_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAirdropSchema = createInsertSchema(airdrops).omit({ id: true, createdAt: true });
export type InsertAirdrop = z.infer<typeof insertAirdropSchema>;
export type Airdrop = typeof airdrops.$inferSelect;

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  success: boolean("success").notNull().default(false),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({ id: true, attemptedAt: true });
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

export const blockedIps = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  reason: text("reason").notNull().default("Too many failed login attempts"),
  blockedBy: text("blocked_by").notNull().default("auto"),
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertBlockedIpSchema = createInsertSchema(blockedIps).omit({ id: true, blockedAt: true });
export type InsertBlockedIp = z.infer<typeof insertBlockedIpSchema>;
export type BlockedIp = typeof blockedIps.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  message: text("message").notNull(),
  coinTag: text("coin_tag"),
  ip: text("ip"),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, flagged: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const spamReports = pgTable("spam_reports", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  nickname: text("nickname").notNull(),
  reason: text("reason").notNull(),
  severity: text("severity").notNull().default("medium"),
  messageId: integer("message_id"),
  messageText: text("message_text"),
  autoBanned: boolean("auto_banned").default(false),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSpamReportSchema = createInsertSchema(spamReports).omit({ id: true, createdAt: true });
export type InsertSpamReport = z.infer<typeof insertSpamReportSchema>;
export type SpamReport = typeof spamReports.$inferSelect;

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  size: text("size").notNull(),
  zone: text("zone").notNull(),
  clicks: integer("clicks").notNull().default(0),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, clicks: true, createdAt: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

export const bannerInquiries = pgTable("banner_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  bannerSize: text("banner_size").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  adminReply: text("admin_reply"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBannerInquirySchema = createInsertSchema(bannerInquiries).omit({ id: true, status: true, adminReply: true, createdAt: true });
export type InsertBannerInquiry = z.infer<typeof insertBannerInquirySchema>;
export type BannerInquiry = typeof bannerInquiries.$inferSelect;
