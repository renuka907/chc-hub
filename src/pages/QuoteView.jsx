import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xtalelqzucijanmnpkol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDE4NDgsImV4cCI6MjA4Njc3Nzg0OH0.ikyqUV85rLFE9lZOOe74LOAGIpGnRgshyH5B5ufbwLo'
);

export default function QuoteView() {
  const { shareCode } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuote() {
      const { data, error: fetchError } = await supabase
        .from('patient_quotes')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (fetchError || !data) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      setQuote(data);
      setLoading(false);

      // Mark as viewed on first view
      if (data.status === 'active' && !data.viewed_at) {
        await supabase
          .from('patient_quotes')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    }
    fetchQuote();
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-500">This quote link may be invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quote.expires_at) < new Date();
  const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quote Expired</h2>
          <p className="text-gray-500">This quote expired on {new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
          <p className="text-gray-400 text-sm mt-2">Please contact us for an updated quote.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-t-2xl p-6 text-white">
          <h1 className="text-xl font-bold">Contemporary Health Center</h1>
          <p className="text-purple-200 text-sm mt-1">Your Personalized Quote</p>
        </div>

        {/* Body */}
        <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
          {/* Greeting & Message */}
          <div className="p-6 border-b border-gray-100">
            {quote.recipient_name && (
              <p className="text-gray-700 font-medium mb-2">Hi {quote.recipient_name},</p>
            )}
            {quote.message && (
              <div className="bg-purple-50 border-l-3 border-purple-500 p-3 rounded-r-lg text-sm text-gray-700" style={{ borderLeftWidth: 3, borderLeftColor: '#7c3aed' }}>
                {quote.message}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="p-6">
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                    {(item.quantity || 1) > 1 && <p className="text-xs text-gray-400">Qty: {item.quantity}</p>}
                  </div>
                  <p className="font-semibold text-gray-900 ml-4">${Number(item.price || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t-2 border-gray-100 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-purple-600">${Number(quote.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-400 text-center">
              This quote is valid until {new Date(quote.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              Prices are estimates and may vary. Contact us for details.
            </p>
          </div>
        </div>

        {/* Branding footer */}
        <p className="text-center text-xs text-gray-300 mt-4">Contemporary Health Center</p>
      </div>
    </div>
  );
}
