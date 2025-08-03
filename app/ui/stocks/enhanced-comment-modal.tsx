'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';

interface Comment {
  id: number;
  ticker: string;
  user_id?: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  username?: string;
  color?: string;
}

interface EnhancedCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  onSave: (comment: string) => void;
  currentComment: string;
  setCurrentComment: (comment: string) => void;
  tickerColor?: string;
}

export function EnhancedCommentModal({
  isOpen,
  onClose,
  ticker,
  onSave,
  currentComment,
  setCurrentComment,
  tickerColor = 'neutral'
}: EnhancedCommentModalProps) {
  const { language, t } = useSettings();
  const { user } = useAuth();
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (isOpen && ticker) {
      fetchComments();
    }
  }, [isOpen, ticker]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/comments/ticker/${ticker}`);
      if (response.ok) {
        const comments = await response.json();
        setAllComments(comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert(t('loginRequired'));
      return;
    }
    
    if (currentComment.trim()) {
      try {
        // Save to backend API
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`/api/proxy/comments/ticker/${ticker}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            comment_text: currentComment,
            user_id: user.id || 1,
            color: tickerColor
          }),
        });
        
        if (response.ok) {
          onSave(currentComment); // Save to localStorage
          fetchComments(); // Refresh comments after saving
        } else {
          console.error('Failed to save comment to backend');
          // Still save locally even if backend fails
          onSave(currentComment);
        }
      } catch (error) {
        console.error('Error saving comment:', error);
        // Still save locally even if backend fails
        onSave(currentComment);
      }
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId: number) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`/api/proxy/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: editText
        }),
      });
      
      if (response.ok) {
        setEditingComment(null);
        setEditText('');
        fetchComments();
        onSave(editText);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce commentaire?' : 'Are you sure you want to delete this comment?')) {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`/api/proxy/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const remainingComments = allComments.filter(c => c.id !== commentId);
          fetchComments();
          if (remainingComments.length === 0) {
            onSave('');
          }
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {ticker} {t('commentsFor').toLowerCase()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-hidden p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('loading')}</span>
            </div>
          ) : allComments.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {allComments.map((comment) => (
                <div key={comment.id} className={`rounded-lg p-3 border-l-4 ${
                  comment.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  comment.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                  comment.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                  'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}>
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm resize-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          {language === 'fr' ? 'Sauvegarder' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          {language === 'fr' ? 'Annuler' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white mb-2">
                        {comment.comment_text}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.username || `${language === 'fr' ? 'Utilisateur' : 'User'} ${comment.user_id || 'Anonyme'}`} • {formatDate(comment.created_at)}
                        </div>
                        {user && comment.user_id === user.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(comment)}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              title={language === 'fr' ? 'Modifier' : 'Edit'}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              title={language === 'fr' ? 'Supprimer' : 'Delete'}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noCommentsFound')}</p>
            </div>
          )}
        </div>

        {/* Add Comment Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <textarea
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            placeholder={t('enterYourComment')}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 resize-none text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={onClose}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!currentComment.trim() || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!user ? t('loginRequired') : t('saveComment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}