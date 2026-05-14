import { supabase } from './supabaseClient';

/**
 * Generic CRUD helpers that mirror the base44 SDK patterns.
 * Usage:
 *   import { db } from '@/api/supabaseHelpers';
 *   const items = await db.from('inventory_items').list('-updated_at', 500);
 *   const item = await db.from('inventory_items').create({ item_name: 'Test' });
 *   await db.from('inventory_items').update(id, { quantity: 10 });
 *   await db.from('inventory_items').remove(id);
 *   const filtered = await db.from('inventory_items').filter({ status: 'active' });
 */

// Add base44-compatible date aliases (created_date/updated_date) from Supabase fields (created_at/updated_at)
function addDateAliases(row) {
  if (!row) return row;
  if (row.created_at && !row.created_date) row.created_date = row.created_at;
  if (row.updated_at && !row.updated_date) row.updated_date = row.updated_at;
  return row;
}

function parseSort(sortStr) {
  if (!sortStr) return { column: 'created_at', ascending: false };
  if (sortStr.startsWith('-')) {
    return { column: sortStr.slice(1), ascending: false };
  }
  return { column: sortStr, ascending: true };
}

function createTableHelper(tableName) {
  return {
    async list(sort, limit) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(addDateAliases);
    },

    async filter(filters, sort, limit) {
      let query = supabase.from(tableName).select('*');
      if (filters && typeof filters === 'object') {
        for (const [key, value] of Object.entries(filters)) {
          if (value === null) {
            query = query.is(key, null);
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
      if (sort) {
        const { column, ascending } = parseSort(sort);
        query = query.order(column, { ascending });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(addDateAliases);
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data ? addDateAliases(data) : data;
    },

    async create(record) {
      const { data, error } = await supabase.from(tableName).insert(record).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async remove(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    // Alias for remove (base44 used .delete)
    async delete(id) {
      return this.remove(id);
    },
  };
}

// Entity name mapping: base44 PascalCase entity names → Supabase snake_case table names
const TABLE_MAP = {
  AftercareInstruction: 'aftercare_instructions',
  ClinicLocation: 'clinic_locations',
  ConsentForm: 'consent_forms',
  Discount: 'discounts',
  EducationTopic: 'education_topics',
  EmployeeQuestion: 'employee_questions',
  FAQ: 'faqs',
  FormTemplate: 'form_templates',
  InjectionSchedule: 'injection_schedules',
  InventoryItem: 'inventory_items',
  LabTestInfo: 'lab_test_info',
  LibraryDocument: 'library_documents',
  Message: 'messages',
  NotificationPreferences: 'notification_preferences',
  Panel: 'panels',
  PricingItem: 'pricing_items',
  PrintTemplate: 'print_templates',
  Procedure: 'procedures',
  Provider: 'providers',
  Quote: 'quotes',
  InsuranceLabNetwork: 'insurance_lab_networks',
  LabTestFrequency: 'lab_test_frequencies',
  Reminder: 'reminders',
  SharedFormLink: 'shared_form_links',
  Special: 'specials',
  StaffCheckIn: 'staff_check_ins',
  UsageLog: 'usage_logs',
  User: 'users',
  Conversation: 'conversations',
  ConversationMessage: 'conversation_messages',
  UserActivity: 'user_activity',
  Announcement: 'announcements',
  AnnouncementAck: 'announcement_acknowledgments',
  PatientQuote: 'patient_quotes',
};

// Create a proxy-based db object for easy access
// Usage: db.from('table_name').list() OR entities.EntityName.list()
export const db = {
  from(tableName) {
    return createTableHelper(tableName);
  }
};

// Create entity-style access that mirrors base44.entities.EntityName pattern
const entitiesHandler = {};
for (const [entityName, tableName] of Object.entries(TABLE_MAP)) {
  entitiesHandler[entityName] = createTableHelper(tableName);
}
export const entities = entitiesHandler;

// File upload helper using Supabase Storage
export async function uploadFile(file, bucket = 'uploads') {
  const ext = file.name?.split('.').pop() || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { file_url: urlData.publicUrl };
}

// Stub for InvokeLLM — TODO: implement with OpenAI/Anthropic Edge Function
export async function invokeLLM(params) {
  try {
    const response = await fetch('/api/invoke-llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        response_json_schema: params.response_json_schema,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'AI generation failed');
    }
    return await response.json();
  } catch (error) {
    console.error('invokeLLM error:', error);
    throw error;
  }
}

// Stub for GenerateImage — TODO: implement with DALL-E Edge Function
export async function generateImage(params) {
  // TODO: Replace with Supabase Edge Function call to DALL-E
  console.warn('generateImage is stubbed — AI image generation not yet connected', params);
  return { image_url: null, error: 'Image generation not yet configured' };
}

// Stub for SendEmail — TODO: implement with Resend/SendGrid Edge Function
export async function sendEmail(params) {
  // TODO: Replace with Supabase Edge Function
  console.warn('sendEmail is stubbed — email sending not yet connected', params);
  return { success: false, error: 'Email sending not yet configured' };
}

// Agent chat — Peach AI assistant via /api/chat endpoint
export const agentChat = {
  async createConversation(opts = {}) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_email: authUser?.email || 'anonymous',
        agent_name: opts.agent_name || 'peach',
        messages: [],
      })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, messages: data.messages || [] };
  },

  async getConversation(id) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async addMessage(conv, msg, locationFilter) {
    // 1. Get current conversation
    const current = await this.getConversation(conv.id);
    const messages = current.messages || [];

    // 2. Append user message
    const userMsg = { role: msg.role, content: msg.content, created_date: new Date().toISOString() };
    messages.push(userMsg);

    // 3. Call /api/chat for AI response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg.content,
        conversationHistory: messages.slice(-10),
        locationFilter: locationFilter || null,
      }),
    });

    let assistantContent = 'Sorry, I encountered an error. Please try again.';
    let sources = [];
    if (response.ok) {
      const data = await response.json();
      assistantContent = data.reply;
      sources = data.sources || [];
    }

    // 4. Append assistant reply
    const assistantMsg = { role: 'assistant', content: assistantContent, created_date: new Date().toISOString(), sources };
    messages.push(assistantMsg);

    // 5. Update conversation in Supabase
    const { error } = await supabase
      .from('chat_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', conv.id);
    if (error) throw error;

    return { ...current, messages };
  },

  subscribeToConversation(id, callback) {
    const channel = supabase
      .channel(`chat_conv_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_conversations',
        filter: `id=eq.${id}`,
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

// Log user activity
export async function logUserActivity(pageName, userEmail, userFullName) {
  try {
    await supabase.from('user_activity').insert({
      user_email: userEmail,
      user_full_name: userFullName,
      page_name: pageName,
      action_type: 'page_view',
    });
  } catch (e) {
    // Silently fail - activity logging shouldn't break the app
    console.warn('Failed to log activity:', e);
  }
}

// Get current authenticated user with profile data
export async function getCurrentUser() {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  return {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
    role: profile?.role || 'staff',
    page_permissions: profile?.page_permissions || {},
    avatar_url: profile?.avatar_url || '',
    phone: profile?.phone || '',
    ...profile,
  };
}

// Field name mapping helper: base44 used created_date/updated_date, Supabase uses created_at/updated_at
// The schema already uses created_at/updated_at, but base44 data might reference created_date/updated_date
// We handle this by mapping sort fields
export function mapSortField(field) {
  if (!field) return field;
  const clean = field.startsWith('-') ? field.slice(1) : field;
  const prefix = field.startsWith('-') ? '-' : '';
  const map = {
    'created_date': 'created_at',
    'updated_date': 'updated_at',
  };
  return prefix + (map[clean] || clean);
}
