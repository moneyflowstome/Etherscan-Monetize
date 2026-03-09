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
  users, siteSettings, pageViews, hiddenNews, pinnedNews, exchanges,
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
}

export const storage = new DatabaseStorage();
