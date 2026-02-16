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
      return data || [];
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
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
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
  Reminder: 'reminders',
  SharedFormLink: 'shared_form_links',
  Special: 'specials',
  StaffCheckIn: 'staff_check_ins',
  UsageLog: 'usage_logs',
  User: 'users',
  Conversation: 'conversations',
  ConversationMessage: 'conversation_messages',
  UserActivity: 'user_activity',
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
  // TODO: Replace with Supabase Edge Function call to OpenAI/Anthropic
  console.warn('invokeLLM is stubbed — AI features not yet connected', params);
  return { 
    response: 'AI features are being migrated. This feature will be available soon.',
    error: 'AI not yet configured'
  };
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

// Stub for agent chat — TODO: implement with OpenAI + Supabase Realtime
export const agentChat = {
  async createConversation(opts) {
    // TODO: Implement with conversations table + OpenAI
    console.warn('Agent chat is stubbed', opts);
    return { id: null };
  },
  async getConversation(id) {
    console.warn('Agent chat is stubbed');
    return null;
  },
  async addMessage(conv, msg) {
    console.warn('Agent chat is stubbed');
    return null;
  },
  subscribeToConversation(id, callback) {
    console.warn('Agent chat subscription is stubbed');
    return () => {}; // unsubscribe noop
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
