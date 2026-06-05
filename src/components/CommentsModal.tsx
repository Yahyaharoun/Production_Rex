import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/button';

interface Comment {
  id: string;
  production_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productionId: string | null;
  productionImmat?: string;
}

export function CommentsModal({ isOpen, onClose, productionId, productionImmat }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (isOpen && productionId) {
      fetchComments();
    } else {
      setComments([]);
      setNewComment('');
    }
  }, [isOpen, productionId]);

  const fetchComments = async () => {
    if (!productionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_comments')
        .select('*')
        .eq('production_id', productionId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !productionId || !user) return;

    setSending(true);
    try {
      const authorName = user.full_name || user.email || 'Utilisateur inconnu';
      
      const { data, error } = await supabase
        .from('production_comments')
        .insert({
          production_id: productionId,
          author_id: user.id,
          author_name: authorName,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setComments(prev => [...prev, data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi du commentaire:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold">Commentaires {productionImmat ? `(${productionImmat})` : ''}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Liste des commentaires */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 min-h-[150px]">
              <MessageCircle className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">Aucun commentaire pour ce voyage</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isMe = comment.author_id === user?.id;
              
              return (
                <div 
                  key={comment.id} 
                  className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div className={`flex items-end gap-1.5 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {isMe ? 'Moi' : comment.author_name}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {comment.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="p-3 bg-white border-t">
          <form onSubmit={handleSend} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="flex-1 bg-slate-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              disabled={sending}
            />
            <Button 
              type="submit" 
              disabled={!newComment.trim() || sending}
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
