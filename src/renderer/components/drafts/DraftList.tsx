import React, { useState, useEffect } from 'react';
import { useDraftStore, Draft } from '../../stores/draftStore';
import { DraftCard } from './DraftCard';
import { DraftForm } from './DraftForm';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ConfirmModal } from '../ui/Modal';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

export const DraftList: React.FC = () => {
  const {
    drafts,
    isLoading,
    error,
    searchQuery,
    categoryFilter,
    sortBy,
    loadDrafts,
    deleteDraft,
    duplicateDraft,
    searchDrafts,
    filterByCategory,
    setSortBy,
    clearError,
    getFilteredDrafts,
    getCategories,
  } = useDraftStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    draft: Draft | null;
  }>({ isOpen: false, draft: null });

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const filteredDrafts = getFilteredDrafts();
  const categories = getCategories();

  const handleCreateDraft = () => {
    setEditingDraft(null);
    setIsFormOpen(true);
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDraft(null);
  };

  const handleDeleteDraft = (draft: Draft) => {
    setDeleteConfirm({ isOpen: true, draft });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.draft) {
      const success = await deleteDraft(deleteConfirm.draft.id);
      if (success) {
        setDeleteConfirm({ isOpen: false, draft: null });
      }
    }
  };

  const handleDuplicateDraft = async (id: number) => {
    await duplicateDraft(id);
  };

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'oldest', label: '古い順' },
    { value: 'title', label: 'タイトル順' },
    { value: 'category', label: 'カテゴリ順' },
  ];

  const categoryOptions = [
    { value: '', label: 'すべてのカテゴリ' },
    ...categories.map(cat => ({ value: cat, label: cat })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">下書き管理</h1>
          <p className="text-gray-600 mt-1">
            投稿の下書きを作成・編集・管理できます
          </p>
        </div>
        <Button
          onClick={handleCreateDraft}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新しい下書き
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="下書きを検索..."
                value={searchQuery}
                onChange={(e) => searchDrafts(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={categoryFilter}
              onChange={(e) => filterByCategory(e.target.value)}
              options={categoryOptions}
              icon={<FunnelIcon className="h-4 w-4" />}
            />
          </div>

          {/* Sort */}
          <div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={sortOptions}
              icon={<ArrowsUpDownIcon className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{drafts.length}</div>
          <div className="text-sm text-gray-600">総下書き数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {drafts.filter(d => d.isTemplate).length}
          </div>
          <div className="text-sm text-gray-600">テンプレート数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {drafts.filter(d => d.scheduledDate).length}
          </div>
          <div className="text-sm text-gray-600">予約投稿数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
          <div className="text-sm text-gray-600">カテゴリ数</div>
        </div>
      </div>

      {/* Draft List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      ) : filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onEdit={handleEditDraft}
              onDelete={handleDeleteDraft}
              onDuplicate={handleDuplicateDraft}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            {searchQuery || categoryFilter
              ? '検索条件に一致する下書きが見つかりません'
              : '下書きがまだありません'}
          </div>
          <div className="text-gray-400 text-sm mb-4">
            {searchQuery || categoryFilter
              ? '検索条件を変更して再度お試しください'
              : '最初の下書きを作成してみましょう'}
          </div>
          {!searchQuery && !categoryFilter && (
            <Button onClick={handleCreateDraft}>
              <PlusIcon className="h-5 w-5 mr-2" />
              下書きを作成
            </Button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <DraftForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        draft={editingDraft}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, draft: null })}
        onConfirm={confirmDelete}
        title="下書きを削除"
        message={
          deleteConfirm.draft
            ? `「${deleteConfirm.draft.title || '無題の下書き'}」を削除しますか？この操作は取り消せません。`
            : ''
        }
        confirmText="削除"
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </div>
  );
};
