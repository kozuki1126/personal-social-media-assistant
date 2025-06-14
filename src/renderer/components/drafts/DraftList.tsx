import React, { useState, useEffect } from 'react';
import { Draft, useDraftStore } from '../../stores/draftStore';
import { DraftCard } from './DraftCard';
import { DraftForm } from './DraftForm';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { ConfirmModal } from '../ui/Modal';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  DocumentTextIcon
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
  const [deletingDraftId, setDeletingDraftId] = useState<number | null>(null);

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleCreateDraft = () => {
    setEditingDraft(null);
    setIsFormOpen(true);
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setIsFormOpen(true);
  };

  const handleDeleteDraft = (id: number) => {
    setDeletingDraftId(id);
  };

  const confirmDelete = async () => {
    if (deletingDraftId) {
      await deleteDraft(deletingDraftId);
      setDeletingDraftId(null);
    }
  };

  const handleDuplicateDraft = async (id: number) => {
    await duplicateDraft(id);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDraft(null);
  };

  const filteredDrafts = getFilteredDrafts();
  const categories = getCategories();

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

  const getDraftStats = () => {
    const total = drafts.length;
    const templates = drafts.filter(d => d.isTemplate).length;
    const scheduled = drafts.filter(d => d.scheduledDate && d.scheduledTime).length;
    return { total, templates, scheduled };
  };

  const stats = getDraftStats();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">エラーが発生しました</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={loadDrafts} variant="outline">
              再試行
            </Button>
            <Button onClick={clearError} variant="ghost">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">下書き管理</h1>
          <p className="text-gray-600 mt-1">投稿の下書きを作成・管理します</p>
        </div>
        <Button onClick={handleCreateDraft} className="flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>新しい下書き</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">総下書き数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">テンプレート</p>
              <p className="text-2xl font-bold text-gray-900">{stats.templates}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">予約投稿</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">表示中</p>
              <p className="text-2xl font-bold text-gray-900">{filteredDrafts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
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
          <div className="w-full md:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => filterByCategory(e.target.value)}
              options={categoryOptions}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div className="w-full md:w-32">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={sortOptions}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Draft List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery || categoryFilter ? '該当する下書きが見つかりません' : '下書きがありません'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || categoryFilter 
              ? '検索条件を変更してもう一度お試しください。'
              : '最初の下書きを作成しましょう。'
            }
          </p>
          {!searchQuery && !categoryFilter && (
            <div className="mt-6">
              <Button onClick={handleCreateDraft}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新しい下書きを作成
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
      )}

      {/* Draft Form Modal */}
      <DraftForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        draft={editingDraft}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingDraftId !== null}
        onClose={() => setDeletingDraftId(null)}
        onConfirm={confirmDelete}
        title="下書きを削除"
        message="この下書きを削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除"
        confirmVariant="danger"
      />
    </div>
  );
};
