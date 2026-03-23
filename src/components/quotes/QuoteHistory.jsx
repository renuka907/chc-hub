import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', icon: Eye, color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', icon: XCircle, color: 'bg-gray-100 text-gray-500' },
};

export default function QuoteHistory() {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['patient_quotes'],
    queryFn: () => db.from('patient_quotes').list('-created_at', 50),
  });

  const copyLink = (code) => {
    const link = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No quotes sent yet</p>
        <p className="text-sm">Quotes you send to patients will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotes.map(q => {
        const isExpired = new Date(q.expires_at) < new Date();
        const effectiveStatus = isExpired && q.status === 'active' ? 'expired' : q.status;
        const cfg = statusConfig[effectiveStatus] || statusConfig.active;
        const Icon = cfg.icon;
        const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;

        return (
          <div key={q.id} className="bg-white rounded-lg border p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900 truncate">
                  {q.recipient_name || q.recipient_email || q.recipient_phone || 'Unknown'}
                </span>
                <Badge className={`text-xs ${cfg.color} border-0`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {cfg.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span className="font-medium text-gray-600">${Number(q.total || 0).toFixed(2)}</span>
                <span>{new Date(q.created_at).toLocaleDateString()}</span>
                {q.viewed_at && <span className="text-green-600">Viewed {new Date(q.viewed_at).toLocaleDateString()}</span>}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => copyLink(q.share_code)} className="h-8 text-xs text-gray-500">
              <Copy className="w-3 h-3 mr-1" /> Link
            </Button>
          </div>
        );
      })}
    </div>
  );
}
