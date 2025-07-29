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
}

interface EnhancedCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  onSave: (comment: string) => void;
  currentComment: string;
  setCurrentComment: (comment: string) => void;
}

export function EnhancedCommentModal({
  isOpen,
  onClose,
  ticker,
  onSave,
  currentComment,
  setCurrentComment
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
      const response = await fetch(`https://www.mytickerlist.com/api/comments/ticker/${ticker}`);
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
      alert(language === 'fr' ? 'Vous devez être connecté pour commenter' : 'You must be logged in to comment');
      return;
    }
    
    if (currentComment.trim()) {
      try {
        // Save to backend API
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`https://www.mytickerlist.com/api/comments/ticker/${ticker}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            comment_text: currentComment,
            user_id: user.id || 1
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
      const response = await fetch(`https://www.mytickerlist.com/api/comments/${commentId}`, {
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
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce commentaire?' : 'Are you sure you want to delete this comment?')) {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`https://www.mytickerlist.com/api/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          fetchComments();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('commentsFor')} {ticker}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Existing Comments Section */}
        <div className="mb-6 flex-1 overflow-hidden">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('existingComments')}
          </h4>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                {t('loading')}
              </div>
            ) : allComments.length > 0 ? (
              <div className="space-y-3 p-4">
                {allComments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0">
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                          rows={3}
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
                        <div className="text-sm text-gray-900 dark:text-white mb-1">
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
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title={language === 'fr' ? 'Modifier' : 'Edit'}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
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
              <div className="p-4 text-center text-gray-500">
                {t('noCommentsFound')}
              </div>
            )}
          </div>
        </div>

        {/* Add New Comment Section */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('addComment')}:
          </h4>
          
          <textarea
            value={currentComment}
            onChange={(e) => setCurrentComment(e.target.value)}
            placeholder={t('enterYourComment')}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            rows={4}
          />
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!currentComment.trim() || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!user 
                ? t('loginRequired')
                : t('saveComment')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}