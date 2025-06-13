# Personal Social Media Assistant 技術設計書 v1.0

## 1. システム構成

### 1.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Personal Social Media Assistant                │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│ │   Frontend      │    │   Backend       │    │  Local Storage  │ │
│ │   (Electron)    │◄──►│   (Node.js)     │◄──►│   (SQLite)      │ │
│ │                 │    │                 │    │                 │ │
│ │ - React         │    │ - Express       │    │ - User Data     │ │
│ │ - TypeScript    │    │ - Prisma ORM    │    │ - Settings      │ │
│ │ - Tailwind CSS  │    │ - Axios         │    │ - Cache         │ │
│ │ - Zustand       │    │ - Cron Jobs     │    │                 │ │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│          │                       │                       │         │
│          └───────────────────────┼───────────────────────┘         │
│                                  │                                 │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │                    External APIs                                │ │
│ │                                                                 │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │ │
│ │ │ News API    │ │ OpenAI API  │ │ X API       │ │ RSS Feeds   │ │ │
│ │ │ (Articles)  │ │ (AI Text)   │ │ (Analytics) │ │ (Content)   │ │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │ │
│ └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 技術スタック

#### フロントエンド
- **Electron**: デスクトップアプリケーション
- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Zustand**: 状態管理
- **React Router**: ルーティング
- **React Hook Form**: フォーム管理

#### バックエンド
- **Node.js**: サーバーサイド実行環境
- **Express**: Webアプリケーションフレームワーク
- **Prisma**: ORM
- **SQLite**: ローカルデータベース
- **Axios**: HTTP クライアント
- **node-cron**: スケジューリング
- **crypto-js**: 暗号化

#### 外部API
- **News API**: ニュース記事取得
- **OpenAI API**: AI文章生成
- **X API v2**: 投稿分析（読み取り専用）
- **RSS Parser**: RSS フィード解析

## 2. データベース設計

### 2.1 テーブル設計

```sql
-- テーマ管理テーブル
CREATE TABLE themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    keywords TEXT, -- JSON配列として保存
    update_frequency TEXT CHECK(update_frequency IN ('daily', 'weekly')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 収集記事テーブル
CREATE TABLE collected_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    source_url TEXT,
    source_name TEXT,
    published_at DATETIME,
    relevance_score REAL DEFAULT 0.0,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- 生成サンプルテーブル
CREATE TABLE generated_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    content TEXT NOT NULL,
    tone TEXT CHECK(tone IN ('casual', 'formal', 'explanatory')),
    character_count INTEGER,
    hashtags TEXT, -- JSON配列として保存
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES collected_articles(id) ON DELETE CASCADE
);

-- 下書きテーブル
CREATE TABLE drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT NOT NULL,
    hashtags TEXT, -- JSON配列として保存
    media_urls TEXT, -- JSON配列として保存
    category TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    reminder_minutes INTEGER DEFAULT 10,
    is_template BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テンプレートテーブル
CREATE TABLE templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT,
    hashtags TEXT, -- JSON配列として保存
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 投稿履歴テーブル
CREATE TABLE post_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    hashtags TEXT, -- JSON配列として保存
    media_urls TEXT, -- JSON配列として保存
    posted_at DATETIME NOT NULL,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    impressions_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 設定テーブル
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ハッシュタグ履歴テーブル
CREATE TABLE hashtag_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashtag TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_collected_articles_theme_id ON collected_articles(theme_id);
CREATE INDEX idx_collected_articles_published_at ON collected_articles(published_at);
CREATE INDEX idx_generated_samples_article_id ON generated_samples(article_id);
CREATE INDEX idx_drafts_scheduled_date ON drafts(scheduled_date);
CREATE INDEX idx_post_history_posted_at ON post_history(posted_at);
CREATE INDEX idx_hashtag_history_hashtag ON hashtag_history(hashtag);
```

### 2.2 Prisma スキーマ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Theme {
  id               Int               @id @default(autoincrement())
  name             String            @unique
  description      String?
  keywords         String? // JSON
  updateFrequency  String? // "daily" | "weekly"
  isActive         Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  collectedArticles CollectedArticle[]

  @@map("themes")
}

model CollectedArticle {
  id              Int               @id @default(autoincrement())
  themeId         Int
  title           String
  content         String?
  summary         String?
  sourceUrl       String?
  sourceName      String?
  publishedAt     DateTime?
  relevanceScore  Float             @default(0.0)
  isProcessed     Boolean           @default(false)
  createdAt       DateTime          @default(now())
  theme           Theme             @relation(fields: [themeId], references: [id], onDelete: Cascade)
  generatedSamples GeneratedSample[]

  @@map("collected_articles")
}

model GeneratedSample {
  id             Int              @id @default(autoincrement())
  articleId      Int
  content        String
  tone           String // "casual" | "formal" | "explanatory"
  characterCount Int
  hashtags       String? // JSON
  isFavorite     Boolean          @default(false)
  createdAt      DateTime         @default(now())
  article        CollectedArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@map("generated_samples")
}

model Draft {
  id             Int      @id @default(autoincrement())
  title          String?
  content        String
  hashtags       String? // JSON
  mediaUrls      String? // JSON
  category       String?
  scheduledDate  String? // DATE
  scheduledTime  String? // TIME
  reminderMinutes Int     @default(10)
  isTemplate     Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("drafts")
}

model Template {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  content    String
  category   String?
  hashtags   String? // JSON
  usageCount Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("templates")
}

model PostHistory {
  id               Int      @id @default(autoincrement())
  content          String
  hashtags         String? // JSON
  mediaUrls        String? // JSON
  postedAt         DateTime
  likesCount       Int      @default(0)
  retweetsCount    Int      @default(0)
  repliesCount     Int      @default(0)
  impressionsCount Int      @default(0)
  lastUpdated      DateTime @default(now())
  createdAt        DateTime @default(now())

  @@map("post_history")
}

model Setting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String?
  isEncrypted Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("settings")
}

model HashtagHistory {
  id         Int      @id @default(autoincrement())
  hashtag    String
  usageCount Int      @default(1)
  lastUsed   DateTime @default(now())
  createdAt  DateTime @default(now())

  @@map("hashtag_history")
}
```

## 3. API設計

### 3.1 内部API エンドポイント

#### テーマ管理
```typescript
// GET /api/themes - テーマ一覧取得
// POST /api/themes - テーマ作成
// PUT /api/themes/:id - テーマ更新
// DELETE /api/themes/:id - テーマ削除

interface Theme {
  id: number;
  name: string;
  description?: string;
  keywords: string[];
  updateFrequency: 'daily' | 'weekly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### 情報収集
```typescript
// POST /api/collect-articles - 記事収集実行
// GET /api/articles/:themeId - テーマ別記事取得
// GET /api/articles/:id - 記事詳細取得

interface CollectedArticle {
  id: number;
  themeId: number;
  title: string;
  content?: string;
  summary?: string;
  sourceUrl?: string;
  sourceName?: string;
  publishedAt?: string;
  relevanceScore: number;
  isProcessed: boolean;
  createdAt: string;
}
```

#### サンプル生成
```typescript
// POST /api/generate-sample - サンプル生成
// GET /api/samples/:articleId - 記事別サンプル取得
// PUT /api/samples/:id/favorite - お気に入り設定

interface GenerateSampleRequest {
  articleId: number;
  tone: 'casual' | 'formal' | 'explanatory';
  maxLength?: number;
}

interface GeneratedSample {
  id: number;
  articleId: number;
  content: string;
  tone: string;
  characterCount: number;
  hashtags: string[];
  isFavorite: boolean;
  createdAt: string;
}
```

#### 下書き管理
```typescript
// GET /api/drafts - 下書き一覧取得
// POST /api/drafts - 下書き作成
// PUT /api/drafts/:id - 下書き更新
// DELETE /api/drafts/:id - 下書き削除

interface Draft {
  id: number;
  title?: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  category?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  reminderMinutes: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### 分析機能
```typescript
// GET /api/analytics/performance - パフォーマンス分析
// GET /api/analytics/reports - レポート取得
// POST /api/analytics/sync - X APIからデータ同期

interface PerformanceData {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  averageEngagement: number;
  topPerformingPosts: PostHistory[];
  engagementTrend: EngagementPoint[];
}

interface EngagementPoint {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
}
```

### 3.2 外部API連携

#### News API
```typescript
class NewsAPIClient {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  async searchArticles(query: string, language = 'ja'): Promise<Article[]> {
    const response = await axios.get(`${this.baseUrl}/everything`, {
      params: {
        q: query,
        language,
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: this.apiKey
      }
    });
    return response.data.articles;
  }
}
```

#### OpenAI API
```typescript
class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  async generateSample(
    content: string, 
    tone: 'casual' | 'formal' | 'explanatory'
  ): Promise<string> {
    const prompt = this.createPrompt(content, tone);
    
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  }

  private createPrompt(content: string, tone: string): string {
    const toneMap = {
      casual: 'カジュアルで親しみやすい',
      formal: 'フォーマルで丁寧な',
      explanatory: '分かりやすく説明する'
    };
    
    return `以下の記事を参考に、${toneMap[tone]}トーンで280文字以内のTwitter投稿を作成してください：\n\n${content}`;
  }
}
```

#### X API (分析用)
```typescript
class XAPIClient {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  async getUserTweets(userId: string): Promise<Tweet[]> {
    const response = await axios.get(
      `${this.baseUrl}/users/${userId}/tweets`,
      {
        params: {
          'tweet.fields': 'created_at,public_metrics,context_annotations',
          max_results: 100
        },
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        }
      }
    );
    return response.data.data;
  }
}
```

## 4. セキュリティ設計

### 4.1 API キー管理

```typescript
import CryptoJS from 'crypto-js';

class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'user-device-specific-key';

  static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
  }

  static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static async storeAPIKey(service: string, apiKey: string): Promise<void> {
    const encrypted = this.encrypt(apiKey);
    await SettingsService.set(`${service}_api_key`, encrypted, true);
  }

  static async getAPIKey(service: string): Promise<string | null> {
    const encrypted = await SettingsService.get(`${service}_api_key`);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }
}
```

### 4.2 データ保護

```typescript
class DataProtection {
  // ローカルデータベースの暗号化
  static async encryptDatabase(): Promise<void> {
    // SQLite データベースファイルの暗号化
    // 実装は使用するライブラリに依存
  }

  // 機密データのマスキング
  static maskSensitiveData(data: any): any {
    const sensitiveFields = ['apiKey', 'token', 'password'];
    const masked = { ...data };
    
    sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***masked***';
      }
    });
    
    return masked;
  }

  // ログの安全な出力
  static safeLog(message: string, data?: any): void {
    const safeData = data ? this.maskSensitiveData(data) : undefined;
    console.log(message, safeData);
  }
}
```

## 5. パフォーマンス最適化

### 5.1 データベース最適化

```typescript
class DatabaseOptimization {
  // インデックス最適化
  static async createOptimalIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_articles_theme_published ON collected_articles(theme_id, published_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_samples_article_created ON generated_samples(article_id, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_drafts_scheduled ON drafts(scheduled_date, scheduled_time)',
      'CREATE INDEX IF NOT EXISTS idx_posts_performance ON post_history(posted_at, likes_count, retweets_count)'
    ];
    
    for (const index of indexes) {
      await prisma.$executeRawUnsafe(index);
    }
  }

  // バッチ処理最適化
  static async batchInsertArticles(articles: CollectedArticle[]): Promise<void> {
    const batchSize = 100;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      await prisma.collectedArticle.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
  }
}
```

### 5.2 キャッシュ戦略

```typescript
class CacheManager {
  private static cache = new Map<string, { data: any; expiry: number }>();

  static set(key: string, data: any, ttlMinutes: number = 30): void {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, { data, expiry });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  static async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlMinutes: number = 30
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    const data = await fetchFunction();
    this.set(key, data, ttlMinutes);
    return data;
  }
}
```

## 6. エラーハンドリング

### 6.1 グローバルエラーハンドリング

```typescript
class ErrorHandler {
  static handle(error: Error, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // ログ出力
    DataProtection.safeLog('Error occurred:', errorInfo);

    // ユーザーへの通知
    if (context) {
      NotificationService.error(`エラーが発生しました: ${context}`);
    }

    // 必要に応じて復旧処理
    this.attemptRecovery(error, context);
  }

  private static attemptRecovery(error: Error, context?: string): void {
    // API エラーの場合のリトライ処理
    if (error.message.includes('API') && context) {
      setTimeout(() => {
        // リトライ処理
      }, 5000);
    }
  }
}
```

### 6.2 API エラーハンドリング

```typescript
class APIErrorHandler {
  static async handleAPIError(error: any, apiName: string): Promise<void> {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          NotificationService.error(`${apiName} の認証に失敗しました。APIキーを確認してください。`);
          break;
        case 429:
          NotificationService.warning(`${apiName} のレート制限に達しました。しばらく待ってから再試行してください。`);
          break;
        case 500:
          NotificationService.error(`${apiName} でサーバーエラーが発生しました。`);
          break;
        default:
          NotificationService.error(`${apiName} でエラーが発生しました: ${data?.message || 'Unknown error'}`);
      }
    } else {
      NotificationService.error(`${apiName} への接続に失敗しました。インターネット接続を確認してください。`);
    }
  }
}
```

## 7. デプロイメント設計

### 7.1 Electron アプリケーション構成

```typescript
// main.ts (Electron メインプロセス)
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupAutoUpdater();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile('dist/index.html');
    }
  }

  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();
  }

  private setupIPC(): void {
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('show-notification', (event, message) => {
      // システム通知の表示
    });
  }
}

new ElectronApp();
```

### 7.2 ビルド設定

```json
// package.json
{
  "name": "personal-social-media-assistant",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:electron\" \"npm run dev:react\"",
    "dev:electron": "nodemon --exec electron dist/main.js",
    "dev:react": "vite",
    "build": "npm run build:react && npm run build:electron",
    "build:react": "vite build",
    "build:electron": "tsc -p tsconfig.electron.json",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:all": "electron-builder -mwl"
  },
  "build": {
    "appId": "com.yourcompany.psa",
    "productName": "Personal Social Media Assistant",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

---

本技術設計書は、Personal Social Media Assistant の実装に必要な技術的詳細を定義しています。合法的で安全なSNS支援ツールとして、ユーザーのプライバシーとセキュリティを最優先に設計されています。
