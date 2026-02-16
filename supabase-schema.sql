-- ============================================================================
-- CHC Hub: Supabase Migration Schema
-- Generated: 2026-02-15
-- 26 tables + 2 supporting tables (conversations, conversation_messages)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER: auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS (synced with auth.users)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'read_only')),
  page_permissions JSONB DEFAULT '{}',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'staff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 2. CLINIC_LOCATIONS
-- ============================================================================
CREATE TABLE clinic_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  hours TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER clinic_locations_updated_at BEFORE UPDATE ON clinic_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. AFTERCARE_INSTRUCTIONS
-- ============================================================================
CREATE TABLE aftercare_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_name TEXT NOT NULL,
  instructions TEXT, -- rich text/HTML
  warnings TEXT,
  follow_up_schedule TEXT,
  image_url TEXT,
  document_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES aftercare_instructions(id) ON DELETE SET NULL,
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER aftercare_instructions_updated_at BEFORE UPDATE ON aftercare_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. CONSENT_FORMS
-- ============================================================================
CREATE TABLE consent_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_name TEXT NOT NULL,
  content TEXT, -- rich text/HTML
  category TEXT DEFAULT 'General',
  document_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES consent_forms(id) ON DELETE SET NULL,
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER consent_forms_updated_at BEFORE UPDATE ON consent_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 5. DISCOUNTS
-- ============================================================================
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  applicable_item_ids JSONB DEFAULT '[]',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  min_purchase_amount NUMERIC(10,2),
  max_discount_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. EDUCATION_TOPICS
-- ============================================================================
CREATE TABLE education_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT, -- rich text/HTML
  category TEXT DEFAULT 'General',
  image_url TEXT,
  medical_references TEXT,
  header TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES education_topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER education_topics_updated_at BEFORE UPDATE ON education_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 7. EMPLOYEE_QUESTIONS
-- ============================================================================
CREATE TABLE employee_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT,
  asked_by TEXT,
  answered_by TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER employee_questions_updated_at BEFORE UPDATE ON employee_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 8. FAQS
-- ============================================================================
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 9. FORM_TEMPLATES
-- ============================================================================
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('aftercare', 'consent')),
  content TEXT,
  category TEXT DEFAULT 'General',
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER form_templates_updated_at BEFORE UPDATE ON form_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 10. INJECTION_SCHEDULES
-- ============================================================================
CREATE TABLE injection_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  patient_name TEXT,
  injection_type TEXT,
  time TEXT,
  provider TEXT,
  notes TEXT,
  location_id UUID REFERENCES clinic_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER injection_schedules_updated_at BEFORE UPDATE ON injection_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 11. INVENTORY_ITEMS
-- ============================================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'Supply' CHECK (item_type IN ('Product', 'Supply', 'Equipment', 'Medication')),
  item_condition TEXT DEFAULT 'unopened' CHECK (item_condition IN ('unopened', 'opened', 'partial')),
  sku TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  low_stock_threshold NUMERIC(10,2) DEFAULT 10,
  reorder_quantity NUMERIC(10,2),
  cost_per_unit NUMERIC(10,2),
  location_id UUID REFERENCES clinic_locations(id) ON DELETE SET NULL,
  storage_location TEXT,
  associated_pricing_item_ids JSONB DEFAULT '[]',
  supplier TEXT,
  notes TEXT,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);

-- ============================================================================
-- 12. PANELS
-- ============================================================================
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER panels_updated_at BEFORE UPDATE ON panels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 13. LAB_TEST_INFO
-- ============================================================================
CREATE TABLE lab_test_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  test_code TEXT,
  category TEXT DEFAULT 'General',
  tube_type TEXT,
  specimen_type TEXT,
  collection_instructions TEXT,
  storage_requirements TEXT,
  volume_required TEXT,
  quest_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  panel_id UUID REFERENCES panels(id) ON DELETE SET NULL, -- legacy single panel
  panel_ids JSONB DEFAULT '[]', -- multiple panels
  diagnosis_codes JSONB DEFAULT '[]', -- ICD-10 codes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER lab_test_info_updated_at BEFORE UPDATE ON lab_test_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_lab_test_info_quest_url ON lab_test_info(quest_url);
CREATE INDEX idx_lab_test_info_test_code ON lab_test_info(test_code);

-- ============================================================================
-- 14. LIBRARY_DOCUMENTS
-- ============================================================================
CREATE TABLE library_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_name TEXT NOT NULL,
  document_url TEXT,
  file_urls JSONB DEFAULT '[]',
  category TEXT DEFAULT 'General',
  description TEXT,
  file_type TEXT,
  tags JSONB DEFAULT '[]',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER library_documents_updated_at BEFORE UPDATE ON library_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 15. MESSAGES
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_email TEXT,
  sender_name TEXT,
  recipient_email TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_messages_recipient ON messages(recipient_email);

-- ============================================================================
-- 16. NOTIFICATION_PREFERENCES
-- ============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  advance_hours NUMERIC DEFAULT 24,
  notify_on_due BOOLEAN DEFAULT TRUE,
  notify_on_overdue BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX idx_notification_preferences_email ON notification_preferences(user_email);

-- ============================================================================
-- 17. PRICING_ITEMS
-- ============================================================================
CREATE TABLE pricing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  price NUMERIC(10,2),
  member_price NUMERIC(10,2),
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_favorite BOOLEAN DEFAULT FALSE,
  location_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pricing_items_updated_at BEFORE UPDATE ON pricing_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 18. PRINT_TEMPLATES
-- ============================================================================
CREATE TABLE print_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  template_type TEXT DEFAULT 'detailed' CHECK (template_type IN ('detailed', 'simple')),
  custom_header TEXT,
  custom_footer TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER print_templates_updated_at BEFORE UPDATE ON print_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 19. PROCEDURES
-- ============================================================================
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  cpt_code TEXT,
  icd10_codes TEXT,
  estimated_duration TEXT,
  average_cost NUMERIC(10,2),
  instructions TEXT, -- rich text/HTML
  warnings TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER procedures_updated_at BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 20. PROVIDERS
-- ============================================================================
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  credentials TEXT,
  specialty TEXT,
  npi TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  taxonomy_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 21. QUOTES
-- ============================================================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  items JSONB DEFAULT '[]', -- array of line items
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  location_id UUID REFERENCES clinic_locations(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 22. REMINDERS
-- ============================================================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to TEXT, -- user email
  created_by TEXT, -- user email
  completed BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'annually')),
  recurrence_interval INTEGER DEFAULT 1,
  next_trigger_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  show_after TIMESTAMPTZ, -- snooze until
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_reminders_assigned_to ON reminders(assigned_to);
CREATE INDEX idx_reminders_completed ON reminders(completed);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);

-- ============================================================================
-- 23. SHARED_FORM_LINKS
-- ============================================================================
CREATE TABLE shared_form_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type TEXT NOT NULL CHECK (form_type IN ('consent', 'aftercare', 'quote')),
  form_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  password TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shared_form_links_updated_at BEFORE UPDATE ON shared_form_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_shared_form_links_token ON shared_form_links(share_token);

-- ============================================================================
-- 24. SPECIALS
-- ============================================================================
CREATE TABLE specials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date DATE,
  end_date DATE,
  is_archived BOOLEAN DEFAULT FALSE,
  discount_percentage NUMERIC(5,2),
  promo_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER specials_updated_at BEFORE UPDATE ON specials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 25. STAFF_CHECK_INS
-- ============================================================================
CREATE TABLE staff_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  location_id UUID REFERENCES clinic_locations(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER staff_check_ins_updated_at BEFORE UPDATE ON staff_check_ins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_staff_check_ins_date ON staff_check_ins(date);

-- ============================================================================
-- 26. USAGE_LOGS
-- ============================================================================
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name TEXT, -- denormalized
  location_id UUID REFERENCES clinic_locations(id) ON DELETE SET NULL,
  quantity_used NUMERIC(10,2) NOT NULL,
  unit TEXT,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_reason TEXT DEFAULT 'procedure' CHECK (usage_reason IN ('procedure', 'waste', 'stock_adjustment', 'expired', 'other')),
  procedure_type TEXT,
  recorded_by TEXT, -- user email
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER usage_logs_updated_at BEFORE UPDATE ON usage_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_usage_logs_date ON usage_logs(usage_date);
CREATE INDEX idx_usage_logs_item ON usage_logs(inventory_item_id);

-- ============================================================================
-- SUPPORTING: CONVERSATIONS (for Agent Chat replacement)
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT DEFAULT 'peach',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_messages_conv ON conversation_messages(conversation_id);

-- ============================================================================
-- SUPPORTING: USER_ACTIVITY (for NavigationTracker)
-- ============================================================================
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT,
  user_full_name TEXT,
  page_name TEXT NOT NULL,
  action_type TEXT DEFAULT 'page_view',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_activity_timestamp ON user_activity(timestamp);
CREATE INDEX idx_user_activity_email ON user_activity(user_email);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user admin or manager?
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aftercare_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE injection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Authenticated users can read most data
-- Admins/managers can write, staff limited, read_only can only read
-- ============================================================================

-- USERS: users can read all, edit own, admin can edit all
CREATE POLICY users_select ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY users_update_admin ON users FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY users_delete_admin ON users FOR DELETE TO authenticated USING (is_admin());

-- SHARED_FORM_LINKS: need anon access for viewing shared forms
CREATE POLICY shared_form_links_select_anon ON shared_form_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
CREATE POLICY shared_form_links_select_auth ON shared_form_links FOR SELECT TO authenticated USING (true);
CREATE POLICY shared_form_links_insert ON shared_form_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY shared_form_links_update ON shared_form_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY shared_form_links_delete ON shared_form_links FOR DELETE TO authenticated USING (true);

-- For forms accessible via shared links (anon read)
CREATE POLICY consent_forms_select_anon ON consent_forms FOR SELECT TO anon USING (true);
CREATE POLICY aftercare_instructions_select_anon ON aftercare_instructions FOR SELECT TO anon USING (true);
CREATE POLICY quotes_select_anon ON quotes FOR SELECT TO anon USING (true);
CREATE POLICY clinic_locations_select_anon ON clinic_locations FOR SELECT TO anon USING (true);

-- GENERIC PATTERN: All authenticated can read, admin/manager/staff can write
-- (Apply to all content tables)

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clinic_locations', 'aftercare_instructions', 'consent_forms', 'discounts',
    'education_topics', 'employee_questions', 'faqs', 'form_templates',
    'injection_schedules', 'inventory_items', 'panels', 'lab_test_info',
    'library_documents', 'messages', 'notification_preferences', 'pricing_items',
    'print_templates', 'procedures', 'providers', 'quotes', 'reminders',
    'specials', 'staff_check_ins', 'usage_logs'
  ]
  LOOP
    -- All authenticated users can read
    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (true)', tbl || '_auth', tbl);
    
    -- Admin and manager can insert
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (get_user_role() IN (''admin'', ''manager'', ''staff''))', tbl || '_write', tbl);
    
    -- Admin and manager can update
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (get_user_role() IN (''admin'', ''manager'', ''staff''))', tbl || '_edit', tbl);
    
    -- Only admin can delete
    EXECUTE format('CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (is_admin_or_manager())', tbl || '_del', tbl);
  END LOOP;
END;
$$;

-- CONVERSATIONS: users can only access their own
CREATE POLICY conversations_select ON conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY conversations_insert ON conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- CONVERSATION_MESSAGES: through conversation ownership
CREATE POLICY conv_messages_select ON conversation_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY conv_messages_insert ON conversation_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- USER_ACTIVITY: admin only for reading, all auth for insert
CREATE POLICY user_activity_select ON user_activity FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY user_activity_insert ON user_activity FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- STORAGE BUCKETS (run via Supabase dashboard or management API)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies (all authenticated can upload, public can read)
-- CREATE POLICY storage_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY storage_read ON storage.objects FOR SELECT TO public USING (true);

-- ============================================================================
-- ENABLE REALTIME for conversation_messages (for agent chat)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;

-- ============================================================================
-- DEFAULT DATA: Set up default permissions trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION set_default_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'staff' AND (NEW.page_permissions IS NULL OR NEW.page_permissions = '{}') THEN
    NEW.page_permissions = '{
      "home": {"actions": ["view"]},
      "procedures": {"actions": ["view"]},
      "labTests": {"actions": ["view", "create"]},
      "medicationCalculator": {"actions": ["view", "use"]},
      "library": {"actions": ["view", "create", "edit", "delete"]},
      "formTemplates": {"actions": ["view", "create", "edit", "delete"]},
      "clinicDirectory": {"actions": ["view", "create", "edit", "delete"]}
    }'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_permissions
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION set_default_user_permissions();
