import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input, TextArea, Select } from '../ui';
import { Theme } from '../../shared/types/database';
import { ThemeFormData } from '../../shared/types/app';

interface ThemeFormProps {
  theme?: Theme;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ThemeForm: React.FC<ThemeFormProps> = ({ theme, onSuccess, onCancel }) => {
  const { createTheme, updateTheme, isLoading, error, clearError } = useThemeStore();
  
  const [formData, setFormData] = useState<ThemeFormData>({
    name: '',
    description: '',
    keywords: [],
    updateFrequency: 'weekly',
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  const [nameError, setNameError] = useState('');

  // Initialize form data when editing
  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name,
        description: theme.description || '',
        keywords: theme.keywords ? JSON.parse(theme.keywords) : [],
        updateFrequency: theme.updateFrequency || 'weekly',
      });
    }
  }, [theme]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateName = async (name: string) => {
    if (!name.trim()) {
      setNameError('テーマ名は必須です');
      return false;
    }
    
    if (name.length > 100) {
      setNameError('テーマ名は100文字以内で入力してください');
      return false;
    }

    // Check if name already exists (only when creating or changing name)
    if (!theme || theme.name !== name) {
      try {
        const exists = await window.electronAPI.themes.nameExists(name, theme?.id);
        if (exists) {
          setNameError('この名前のテーマは既に存在します');
          return false;
        }
      } catch (error) {
        console.error('Name validation failed:', error);
      }
    }

    setNameError('');
    return true;
  };

  const handleInputChange = (field: keyof ThemeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name') {
      setNameError('');
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isNameValid = await validateName(formData.name);
    if (!isNameValid) {
      return;
    }

    try {
      if (theme) {
        await updateTheme(theme.id, formData);
      } else {
        await createTheme(formData);
      }
      onSuccess();
    } catch (error) {
      // Error is handled by the store
      console.error('Form submission failed:', error);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: '毎日' },
    { value: 'weekly', label: '毎週' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Theme Name */}
      <Input
        label="テーマ名"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={nameError}
        isRequired
        maxLength={100}
        placeholder="例: AI技術の最新動向"
      />

      {/* Description */}
      <TextArea
        label="説明"
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="このテーマで収集したい情報について説明してください"
      />

      {/* Update Frequency */}
      <Select
        label="更新頻度"
        value={formData.updateFrequency}
        onChange={(e) => handleInputChange('updateFrequency', e.target.value as 'daily' | 'weekly')}
        options={frequencyOptions}
        isRequired
      />

      {/* Keywords */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          キーワード
          <span className="text-gray-500 ml-2 font-normal">
            (情報収集に使用されます)
          </span>
        </label>
        
        {/* Keyword Input */}
        <div className="flex space-x-2">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={handleKeywordKeyPress}
            placeholder="キーワードを入力してEnterで追加"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addKeyword}
            disabled={!keywordInput.trim()}
          >
            追加
          </Button>
        </div>

        {/* Keywords List */}
        {formData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!!nameError}
        >
          {theme ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
};
