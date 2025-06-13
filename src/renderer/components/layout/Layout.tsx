import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../stores/appStore';

// Placeholder components for routes
const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">ダッシュボード</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-2">テーマ管理</h3>
          <p className="text-gray-600">情報収集テーマの作成・管理</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-2">記事収集</h3>
          <p className="text-gray-600">最新記事の自動収集</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-2">下書き管理</h3>
          <p className="text-gray-600">投稿の下書き作成・編集</p>
        </div>
      </div>
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
    <div className="card">
      <div className="card-body">
        <p className="text-gray-600">{title} ページは開発中です。</p>
      </div>
    </div>
  </div>
);

export const Layout: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/themes" element={<PlaceholderPage title="テーマ管理" />} />
            <Route path="/articles" element={<PlaceholderPage title="記事収集" />} />
            <Route path="/samples" element={<PlaceholderPage title="サンプル生成" />} />
            <Route path="/drafts" element={<PlaceholderPage title="下書き管理" />} />
            <Route path="/templates" element={<PlaceholderPage title="テンプレート" />} />
            <Route path="/calendar" element={<PlaceholderPage title="カレンダー" />} />
            <Route path="/analytics" element={<PlaceholderPage title="分析" />} />
            <Route path="/settings" element={<PlaceholderPage title="設定" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
