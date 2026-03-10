const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const tables = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  wallet_tracked TEXT,
  chain TEXT,
  user_agent TEXT,
  referer TEXT,
  ip TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS hidden_news (
  id SERIAL PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reason TEXT,
  hidden_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pinned_news (
  id SERIAL PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  pinned_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS exchanges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  url TEXT NOT NULL,
  affiliate_url TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'centralized',
  country TEXT,
  year INTEGER,
  trading_pairs INTEGER,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT DEFAULT 'Admin',
  category TEXT,
  tags TEXT[],
  cover_image TEXT,
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_meta (
  id SERIAL PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical TEXT
);

CREATE TABLE IF NOT EXISTS airdrops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  website TEXT,
  description TEXT,
  token_symbol TEXT,
  reward_type TEXT NOT NULL DEFAULT 'Task',
  reward_amount TEXT,
  referral_reward TEXT,
  blockchain TEXT NOT NULL DEFAULT 'Ethereum',
  start_date TEXT,
  end_date TEXT,
  steps TEXT[],
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  featured BOOLEAN DEFAULT FALSE,
  submitter_email TEXT,
  submitter_name TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Too many failed login attempts',
  blocked_by TEXT NOT NULL DEFAULT 'auto',
  blocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  coin_tag TEXT,
  ip TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS spam_reports (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  nickname TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  message_id INTEGER,
  message_text TEXT,
  auto_banned BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  size TEXT NOT NULL,
  zone TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS banner_inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  banner_size TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

async function migrate() {
  try {
    await pool.query(tables);
    console.log("All tables created successfully.");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();
