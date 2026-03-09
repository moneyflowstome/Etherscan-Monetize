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
  type Airdrop, type InsertAirdrop,
  type LoginAttempt, type InsertLoginAttempt,
  type BlockedIp, type InsertBlockedIp,
  type ChatMessage, type InsertChatMessage,
  type SpamReport, type InsertSpamReport,
  users, siteSettings, pageViews, hiddenNews, pinnedNews, exchanges,
  contactMessages, blogPosts, seoMeta, airdrops,
  loginAttempts, blockedIps, chatMessages, spamReports,
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

  getAirdrops(opts?: { status?: string; featured?: boolean; limit?: number; offset?: number }): Promise<Airdrop[]>;
  getAirdrop(id: number): Promise<Airdrop | undefined>;
  getAirdropBySlug(slug: string): Promise<Airdrop | undefined>;
  createAirdrop(airdrop: InsertAirdrop): Promise<Airdrop>;
  updateAirdrop(id: number, data: Partial<InsertAirdrop>): Promise<Airdrop | undefined>;
  deleteAirdrop(id: number): Promise<void>;
  getPendingAirdropCount(): Promise<number>;

  recordLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getRecentFailedAttempts(ip: string, minutes: number): Promise<number>;
  getLoginAttempts(limit?: number): Promise<LoginAttempt[]>;
  blockIp(data: InsertBlockedIp): Promise<BlockedIp>;
  unblockIp(id: number): Promise<void>;
  getBlockedIps(): Promise<BlockedIp[]>;
  isIpBlocked(ip: string): Promise<boolean>;
  cleanExpiredBlocks(): Promise<void>;

  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(opts?: { coinTag?: string; before?: number; limit?: number }): Promise<ChatMessage[]>;
  flagChatMessage(id: number, flagged: boolean): Promise<void>;
  deleteChatMessage(id: number): Promise<void>;
  getFlaggedChatMessages(): Promise<ChatMessage[]>;
  getChatMessageCount(): Promise<number>;

  createSpamReport(report: InsertSpamReport): Promise<SpamReport>;
  getSpamReports(opts?: { resolved?: boolean; limit?: number }): Promise<SpamReport[]>;
  resolveSpamReport(id: number): Promise<void>;
  deleteSpamReport(id: number): Promise<void>;
  getSpamReportsByIp(ip: string): Promise<SpamReport[]>;
  getSpamStats(): Promise<{ total: number; unresolved: number; autoBanned: number; topOffenders: { ip: string; nickname: string; count: number }[] }>;
  bulkResolveSpamReports(ids: number[]): Promise<void>;
  getRecentChatMessagesByIp(ip: string, minutes: number): Promise<ChatMessage[]>;
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

  async getAirdrops(opts: { status?: string; featured?: boolean; limit?: number; offset?: number } = {}): Promise<Airdrop[]> {
    const conditions: any[] = [];
    if (opts.status) conditions.push(eq(airdrops.status, opts.status));
    if (opts.featured !== undefined) conditions.push(eq(airdrops.featured, opts.featured));

    let query = db.select().from(airdrops);
    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    }
    query = query.orderBy(desc(airdrops.createdAt)) as any;
    if (opts.limit) query = query.limit(opts.limit) as any;
    if (opts.offset) query = query.offset(opts.offset) as any;
    return query;
  }

  async getAirdrop(id: number): Promise<Airdrop | undefined> {
    const [airdrop] = await db.select().from(airdrops).where(eq(airdrops.id, id));
    return airdrop;
  }

  async getAirdropBySlug(slug: string): Promise<Airdrop | undefined> {
    const [airdrop] = await db.select().from(airdrops).where(eq(airdrops.slug, slug));
    return airdrop;
  }

  async createAirdrop(airdrop: InsertAirdrop): Promise<Airdrop> {
    const [created] = await db.insert(airdrops).values(airdrop).returning();
    return created;
  }

  async updateAirdrop(id: number, data: Partial<InsertAirdrop>): Promise<Airdrop | undefined> {
    const [updated] = await db.update(airdrops).set(data).where(eq(airdrops.id, id)).returning();
    return updated;
  }

  async deleteAirdrop(id: number): Promise<void> {
    await db.delete(airdrops).where(eq(airdrops.id, id));
  }

  async getPendingAirdropCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(airdrops).where(eq(airdrops.status, "pending"));
    return result?.count || 0;
  }

  async recordLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const [created] = await db.insert(loginAttempts).values(attempt).returning();
    return created;
  }

  async getRecentFailedAttempts(ip: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const [result] = await db
      .select({ count: count() })
      .from(loginAttempts)
      .where(sql`${loginAttempts.ip} = ${ip} AND ${loginAttempts.success} = false AND ${loginAttempts.attemptedAt} >= ${since}`);
    return result?.count || 0;
  }

  async getLoginAttempts(limit = 100): Promise<LoginAttempt[]> {
    return db.select().from(loginAttempts).orderBy(desc(loginAttempts.attemptedAt)).limit(limit);
  }

  async blockIp(data: InsertBlockedIp): Promise<BlockedIp> {
    const [created] = await db.insert(blockedIps).values(data).returning();
    return created;
  }

  async unblockIp(id: number): Promise<void> {
    await db.delete(blockedIps).where(eq(blockedIps.id, id));
  }

  async getBlockedIps(): Promise<BlockedIp[]> {
    return db.select().from(blockedIps).orderBy(desc(blockedIps.blockedAt));
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(blockedIps)
      .where(sql`${blockedIps.ip} = ${ip} AND (${blockedIps.expiresAt} IS NULL OR ${blockedIps.expiresAt} > NOW())`);
    return !!result;
  }

  async cleanExpiredBlocks(): Promise<void> {
    await db.delete(blockedIps).where(sql`${blockedIps.expiresAt} IS NOT NULL AND ${blockedIps.expiresAt} <= NOW()`);
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(msg).returning();
    return created;
  }

  async getChatMessages(opts: { coinTag?: string; before?: number; limit?: number } = {}): Promise<ChatMessage[]> {
    const conditions: any[] = [sql`${chatMessages.flagged} = false`];
    if (opts.coinTag) conditions.push(sql`${chatMessages.coinTag} = ${opts.coinTag}`);
    if (opts.before) conditions.push(sql`${chatMessages.id} < ${opts.before}`);

    let query = db.select({
      id: chatMessages.id,
      nickname: chatMessages.nickname,
      message: chatMessages.message,
      coinTag: chatMessages.coinTag,
      ip: sql<string | null>`NULL`.as("ip"),
      flagged: chatMessages.flagged,
      createdAt: chatMessages.createdAt,
    }).from(chatMessages);
    query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    query = query.orderBy(desc(chatMessages.createdAt)) as any;
    query = query.limit(opts.limit || 50) as any;
    return query;
  }

  async flagChatMessage(id: number, flagged: boolean): Promise<void> {
    await db.update(chatMessages).set({ flagged }).where(eq(chatMessages.id, id));
  }

  async deleteChatMessage(id: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
  }

  async getFlaggedChatMessages(): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.flagged, true)).orderBy(desc(chatMessages.createdAt));
  }

  async getChatMessageCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(chatMessages);
    return result?.count || 0;
  }

  async createSpamReport(report: InsertSpamReport): Promise<SpamReport> {
    const [created] = await db.insert(spamReports).values(report).returning();
    return created;
  }

  async getSpamReports(opts?: { resolved?: boolean; limit?: number }): Promise<SpamReport[]> {
    const conditions: any[] = [];
    if (opts?.resolved !== undefined) {
      conditions.push(eq(spamReports.resolved, opts.resolved));
    }
    let query = db.select().from(spamReports);
    if (conditions.length > 0) {
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
    }
    query = query.orderBy(desc(spamReports.createdAt)) as any;
    query = query.limit(opts?.limit || 200) as any;
    return query;
  }

  async resolveSpamReport(id: number): Promise<void> {
    await db.update(spamReports).set({ resolved: true }).where(eq(spamReports.id, id));
  }

  async deleteSpamReport(id: number): Promise<void> {
    await db.delete(spamReports).where(eq(spamReports.id, id));
  }

  async getSpamReportsByIp(ip: string): Promise<SpamReport[]> {
    return db.select().from(spamReports).where(eq(spamReports.ip, ip)).orderBy(desc(spamReports.createdAt));
  }

  async getSpamStats(): Promise<{ total: number; unresolved: number; autoBanned: number; topOffenders: { ip: string; nickname: string; count: number }[] }> {
    const [totalResult] = await db.select({ count: count() }).from(spamReports);
    const [unresolvedResult] = await db.select({ count: count() }).from(spamReports).where(eq(spamReports.resolved, false));
    const [autoBannedResult] = await db.select({ count: count() }).from(spamReports).where(eq(spamReports.autoBanned, true));
    const topOffenders = await db.select({
      ip: spamReports.ip,
      nickname: sql<string>`MAX(${spamReports.nickname})`.as("nickname"),
      count: count(),
    }).from(spamReports).groupBy(spamReports.ip).orderBy(desc(count())).limit(10);
    return {
      total: totalResult?.count || 0,
      unresolved: unresolvedResult?.count || 0,
      autoBanned: autoBannedResult?.count || 0,
      topOffenders: topOffenders.map(o => ({ ip: o.ip, nickname: o.nickname, count: Number(o.count) })),
    };
  }

  async bulkResolveSpamReports(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await db.update(spamReports).set({ resolved: true }).where(sql`${spamReports.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  }

  async getRecentChatMessagesByIp(ip: string, minutes: number): Promise<ChatMessage[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return db.select().from(chatMessages).where(sql`${chatMessages.ip} = ${ip} AND ${chatMessages.createdAt} > ${cutoff}`).orderBy(desc(chatMessages.createdAt));
  }
}

export const storage = new DatabaseStorage();
