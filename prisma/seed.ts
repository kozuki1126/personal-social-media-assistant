import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create sample themes
  const themes = await Promise.all([
    prisma.theme.create({
      data: {
        name: 'テクノロジー',
        description: 'AI、プログラミング、最新技術に関するトピック',
        keywords: JSON.stringify(['AI', 'プログラミング', '技術', 'エンジニア', 'DX']),
        updateFrequency: 'daily',
        isActive: true,
      },
    }),
    prisma.theme.create({
      data: {
        name: 'ビジネス',
        description: 'スタートアップ、経営、マーケティングに関するトピック',
        keywords: JSON.stringify(['スタートアップ', '経営', 'マーケティング', 'ビジネス', '起業']),
        updateFrequency: 'daily',
        isActive: true,
      },
    }),
    prisma.theme.create({
      data: {
        name: 'ライフスタイル',
        description: '健康、ライフハック、自己啓発に関するトピック',
        keywords: JSON.stringify(['健康', 'ライフハック', '自己啓発', 'ウェルネス', '生活']),
        updateFrequency: 'weekly',
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${themes.length} themes`);

  // Create sample templates
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: '記事シェア用テンプレート',
        content: '今日読んだ記事がとても興味深かったです！\n\n{記事の要約}\n\n詳細はこちら: {URL}',
        category: 'シェア',
        hashtags: JSON.stringify(['#読書', '#学び', '#シェア']),
        usageCount: 0,
      },
    }),
    prisma.template.create({
      data: {
        name: '質問投稿用テンプレート',
        content: '{質問内容}\n\n皆さんはどう思いますか？\n経験やご意見をお聞かせください！',
        category: '質問',
        hashtags: JSON.stringify(['#質問', '#意見交換', '#ディスカッション']),
        usageCount: 0,
      },
    }),
    prisma.template.create({
      data: {
        name: 'プロジェクト進捗報告',
        content: '今週の開発進捗です：\n\n✅ {完了項目1}\n✅ {完了項目2}\n🔄 {進行中項目}\n\n来週は{来週の予定}に取り組みます！',
        category: '進捗',
        hashtags: JSON.stringify(['#開発', '#進捗', '#プロジェクト']),
        usageCount: 0,
      },
    }),
  ]);

  console.log(`Created ${templates.length} templates`);

  // Create sample drafts
  const drafts = await Promise.all([
    prisma.draft.create({
      data: {
        title: 'AI技術の最新動向について',
        content: '最近のAI技術の発展は目覚ましく、特に生成AIの分野では日々新しい発見があります。\n\n#AI #技術 #イノベーション',
        hashtags: JSON.stringify(['#AI', '#技術', '#イノベーション']),
        mediaUrls: JSON.stringify([]),
        category: 'テクノロジー',
        reminderMinutes: 10,
        isTemplate: false,
      },
    }),
    prisma.draft.create({
      data: {
        title: '今日の学び',
        content: 'TypeScriptの型システムについて深く学びました。\n静的型付けの恩恵を改めて実感しています。\n\n#TypeScript #プログラミング #学習',
        hashtags: JSON.stringify(['#TypeScript', '#プログラミング', '#学習']),
        mediaUrls: JSON.stringify([]),
        category: 'プログラミング',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        scheduledTime: '10:00',
        reminderMinutes: 10,
        isTemplate: false,
      },
    }),
  ]);

  console.log(`Created ${drafts.length} drafts`);

  // Create sample settings
  const settings = await Promise.all([
    prisma.setting.create({
      data: {
        key: 'app_initialized',
        value: 'true',
        isEncrypted: false,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'theme',
        value: 'auto',
        isEncrypted: false,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'sidebar_collapsed',
        value: 'false',
        isEncrypted: false,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'default_tone',
        value: 'casual',
        isEncrypted: false,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'max_character_count',
        value: '280',
        isEncrypted: false,
      },
    }),
  ]);

  console.log(`Created ${settings.length} settings`);

  // Create sample hashtag history
  const hashtagHistory = await Promise.all([
    prisma.hashtagHistory.create({
      data: {
        hashtag: '#AI',
        usageCount: 5,
        lastUsed: new Date(),
      },
    }),
    prisma.hashtagHistory.create({
      data: {
        hashtag: '#プログラミング',
        usageCount: 8,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    }),
    prisma.hashtagHistory.create({
      data: {
        hashtag: '#技術',
        usageCount: 3,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    }),
    prisma.hashtagHistory.create({
      data: {
        hashtag: '#学習',
        usageCount: 7,
        lastUsed: new Date(),
      },
    }),
    prisma.hashtagHistory.create({
      data: {
        hashtag: '#開発',
        usageCount: 4,
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    }),
  ]);

  console.log(`Created ${hashtagHistory.length} hashtag history entries`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
