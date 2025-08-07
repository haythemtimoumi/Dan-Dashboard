'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: number;
  comment: string;
  user_id: number;
  ticker_id: number;
  color: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  username: string;
  ticker_symbol: string;
}

interface TickerCommentsProps {
  tickerId: string | number;
  tickerSymbol: string;
  userId?: number;
}

const API_URL = '/api/proxy';

export default function TickerComments({ tickerId, tickerSymbol, userId = 1 }: TickerCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments && userId) {
      fetchComments();
    }
  }, [showComments, userId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/comments/user/${userId}`);
      if (response.ok) {
        const allComments = await response.json();
        const tickerComments = allComments.filter((comment: Comment) => 
          comment.ticker_symbol === tickerSymbol
        );
        setComments(tickerComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (color: string | null) => {
    switch (color) {
      case 'red': return 'border-l-red-500 bg-red-50';
      case 'green': return 'border-l-green-500 bg-green-50';
      case 'yellow': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowComments(!showComments);
        }}
        className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
        Comments
        {comments.length > 0 && (
          <span className="ml-1 bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </button>

      {showComments && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              Comments for {tickerSymbol}
            </h3>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No comments for this ticker yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg border-l-4 ${getColorClass(comment.color)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {comment.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}