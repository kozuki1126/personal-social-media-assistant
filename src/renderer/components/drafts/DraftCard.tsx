import React from 'react';
import { Draft } from '../../stores/draftStore';
import { Button } from '../ui/Button';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  ClockIcon,
  HashtagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface DraftCardProps {
  draft: Draft;
  onEdit: (draft: Draft) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  draft,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getCharacterCount = (content: string) => {
    return content.length;
  };

  const isOverLimit = getCharacterCount(draft.content) > 280;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {draft.title && (
            <h3 className="font-medium text-gray-900 mb-1 truncate">
              {draft.title}
            </h3>
          )}
          {draft.category && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {draft.category}
            </span>
          )}
        </div>
        <div className="flex space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(draft)}
            className="h-8 w-8 p-0"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(draft.id)}
            className="h-8 w-8 p-0"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(draft.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-3">
        <p className="text-gray-700 text-sm leading-relaxed">
          {getContentPreview(draft.content)}
        </p>
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${
          isOverLimit ? 'text-red-600' : 'text-gray-500'
        }`}>
          {getCharacterCount(draft.content)}/280文字
        </span>
        {isOverLimit && (
          <span className="text-xs text-red-600 font-medium">文字数制限超過</span>
        )}
      </div>

      {/* Hashtags */}
      {draft.hashtags.length > 0 && (
        <div className="flex items-center mb-3">
          <HashtagIcon className="h-4 w-4 text-gray-400 mr-1" />
          <div className="flex flex-wrap gap-1">
            {draft.hashtags.slice(0, 3).map((hashtag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                #{hashtag}
              </span>
            ))}
            {draft.hashtags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{draft.hashtags.length - 3}個
              </span>
            )}
          </div>
        </div>
      )}

      {/* Schedule Info */}
      {(draft.scheduledDate || draft.scheduledTime) && (
        <div className="flex items-center mb-3 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>
            予定: {draft.scheduledDate} {draft.scheduledTime}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
        <div className="flex items-center">
          <ClockIcon className="h-3 w-3 mr-1" />
          <span>作成: {formatDate(draft.createdAt)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {draft.isTemplate && (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
              テンプレート
            </span>
          )}
          {draft.mediaUrls.length > 0 && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              メディア{draft.mediaUrls.length}件
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
