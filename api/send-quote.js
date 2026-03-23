import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function generateShareCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return res.status(500).json({ error: 'No service role key' });

  const { recipient_email, recipient_phone, recipient_name, items, total, message, created_by } = req.body;

  if (!items || !items.length) return res.status(400).json({ error: 'Items required' });
  if (!recipient_email && !recipient_phone) return res.status(400).json({ error: 'Email or phone required' });

  const supabase = createClient('https://xtalelqzucijanmnpkol.supabase.co', serviceRoleKey);
  const share_code = generateShareCode();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase.from('patient_quotes').insert({
    share_code,
    recipient_email: recipient_email || null,
    recipient_phone: recipient_phone || null,
    recipient_name: recipient_name || null,
    items,
    total: total || 0,
    message: message || null,
    status: 'active',
    expires_at,
    created_by: created_by || 'unknown',
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Build the share link — use the deployed URL
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : (req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || 'https://chc-hub.vercel.app');
  const shareLink = `${baseUrl}/q/${share_code}`;

  // Send email if provided
  if (recipient_email) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'renuka@dapplylab.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'nlnw kslg shik exhv',
        },
      });

      const itemsHtml = items.map(it =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${it.quantity || 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${Number(it.price || 0).toFixed(2)}</td>
        </tr>`
      ).join('');

      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">Contemporary Health Center</h1>
            <p style="color:#ddd6fe;margin:4px 0 0;font-size:14px;">Your personalized quote</p>
          </div>
          <div style="background:white;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;">
            ${recipient_name ? `<p style="color:#374151;font-size:16px;">Hi ${recipient_name},</p>` : ''}
            ${message ? `<p style="color:#374151;font-size:14px;background:#f9fafb;padding:12px;border-radius:8px;border-left:3px solid #7c3aed;">${message}</p>` : ''}
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280;">Item</th>
                  <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280;">Qty</th>
                  <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px;font-weight:bold;font-size:16px;">Total</td>
                  <td style="padding:12px;font-weight:bold;font-size:16px;text-align:right;color:#7c3aed;">$${Number(total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div style="text-align:center;margin:24px 0;">
              <a href="${shareLink}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Your Quote</a>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;">This quote expires on ${new Date(expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">Contemporary Health Center · This is an estimate and not a guarantee of final pricing.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"Contemporary Health Center" <renuka@dapplylab.com>',
        to: recipient_email,
        subject: 'Your Quote from Contemporary Health Center',
        html,
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // Don't fail the whole request — quote is still saved
    }
  }

  return res.status(200).json({
    ok: true,
    share_code,
    share_link: shareLink,
    quote: data,
  });
}
