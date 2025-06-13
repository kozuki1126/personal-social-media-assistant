import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input, Modal, ConfirmModal } from '../ui';
import { ThemeCard } from './ThemeCard';
import { ThemeForm } from './ThemeForm';

export const ThemeList: React.FC = () => {
  const {
    themes,
    filteredThemes,
    isLoading,
    error,
    searchQuery,
    loadThemes,
    setSearchQuery,
    deleteTheme,
    clearError,
  } = useThemeStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadThemes(includeInactive);
  }, [loadThemes, includeInactive]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    setEditingTheme(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await deleteTheme(deleteConfirm.id, true); // Soft delete
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={clearError}>
              閉じる
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">テーマ管理</h1>
          <p className="text-gray-600 mt-1">
            情報収集のテーマを作成・管理します
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          新しいテーマを作成
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="テーマを検索..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">非アクティブも表示</span>
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">読み込み中...</span>
          </div>
        </div>
      ) : filteredThemes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">テーマがありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? '検索条件に一致するテーマがありません。' : '最初のテーマを作成しましょう。'}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                新しいテーマを作成
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onEdit={() => setEditingTheme(theme)}
              onDelete={() => setDeleteConfirm({ id: theme.id, name: theme.name })}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新しいテーマを作成"
        size="lg"
      >
        <ThemeForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTheme}
        onClose={() => setEditingTheme(null)}
        title="テーマを編集"
        size="lg"
      >
        {editingTheme && (
          <ThemeForm
            theme={editingTheme}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingTheme(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="テーマを削除"
        message={`「${deleteConfirm?.name}」を削除してもよろしいですか？関連する記事も一緒に削除されます。`}
        confirmText="削除"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
