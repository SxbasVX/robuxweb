'use client';
import { useState, useCallback, memo } from 'react';
import type { ReactionMap, Emoji } from '../lib/types';

const EMOJIS: Emoji[] = ['👍', '❤️', '😂', '🔥', '😢'];

const EmojiReactions = memo(function EmojiReactions({ counts = {}, onReact }: { counts?: ReactionMap; onReact?: (e: Emoji) => void }) {
  const [clickedEmoji, setClickedEmoji] = useState<Emoji | null>(null);
  const [isLoading, setIsLoading] = useState<Emoji | null>(null);

  const handleReact = useCallback(async (emoji: Emoji) => {
    if (isLoading) return;
    
    setClickedEmoji(emoji);
    setIsLoading(emoji);
    
    try {
      await onReact?.(emoji);
    } catch (error) {
      console.error('Error reacting:', error);
    } finally {
      setIsLoading(null);
      setTimeout(() => setClickedEmoji(null), 400);
    }
  }, [isLoading, onReact]);

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {EMOJIS.map((emoji, index) => {
        const count = counts?.[emoji] ?? 0;
        const isClicked = clickedEmoji === emoji;
        const isCurrentlyLoading = isLoading === emoji;
        
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={isCurrentlyLoading}
            className={`relative px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-base sm:text-lg font-medium transition-all duration-300 touch-manipulation select-none animate-fade-in gpu-accelerated ${
              count > 0 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'
            } ${isClicked ? 'scale-110 bg-pink-500/30 border-pink-400/50' : ''} ${
              isCurrentlyLoading ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'
            }`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              transform: isClicked ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <span 
              className={`block transition-transform duration-200 ${
                isClicked ? 'scale-125' : ''
              } ${isCurrentlyLoading ? 'animate-pulse' : ''}`}
            >
              {emoji}
            </span>
            {count > 0 && (
              <span 
                className={`ml-1 text-xs font-bold transition-all duration-200 ${
                  isClicked ? 'text-pink-200' : 'text-gray-300'
                }`}
              >
                {count}
              </span>
            )}
            {isCurrentlyLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default EmojiReactions;