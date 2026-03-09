import { eq, desc, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  type User, type InsertUser,
  type SiteSetting, type InsertSiteSetting,
  type PageView, type InsertPageView,
  type HiddenNews, type InsertHiddenNews,
  type PinnedNews, type InsertPinnedNews,
  type Exchange, type InsertExchange,
  type ContactMessage, type InsertContactMessage,
  type BlogPost, type InsertBlogPost,
  type SeoMeta, type InsertSeoMeta,
  users, siteSettings, pageViews, hiddenNews, pinnedNews, exchanges,
  contactMessages, blogPosts, seoMeta,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<SiteSetting[]>;

  recordPageView(view: InsertPageView): Promise<void>;
  getPageViewStats(): Promise<{
    total: number;
    today: number;
    byPage: { page: string; count: number }[];
    recentWallets: string[];
    topChains: { chain: string; count: number }[];
  }>;

  hideArticle(article: InsertHiddenNews): Promise<HiddenNews>;
  unhideArticle(articleId: string): Promise<void>;
  getHiddenArticles(): Promise<HiddenNews[]>;
  isArticleHidden(articleId: string): Promise<boolean>;

  pinArticle(article: InsertPinnedNews): Promise<PinnedNews>;
  unpinArticle(articleId: string): Promise<void>;
  getPinnedArticles(): Promise<PinnedNews[]>;

  getExchanges(activeOnly?: boolean): Promise<Exchange[]>;
  getExchange(id: number): Promise<Exchange | undefined>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchange(id: number, exchange: Partial<InsertExchange>): Promise<Exchange | undefined>;
  deleteExchange(id: number): Promise<void>;

  createMessage(msg: InsertContactMessage): Promise<ContactMessage>;
  getMessages(): Promise<ContactMessage[]>;
  getMessage(id: number): Promise<ContactMessage | undefined>;
  markMessageRead(id: number): Promise<void>;
  deleteMessage(id: number): Promise<void>;
  getUnreadCount(): Promise<number>;

  createPost(post: InsertBlogPost): Promise<BlogPost>;
  updatePost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deletePost(id: number): Promise<void>;
  getPost(id: number): Promise<BlogPost | undefined>;
  getPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getPosts(opts?: { published?: boolean; category?: string; featured?: boolean; limit?: number; offset?: number }): Promise<BlogPost[]>;
  getPostCount(opts?: { published?: boolean; category?: string }): Promise<number>;
  incrementPostViews(id: number): Promise<void>;

  getSeoMeta(pagePath: string): Promise<SeoMeta | undefined>;
  setSeoMeta(meta: InsertSeoMeta): Promise<SeoMeta>;
  getAllSeoMeta(): Promise<SeoMeta[]>;
  deleteSeoMeta(pagePath: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async recordPageView(view: InsertPageView): Promise<void> {
    await db.insert(pageViews).values(view);
  }

  async getPageViewStats() {
    const [totalResult] = await db.select({ count: count() }).from(pageViews);
    const total = totalResult?.count || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todayResult] = await db
      .select({ count: count() })
      .from(pageViews)
      .where(sql`${pageViews.createdAt} >= ${todayStart}`);
    const today = todayResult?.count || 0;

    const byPageResult = await db
      .select({ page: pageViews.page, count: count() })
      .from(pageViews)
      .groupBy(pageViews.page)
      .orderBy(desc(count()));
    const byPage = byPageResult.map((r) => ({ page: r.page, count: r.count }));

    const recentWalletsResult = await db
      .select({ walletTracked: pageViews.walletTracked })
      .from(pageViews)
      .where(sql`${pageViews.walletTracked} IS NOT NULL AND ${pageViews.walletTracked} != ''`)
      .orderBy(desc(pageViews.createdAt))
      .limit(20);
    const recentWallets = [...new Set(recentWalletsResult.map((r) => r.walletTracked!))].slice(0, 10);

    const topChainsResult = await db
      .select({ chain: pageViews.chain, count: count() })
      .from(pageViews)
      .where(sql`${pageViews.chain} IS NOT NULL AND ${pageViews.chain} != ''`)
      .groupBy(pageViews.chain)
      .orderBy(desc(count()))
      .limit(10);
    const topChains = topChainsResult.map((r) => ({ chain: r.chain!, count: r.count }));

    return { total, today, byPage, recentWallets, topChains };
  }

  async hideArticle(article: InsertHiddenNews): Promise<HiddenNews> {
    const [hidden] = await db.insert(hiddenNews).values(article).returning();
    return hidden;
  }

  async unhideArticle(articleId: string): Promise<void> {
    await db.delete(hiddenNews).where(eq(hiddenNews.articleId, articleId));
  }

  async getHiddenArticles(): Promise<HiddenNews[]> {
    return db.select().from(hiddenNews).orderBy(desc(hiddenNews.hiddenAt));
  }

  async isArticleHidden(articleId: string): Promise<boolean> {
    const [result] = await db.select().from(hiddenNews).where(eq(hiddenNews.articleId, articleId));
    return !!result;
  }

  async pinArticle(article: InsertPinnedNews): Promise<PinnedNews> {
    const [pinned] = await db.insert(pinnedNews).values(article).returning();
    return pinned;
  }

  async unpinArticle(articleId: string): Promise<void> {
    await db.delete(pinnedNews).where(eq(pinnedNews.articleId, articleId));
  }

  async getPinnedArticles(): Promise<PinnedNews[]> {
    return db.select().from(pinnedNews).orderBy(desc(pinnedNews.pinnedAt));
  }

  async getExchanges(activeOnly = false): Promise<Exchange[]> {
    if (activeOnly) {
      return db.select().from(exchanges).where(eq(exchanges.active, true)).orderBy(exchanges.sortOrder, exchanges.name);
    }
    return db.select().from(exchanges).orderBy(exchanges.sortOrder, exchanges.name);
  }

  async getExchange(id: number): Promise<Exchange | undefined> {
    const [exchange] = await db.select().from(exchanges).where(eq(exchanges.id, id));
    return exchange;
  }

  async createExchange(exchange: InsertExchange): Promise<Exchange> {
    const [created] = await db.insert(exchanges).values(exchange).returning();
    return created;
  }

  async updateExchange(id: number, data: Partial<InsertExchange>): Promise<Exchange | undefined> {
    const [updated] = await db.update(exchanges).set(data).where(eq(exchanges.id, id)).returning();
    return updated;
  }

  async deleteExchange(id: number): Promise<void> {
    await db.delete(exchanges).where(eq(exchanges.id, id));
  }

  async createMessage(msg: InsertContactMessage): Promise<ContactMessage> {
    const [created] = await db.insert(contactMessages).values(msg).returning();
    return created;
  }

  async getMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getMessage(id: number): Promise<ContactMessage | undefined> {
    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return msg;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, id));
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  }

  async getUnreadCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(contactMessages).where(eq(contactMessages.read, false));
    return result?.count || 0;
  }

  async createPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }

  async updatePost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getPosts(opts: { published?: boolean; category?: string; featured?: boolean; limit?: number; offset?: number } = {}): Promise<BlogPost[]> {
    const conditions: any[] = [];
    if (opts.published !== undefined) conditions.push(eq(blogPosts.published, opts.published));
    if (opts.featured !== undefined) conditions.push(eq(blogPosts.featured, opts.featured));
    if (opts.category) conditions.push(eq(blogPosts.category, opts.category));

    let query = db.select().from(blogPosts);
    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    }
    query = query.orderBy(desc(blogPosts.createdAt)) as any;
    if (opts.limit) query = query.limit(opts.limit) as any;
    if (opts.offset) query = query.offset(opts.offset) as any;
    return query;
  }

  async getPostCount(opts: { published?: boolean; category?: string } = {}): Promise<number> {
    const conditions: any[] = [];
    if (opts.published !== undefined) conditions.push(eq(blogPosts.published, opts.published));
    if (opts.category) conditions.push(eq(blogPosts.category, opts.category));

    let query = db.select({ count: count() }).from(blogPosts);
    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    }
    const [result] = await query;
    return result?.count || 0;
  }

  async incrementPostViews(id: number): Promise<void> {
    await db.update(blogPosts).set({ views: sql`${blogPosts.views} + 1` }).where(eq(blogPosts.id, id));
  }

  async getSeoMeta(pagePath: string): Promise<SeoMeta | undefined> {
    const [meta] = await db.select().from(seoMeta).where(eq(seoMeta.pagePath, pagePath));
    return meta;
  }

  async setSeoMeta(meta: InsertSeoMeta): Promise<SeoMeta> {
    const [result] = await db.insert(seoMeta).values(meta)
      .onConflictDoUpdate({ target: seoMeta.pagePath, set: meta })
      .returning();
    return result;
  }

  async getAllSeoMeta(): Promise<SeoMeta[]> {
    return db.select().from(seoMeta);
  }

  async deleteSeoMeta(pagePath: string): Promise<void> {
    await db.delete(seoMeta).where(eq(seoMeta.pagePath, pagePath));
  }
}

export const storage = new DatabaseStorage();
