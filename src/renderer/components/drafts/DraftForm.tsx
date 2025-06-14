import React, { useState, useEffect } from 'react';
import { Draft, DraftFormData, useDraftStore } from '../../stores/draftStore';
import { Button } from '../ui/Button';
import { Input, TextArea, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { 
  XMarkIcon,
  HashtagIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface DraftFormProps {
  isOpen: boolean;
  onClose: () => void;
  draft?: Draft | null;
  onSuccess?: (draft: Draft) => void;
}

export const DraftForm: React.FC<DraftFormProps> = ({
  isOpen,
  onClose,
  draft,
  onSuccess,
}) => {
  const { createDraft, updateDraft, isLoading, getCategories } = useDraftStore();
  
  const [formData, setFormData] = useState<DraftFormData>({
    title: '',
    content: '',
    hashtags: [],
    mediaUrls: [],
    category: '',
    scheduledDate: '',
    scheduledTime: '',
    reminderMinutes: 10,
    isTemplate: false,
  });

  const [hashtagInput, setHashtagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when draft prop changes
  useEffect(() => {
    if (draft) {
      setFormData({
        title: draft.title || '',
        content: draft.content,
        hashtags: [...draft.hashtags],
        mediaUrls: [...draft.mediaUrls],
        category: draft.category || '',
        scheduledDate: draft.scheduledDate || '',
        scheduledTime: draft.scheduledTime || '',
        reminderMinutes: draft.reminderMinutes,
        isTemplate: draft.isTemplate,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        hashtags: [],
        mediaUrls: [],
        category: '',
        scheduledDate: '',
        scheduledTime: '',
        reminderMinutes: 10,
        isTemplate: false,
      });
    }
    setHashtagInput('');
    setErrors({});
  }, [draft, isOpen]);

  const categories = getCategories();
  const categoryOptions = [
    { value: '', label: 'カテゴリなし' },
    ...categories.map(cat => ({ value: cat, label: cat })),
    { value: 'new', label: '新しいカテゴリ...' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = '投稿内容は必須です';
    }

    if (formData.content.length > 280) {
      newErrors.content = '投稿内容は280文字以内で入力してください';
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    if (formData.scheduledDate && !formData.scheduledTime) {
      newErrors.scheduledTime = '投稿日を設定する場合は投稿時刻も設定してください';
    }

    if (formData.scheduledTime && !formData.scheduledDate) {
      newErrors.scheduledDate = '投稿時刻を設定する場合は投稿日も設定してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let result: Draft | null;
      
      if (draft) {
        result = await updateDraft(draft.id, formData);
      } else {
        result = await createDraft(formData);
      }

      if (result) {
        onSuccess?.(result);
        onClose();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace('#', '');
    if (tag && !formData.hashtags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag],
      }));
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index),
    }));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'new') {
      const newCategory = prompt('新しいカテゴリ名を入力してください:');
      if (newCategory?.trim()) {
        setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      }
    } else {
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const getCharacterCount = () => formData.content.length;
  const isOverLimit = getCharacterCount() > 280;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={draft ? '下書きを編集' : '新しい下書き'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タイトル（任意）
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="下書きのタイトルを入力..."
            error={errors.title}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投稿内容 *
          </label>
          <TextArea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="投稿内容を入力してください..."
            rows={6}
            error={errors.content}
          />
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {getCharacterCount()}/280文字
            </span>
            {isOverLimit && (
              <span className="text-sm text-red-600 font-medium">文字数制限超過</span>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ
          </label>
          <Select
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={categoryOptions}
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HashtagIcon className="inline-block h-4 w-4 mr-1" />
            ハッシュタグ
          </label>
          <div className="flex space-x-2 mb-2">
            <Input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyPress={handleHashtagKeyPress}
              placeholder="ハッシュタグを入力..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddHashtag}
              disabled={!hashtagInput.trim()}
            >
              追加
            </Button>
          </div>
          {formData.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.hashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  #{hashtag}
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline-block h-4 w-4 mr-1" />
              投稿予定日
            </label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              error={errors.scheduledDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="inline-block h-4 w-4 mr-1" />
              投稿予定時刻
            </label>
            <Input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              error={errors.scheduledTime}
            />
          </div>
        </div>

        {/* Reminder Minutes */}
        {(formData.scheduledDate || formData.scheduledTime) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              リマインダー（分前）
            </label>
            <Select
              value={formData.reminderMinutes.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
              options={[
                { value: '5', label: '5分前' },
                { value: '10', label: '10分前' },
                { value: '15', label: '15分前' },
                { value: '30', label: '30分前' },
                { value: '60', label: '1時間前' },
              ]}
            />
          </div>
        )}

        {/* Template Flag */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isTemplate"
            checked={formData.isTemplate}
            onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isTemplate" className="ml-2 block text-sm text-gray-700">
            <DocumentTextIcon className="inline-block h-4 w-4 mr-1" />
            テンプレートとして保存
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isOverLimit}
          >
            {draft ? '更新' : '保存'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
