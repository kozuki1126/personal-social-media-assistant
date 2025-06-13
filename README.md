# Personal Social Media Assistant (PSA)

個人のSNS運用を効率化する、合法的で安全なデスクトップアプリケーション

## 🎯 プロジェクト概要

Personal Social Media Assistant は、X（旧Twitter）の利用規約に完全準拠した個人向けSNS運用支援ツールです。自動投稿ではなく、手動投稿を前提とした支援機能を提供し、質の高いコンテンツ作成をサポートします。

## ✨ 主な機能

### 🔍 情報収集・記事サンプル生成
- テーマ別の情報収集（RSS、News API等）
- AI による投稿サンプル生成（OpenAI API使用）
- 複数のトーン（カジュアル/フォーマル/解説調）に対応
- 情報ソースの適切な引用

### ✍️ コンテンツ作成支援
- 下書き管理とテンプレート機能
- リアルタイム文字数カウンター
- ハッシュタグ提案（手動選択）
- 画像の自動リサイズ・最適化

### 📅 投稿計画支援
- カレンダー表示での投稿計画
- リマインダー通知（手動投稿用）
- 投稿予定の視覚的管理

### 📊 分析機能
- 投稿パフォーマンス分析
- エンゲージメント推移グラフ
- 週次・月次レポート

## 🔒 セキュリティ・プライバシー

- **完全ローカル処理**: 個人データはすべてローカルに保存
- **API キー暗号化**: ユーザーのAPIキーを安全に管理
- **利用規約準拠**: X（Twitter）の利用規約に完全準拠
- **手動操作前提**: 自動投稿機能は提供しません

## 🛠️ 技術スタック

### フロントエンド
- **Electron**: デスクトップアプリケーション
- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Zustand**: 状態管理

### バックエンド
- **Node.js**: サーバーサイド実行環境
- **Express**: Webアプリケーションフレームワーク
- **Prisma**: ORM
- **SQLite**: ローカルデータベース

### 外部API連携
- **News API**: ニュース記事取得
- **OpenAI API**: AI文章生成
- **X API v2**: 投稿分析（読み取り専用）

## 📋 開発計画

### Phase 1: コア機能開発（2ヶ月）
- [ ] 基本UI作成
- [ ] 下書き管理機能
- [ ] テンプレート機能
- [ ] ローカルデータベース構築

### Phase 2: 情報収集機能（1.5ヶ月）
- [ ] 外部API連携
- [ ] 情報収集機能
- [ ] 記事サンプル生成機能
- [ ] フィルタリング機能

### Phase 3: 分析・その他機能（1ヶ月）
- [ ] 投稿分析機能
- [ ] カレンダー機能
- [ ] リマインダー機能
- [ ] レポート機能

### Phase 4: 最適化・テスト（0.5ヶ月）
- [ ] パフォーマンス最適化
- [ ] セキュリティテスト
- [ ] ユーザビリティテスト

## 📚 ドキュメント

- [要件定義書](./docs/requirements.md)
- [技術設計書](./docs/technical-design.md)

## 🚀 開発開始準備

### 必要な環境
- Node.js 18.0 以上
- npm または yarn
- Git

### セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/kozuki1126/personal-social-media-assistant.git
cd personal-social-media-assistant

# 依存関係のインストール
npm install

# 開発環境の起動
npm run dev
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 サポート

質問や提案がございましたら、[Issue](https://github.com/kozuki1126/personal-social-media-assistant/issues) を作成してください。

---

**注意**: このツールは手動操作を前提とした支援ツールです。X（Twitter）の利用規約を遵守し、スパム行為は行わないでください。
