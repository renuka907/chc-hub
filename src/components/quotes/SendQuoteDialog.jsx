import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Trash2, Copy, Check, Link2 } from 'lucide-react';
import { getCurrentUser } from '@/api/supabaseHelpers';

export default function SendQuoteDialog({ open, onOpenChange, preselectedItems = [] }) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setResult(null);
      setCopied(false);
      if (preselectedItems.length > 0) {
        setItems(preselectedItems.map(it => ({
          name: it.item_name || it.name || '',
          price: it.price || it.base_price || 0,
          quantity: 1,
          notes: '',
        })));
      } else if (items.length === 0) {
        setItems([{ name: '', price: 0, quantity: 1, notes: '' }]);
      }
    }
  }, [open, preselectedItems]);

  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

  const addItem = () => setItems([...items, { name: '', price: 0, quantity: 1, notes: '' }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const handleSend = async () => {
    if (!recipientEmail && !recipientPhone) return;
    if (!items.some(it => it.name.trim())) return;

    setSending(true);
    try {
      const user = await getCurrentUser();
      const resp = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          recipient_phone: recipientPhone || null,
          items: items.filter(it => it.name.trim()),
          total,
          message: message || null,
          created_by: user?.email || 'staff',
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        setResult(data);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to send quote: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (result?.share_link) {
      navigator.clipboard.writeText(result.share_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setRecipientName('');
      setRecipientEmail('');
      setRecipientPhone('');
      setMessage('');
      setItems([{ name: '', price: 0, quantity: 1, notes: '' }]);
      setResult(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-600" />
            Send Quote to Patient
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-gray-900">Quote Sent!</h3>
              {recipientEmail && <p className="text-sm text-gray-500">Email sent to {recipientEmail}</p>}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <code className="text-xs flex-1 break-all text-purple-700">{result.share_link}</code>
              <Button size="sm" variant="outline" onClick={copyLink} className="flex-shrink-0">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            {recipientPhone && (
              <p className="text-xs text-gray-500 text-center">
                Copy the link above to text to {recipientPhone}
              </p>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Recipient info */}
            <div className="space-y-3">
              <Input
                placeholder="Patient name (optional)"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
                <Input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Items</span>
                <Button size="sm" variant="ghost" onClick={addItem} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price || ''}
                      onChange={e => updateItem(i, 'price', e.target.value)}
                      className="w-24 text-sm"
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="w-16 text-sm"
                      min="1"
                    />
                    {items.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="h-9 w-9 p-0 text-red-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  Total: ${total.toFixed(2)}
                </Badge>
              </div>
            </div>

            {/* Message */}
            <Textarea
              placeholder="Add a personal message (optional)"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              className="text-sm"
            />

            {/* Send */}
            <Button
              onClick={handleSend}
              disabled={sending || (!recipientEmail && !recipientPhone) || !items.some(it => it.name.trim())}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {sending ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
