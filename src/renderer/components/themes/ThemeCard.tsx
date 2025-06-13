import React from 'react';
import { Theme } from '../../shared/types/database';
import { Button } from '../ui';

interface ThemeCardProps {
  theme: Theme;
  onEdit: () => void;
  onDelete: () => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, onEdit, onDelete }) => {
  const keywords = theme.keywords ? JSON.parse(theme.keywords) : [];
  const articleCount = (theme as any)._count?.collectedArticles || 0;

  const getFrequencyBadge = (frequency: string | undefined) => {
    switch (frequency) {
      case 'daily':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">毎日</span>;
      case 'weekly':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">毎週</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">未設定</span>;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow
      ${!theme.isActive ? 'opacity-60' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {theme.name}
            </h3>
            {!theme.isActive && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                非アクティブ
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mb-2">
            {getFrequencyBadge(theme.updateFrequency)}
            <span className="text-sm text-gray-500">
              記事数: {articleCount}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            編集
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            削除
          </Button>
        </div>
      </div>

      {/* Description */}
      {theme.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {theme.description}
        </p>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">キーワード:</p>
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 5).map((keyword: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 5 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                +{keywords.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <span>作成: {formatDate(theme.createdAt)}</span>
        <span>更新: {formatDate(theme.updatedAt)}</span>
      </div>
    </div>
  );
};
