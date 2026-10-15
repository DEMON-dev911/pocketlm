import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TokenUsage {
  total_tokens_used: number;
  remaining_tokens: number;
  max_tokens: number;
  estimated_remaining_questions: number;
  last_reset: string;
}

interface TokenQuotaProgressBarProps {
  onTokenUpdate?: (usage: TokenUsage) => void;
}

export const TokenQuotaProgressBar: React.FC<TokenQuotaProgressBarProps> = ({ 
  onTokenUpdate 
}) => {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial token usage
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/token-usage');
      if (!res.ok) throw new Error('Failed to fetch token usage');
      const data = await res.json();
      setUsage(data);
      setError(null);
      onTokenUpdate?.(data);
    } catch (e) {
      console.error('Error fetching token usage:', e);
      setError('Could not load token usage');
    } finally {
      setLoading(false);
    }
  }, [onTokenUpdate]);

  // Expose update function to parent via ref or callback
  // We'll provide a way for parents to update usage after API calls
  const updateUsage = useCallback((newUsage: TokenUsage) => {
    setUsage(newUsage);
    onTokenUpdate?.(newUsage);
  }, [onTokenUpdate]);

  // Initialize on mount
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="w-full max-w-md p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <div className="h-4 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const percentage = Math.min(100, Math.max(0, (usage.total_tokens_used / usage.max_tokens) * 100));
  
  // Determine color based on usage percentage
  let barColor = 'from-green-500 to-emerald-400';
  if (percentage > 80) barColor = 'from-red-500 to-rose-400';
  else if (percentage > 60) barColor = 'from-yellow-500 to-orange-400';
  else if (percentage > 40) barColor = 'from-blue-500 to-indigo-400';

  return (
    <div className="w-full max-w-md p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300">API Quota</h3>
        <span className="text-xs text-gray-400 font-mono">
          {usage.total_tokens_used.toLocaleString()} / {usage.max_tokens.toLocaleString()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-4 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50 mb-3">
        <motion.div
          className={`h-full bg-gradient-to-r ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Details */}
      <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-400">
        <div>
          <span className="font-medium text-gray-300">
            {usage.estimated_remaining_questions}
          </span> questions left
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Next reset:</span>
          <span className="font-mono">
            {new Date(usage.last_reset).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Error display if any */}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
};