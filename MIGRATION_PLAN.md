# CHC Hub: Base44 → Supabase Migration Plan

**Generated:** 2026-02-15
**App:** Contemporary Health Center Hub
**Current Platform:** Base44 (React + Vite frontend, Base44 SDK backend)
**Target Platform:** Supabase (PostgreSQL + Edge Functions + Auth + Storage)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Entity Schema Mapping (All 26 Tables)](#3-entity-schema-mapping)
4. [Base44 SDK Call Mapping](#4-base44-sdk-call-mapping)
5. [Serverless Functions → Edge Functions](#5-serverless-functions)
6. [AI Integrations Replacement](#6-ai-integrations)
7. [Auth Migration](#7-auth-migration)
8. [File Storage Migration](#8-file-storage)
9. [Agent/Chat System Migration](#9-agent-chat-system)
10. [Printing System Analysis & Fix Plan](#10-printing-system)
11. [Migration Phases & Effort Estimates](#11-migration-phases)

---

## 1. Executive Summary

CHC Hub is a clinic management application built on Base44 with 26 entities, 9 serverless functions, AI integrations (LLM, image generation, email), file uploads, an agent chat system, and a complex printing subsystem. The app manages procedures, inventory, lab tests, pricing, quotes, reminders, staff check-ins, education topics, and document libraries for Contemporary Health Center in Fort Myers, FL.

**Key migration challenges:**
- 26 entities with varying complexity (some have JSON-stringified arrays as fields)
- AI integrations (InvokeLLM, GenerateImage) need replacement with OpenAI/Anthropic APIs
- Agent chat system (base44.agents.*) needs full replacement
- File upload system needs Supabase Storage migration
- Role-based permissions system stored in User entity
- Real-time subscriptions for agent chat

---

## 2. Current Architecture Analysis

### Files that import base44Client (40+ files)

**Pages (22):** ActivityDashboard, AdminProfile, AftercareDetail, AftercareLibrary, CheckoutQuote, ClinicDirectory, ConsentFormDetail, DiscountManagement, EducationDetail, EducationLibrary, EmployeeQuestions, FAQ, FormTemplates, InventoryManagement, InventoryReports, InventoryUsageTracking, LabTestDirectory, Library, Messaging, PricingManagement, ProcedureDetail, ProceduresManagement, ProviderReferral, QuoteDetail, QuotesManagement, Reminders, Specials, StaffCheckIn, UserManagement, UserProfile, ViewSharedForm

**Components (20+):** AftercareForm, ConsentFormForm, EducationTopicForm, FAQForm, ProcedureForm, DiscountForm, InventoryForm, InventoryAI, InventoryAuditForm, UsageRecorder, ReportGenerator, PricingForm, CategoryManagement, EditQuoteDialog, EditProviderDialog, EditSpecialDialog, EditUserDialog, RoleManagementDialog, ShareFormDialog, VersionHistory, TemplateForm, TemplateSelector, AISuggestTemplates, AgentChat, PanelManager, NotificationPreferencesDialog, ReminderEditDialog, CalendarView, DocumentUploadDialog, DocumentEditDialog, EducationPrintDialog, usePermissions, NavigationTracker

### Base44 SDK Methods Used

| Method | Count | Description |
|--------|-------|-------------|
| `entities.X.list()` | ~45 | List with optional sort/limit |
| `entities.X.filter()` | ~15 | Filter by field values |
| `entities.X.create()` | ~25 | Create new record |
| `entities.X.update()` | ~35 | Update by ID |
| `entities.X.delete()` | ~15 | Delete by ID |
| `entities.X.get()` | 1 | Get by ID (functions only) |
| `asServiceRole.entities.X.*` | ~12 | Service-role access (bypasses RLS) |
| `auth.me()` | ~18 | Get current user |
| `auth.logout()` | 3 | Logout |
| `auth.redirectToLogin()` | 4 | Redirect to login |
| `auth.updateMe()` | 2 | Update profile |
| `auth.changePassword()` | 1 | Change password |
| `integrations.Core.InvokeLLM()` | 8 | AI text generation |
| `integrations.Core.UploadFile()` | 8 | File upload |
| `integrations.Core.GenerateImage()` | 1 | AI image generation |
| `integrations.Core.SendEmail()` | 2 | Email sending |
| `functions.invoke()` | 8 | Serverless function calls |
| `agents.*` | 6 | Agent chat system |
| `appLogs.logUserInApp()` | 1 | Activity logging |

---

## 3. Entity Schema Mapping

### 3.1 AftercareInstruction
**Used in:** AftercareForm, AftercareDetail, AftercareLibrary, Library, AISuggestTemplates, ViewSharedForm
**Fields (inferred from code):**
- `id` (auto)
- `created_date`, `updated_date` (timestamps)
- `procedure_name` (text)
- `instructions` (rich text/HTML)
- `warnings` (text)
- `follow_up_schedule` (text)
- `image_url` (text - uploaded file URL)
- `document_url` (text - uploaded PDF URL)
- `is_favorite` (boolean)
- `tags` (text - JSON-stringified array)
- `version` (integer)
- `parent_id` (self-reference for versioning)
- `effective_date` (date)

### 3.2 ClinicLocation
**Used in:** ClinicDirectory, CheckoutQuote, InventoryForm, InventoryAuditForm, PricingForm, QuoteDetail, ProviderReferral, StaffCheckIn, ViewSharedForm, UsageRecorder, AgentChat, InventoryManagement, InventoryReports, ReportGenerator
**Fields:**
- `id`, `created_date`, `updated_date`
- `name` (text)
- `address` (text)
- `phone` (text)
- `fax` (text)
- `email` (text)
- `hours` (text)
- `status` (text: 'active'|'inactive')
- `is_favorite` (boolean)
- `notes` (text)

### 3.3 ConsentForm
**Used in:** ConsentFormForm, ConsentFormDetail, AftercareLibrary, Library, AISuggestTemplates, ViewSharedForm
**Fields:**
- `id`, `created_date`, `updated_date`
- `form_name` (text)
- `content` (rich text/HTML)
- `category` (text)
- `document_url` (text)
- `is_favorite` (boolean)
- `tags` (text - JSON array)
- `version` (integer)
- `parent_id` (self-reference)
- `effective_date` (date)

### 3.4 Discount
**Used in:** DiscountForm, DiscountManagement, CheckoutQuote, QuoteDetail, EditQuoteDialog
**Fields:**
- `id`, `created_date`, `updated_date`
- `name` (text)
- `description` (text)
- `discount_type` (text: 'percentage'|'fixed')
- `discount_value` (numeric)
- `applicable_item_ids` (text - JSON array of PricingItem IDs)
- `start_date` (date)
- `end_date` (date)
- `status` (text: 'active'|'inactive')
- `min_purchase_amount` (numeric)
- `max_discount_amount` (numeric)

### 3.5 EducationTopic
**Used in:** EducationTopicForm, EducationDetail, EducationLibrary, Library, EducationPrintDialog, EducationVersionHistory
**Fields:**
- `id`, `created_date`, `updated_date`
- `title` (text)
- `summary` (text)
- `content` (rich text/HTML)
- `category` (text)
- `image_url` (text)
- `medical_references` (text)
- `header` (text)
- `is_favorite` (boolean)
- `version` (integer)
- `parent_id` (self-reference)

### 3.6 EmployeeQuestion
**Used in:** EmployeeQuestions
**Fields:**
- `id`, `created_date`, `updated_date`
- `question` (text)
- `answer` (text)
- `asked_by` (text - email)
- `answered_by` (text - email)
- `status` (text: 'pending'|'answered')
- `category` (text)

### 3.7 FAQ
**Used in:** FAQForm, FAQ page
**Fields:**
- `id`, `created_date`, `updated_date`
- `question` (text)
- `answer` (text)
- `category` (text)
- `order` (integer)
- `is_published` (boolean)

### 3.8 FormTemplate
**Used in:** TemplateForm, TemplateSelector, AISuggestTemplates, FormTemplates, AftercareDetail, ConsentFormDetail
**Fields:**
- `id`, `created_date`, `updated_date`
- `template_name` (text)
- `template_type` (text: 'aftercare'|'consent')
- `content` (rich text/HTML)
- `category` (text)
- `usage_count` (integer)
- `is_favorite` (boolean)

### 3.9 InjectionSchedule
**Used in:** StaffCheckIn
**Fields:**
- `id`, `created_date`, `updated_date`
- `date` (date)
- `patient_name` (text)
- `injection_type` (text)
- `time` (text)
- `provider` (text)
- `notes` (text)
- `location_id` (FK → ClinicLocation)

### 3.10 InventoryItem
**Used in:** InventoryForm, InventoryAuditForm, InventoryManagement, InventoryReports, InventoryUsageTracking, UsageRecorder, InventoryAI, ReportGenerator
**Fields:**
- `id`, `created_date`, `updated_date`
- `item_name` (text)
- `item_type` (text: 'Product'|'Supply'|'Equipment'|'Medication')
- `item_condition` (text: 'unopened'|'opened'|'partial')
- `sku` (text)
- `quantity` (numeric)
- `unit` (text)
- `low_stock_threshold` (numeric)
- `reorder_quantity` (numeric)
- `cost_per_unit` (numeric)
- `location_id` (text - FK → ClinicLocation)
- `storage_location` (text)
- `associated_pricing_item_ids` (text - JSON array)
- `supplier` (text)
- `notes` (text)
- `expiry_date` (date)
- `status` (text: 'active'|'archived')

### 3.11 LabTestInfo
**Used in:** LabTestDirectory, PanelManager, fetchQuestTubeType, syncQuestTubeType, generateICD10Codes
**Fields:**
- `id`, `created_date`, `updated_date`
- `test_name` (text)
- `test_code` (text)
- `category` (text)
- `tube_type` (text)
- `specimen_type` (text)
- `collection_instructions` (text)
- `storage_requirements` (text)
- `volume_required` (text)
- `quest_url` (text)
- `notes` (text)
- `is_favorite` (boolean)
- `panel_id` (text - FK → Panel, deprecated)
- `panel_ids` (text - JSON array of Panel IDs)
- `diagnosis_codes` (text - JSON array of ICD-10 codes)

### 3.12 LibraryDocument
**Used in:** DocumentUploadDialog, DocumentEditDialog, DocumentPrintDialog, Library
**Fields:**
- `id`, `created_date`, `updated_date`
- `document_name` (text)
- `document_url` (text)
- `file_urls` (text - JSON array)
- `category` (text)
- `description` (text)
- `file_type` (text)
- `tags` (text - JSON array)
- `is_favorite` (boolean)

### 3.13 Message
**Used in:** Messaging
**Fields:**
- `id`, `created_date`, `updated_date`
- `content` (text)
- `sender_email` (text)
- `sender_name` (text)
- `recipient_email` (text)
- `is_read` (boolean)

### 3.14 NotificationPreferences
**Used in:** NotificationPreferencesDialog, remindersNotifier
**Fields:**
- `id`, `created_date`, `updated_date`
- `user_email` (text)
- `advance_hours` (numeric, default 24)
- `notify_on_due` (boolean, default true)
- `notify_on_overdue` (boolean, default true)
- `enabled` (boolean, default true)

### 3.15 Panel
**Used in:** PanelManager, LabTestDirectory
**Fields:**
- `id`, `created_date`, `updated_date`
- `panel_name` (text)
- `description` (text)
- `status` (text: 'active'|'inactive')

### 3.16 PricingItem
**Used in:** PricingForm, PricingManagement, CategoryManagement, InventoryForm, CheckoutQuote, EditQuoteDialog, DiscountForm
**Fields:**
- `id`, `created_date`, `updated_date`
- `name` (text)
- `description` (text)
- `category` (text)
- `price` (numeric)
- `member_price` (numeric)
- `unit` (text)
- `status` (text: 'active'|'inactive')
- `is_favorite` (boolean)
- `location_ids` (text - JSON array)

### 3.17 PrintTemplate
**Used in:** EducationPrintDialog
**Fields:**
- `id`, `created_date`, `updated_date`
- `template_name` (text)
- `template_type` (text: 'detailed'|'simple')
- `custom_header` (text)
- `custom_footer` (text)
- `is_default` (boolean)

### 3.18 Procedure
**Used in:** ProcedureForm, ProcedureDetail, ProceduresManagement
**Fields:**
- `id`, `created_date`, `updated_date`
- `procedure_name` (text)
- `description` (text)
- `category` (text)
- `cpt_code` (text)
- `icd10_codes` (text)
- `estimated_duration` (text)
- `average_cost` (numeric)
- `instructions` (rich text/HTML)
- `warnings` (text)
- `is_favorite` (boolean)

### 3.19 Provider
**Used in:** EditProviderDialog, ProviderReferral
**Fields:**
- `id`, `created_date`, `updated_date`
- `full_name` (text)
- `credentials` (text)
- `specialty` (text)
- `npi` (text)
- `phone` (text)
- `fax` (text)
- `email` (text)
- `address` (text)
- `city` (text)
- `state` (text)
- `zip` (text)
- `notes` (text)
- `status` (text: 'active'|'inactive')
- `taxonomy_code` (text)

### 3.20 Quote
**Used in:** CheckoutQuote, QuoteDetail, QuotesManagement, EditQuoteDialog, ViewSharedForm
**Fields:**
- `id`, `created_date`, `updated_date`
- `patient_name` (text)
- `patient_email` (text)
- `patient_phone` (text)
- `items` (text - JSON array of line items)
- `subtotal` (numeric)
- `discount_amount` (numeric)
- `total` (numeric)
- `discount_id` (text - FK → Discount)
- `location_id` (text - FK → ClinicLocation)
- `notes` (text)
- `status` (text: 'draft'|'sent'|'accepted'|'rejected')
- `valid_until` (date)

### 3.21 Reminder
**Used in:** Reminders, ReminderEditDialog, CalendarView, EducationPrintDialog, remindersNotifier, generateRecurringReminders
**Fields:**
- `id`, `created_date`, `updated_date`
- `title` (text)
- `description` (text)
- `due_date` (timestamp)
- `priority` (text: 'low'|'medium'|'high')
- `assigned_to` (text - email)
- `created_by` (text - email)
- `completed` (boolean)
- `recurrence_type` (text: 'none'|'daily'|'weekly'|'monthly'|'annually')
- `recurrence_interval` (integer)
- `next_trigger_at` (timestamp)
- `last_notified_at` (timestamp)
- `show_after` (timestamp - snooze)

### 3.22 SharedFormLink
**Used in:** ShareFormDialog, ViewSharedForm
**Fields:**
- `id`, `created_date`, `updated_date`
- `form_type` (text: 'consent'|'aftercare'|'quote')
- `form_id` (text)
- `share_token` (text - unique)
- `password` (text)
- `expires_at` (timestamp)
- `is_active` (boolean)
- `view_count` (integer)

### 3.23 Special
**Used in:** Specials, EditSpecialDialog
**Fields:**
- `id`, `created_date`, `updated_date`
- `title` (text)
- `description` (text)
- `image_url` (text)
- `start_date` (date)
- `end_date` (date)
- `is_archived` (boolean)
- `discount_percentage` (numeric)
- `promo_code` (text)

### 3.24 StaffCheckIn
**Used in:** StaffCheckIn
**Fields:**
- `id`, `created_date`, `updated_date`
- `date` (date)
- `user_email` (text)
- `user_name` (text)
- `check_in_time` (timestamp)
- `check_out_time` (timestamp)
- `location_id` (text - FK → ClinicLocation)
- `notes` (text)

### 3.25 UsageLog
**Used in:** UsageRecorder, InventoryUsageTracking, InventoryAI
**Fields:**
- `id`, `created_date`, `updated_date`
- `inventory_item_id` (text - FK → InventoryItem)
- `item_name` (text - denormalized)
- `location_id` (text - FK → ClinicLocation)
- `quantity_used` (numeric)
- `unit` (text)
- `usage_date` (date)
- `usage_reason` (text: 'procedure'|'waste'|'stock_adjustment'|'expired'|'other')
- `procedure_type` (text)
- `recorded_by` (text - email)
- `notes` (text)

### 3.26 User
**Used in:** UserManagement, EditUserDialog, RoleManagementDialog, Messaging, Reminders, setDefaultUserPermissions
**Fields:**
- `id`, `created_date`, `updated_date`
- `email` (text)
- `full_name` (text)
- `role` (text: 'admin'|'manager'|'staff'|'read_only')
- `page_permissions` (text - JSON object)
- `avatar_url` (text)
- `phone` (text)

**Note:** `UserActivity` is referenced in `getUserActivityMetrics` function but NOT in the 26 entities list. It's likely a Base44 built-in logging entity accessed via `base44.appLogs.logUserInApp()`.

---

## 4. Base44 SDK Call Mapping

### Entity Operations → Supabase Client

| Base44 SDK | Supabase JS Equivalent |
|------------|----------------------|
| `entities.X.list(sort, limit)` | `supabase.from('x').select('*').order(col, {ascending}).limit(n)` |
| `entities.X.filter(obj)` | `supabase.from('x').select('*').eq(k, v)...` |
| `entities.X.get(id)` | `supabase.from('x').select('*').eq('id', id).single()` |
| `entities.X.create(data)` | `supabase.from('x').insert(data).select().single()` |
| `entities.X.update(id, data)` | `supabase.from('x').update(data).eq('id', id).select().single()` |
| `entities.X.delete(id)` | `supabase.from('x').delete().eq('id', id)` |
| `asServiceRole.entities.X.*` | Use `supabaseAdmin` client (service_role key) |

**Sort parsing:** Base44 uses `-field_name` for descending. Map to `.order('field_name', { ascending: false })`.

### Auth → Supabase Auth

| Base44 SDK | Supabase Equivalent |
|------------|-------------------|
| `auth.me()` | `supabase.auth.getUser()` + query `users` table for role/profile |
| `auth.logout()` | `supabase.auth.signOut()` |
| `auth.redirectToLogin()` | Redirect to Supabase Auth UI or custom login page |
| `auth.updateMe(data)` | `supabase.auth.updateUser(data)` + update `users` table |
| `auth.changePassword(old, new)` | `supabase.auth.updateUser({ password })` |

### Integrations → Third-Party APIs

| Base44 SDK | Replacement |
|------------|-------------|
| `integrations.Core.InvokeLLM({prompt, ...})` | OpenAI/Anthropic API via Edge Function |
| `integrations.Core.UploadFile({file})` | `supabase.storage.from('bucket').upload(path, file)` |
| `integrations.Core.GenerateImage({...})` | OpenAI DALL-E API via Edge Function |
| `integrations.Core.SendEmail({to, subject, body})` | Resend/SendGrid via Edge Function |

### Functions → Edge Functions

| Base44 SDK | Supabase Equivalent |
|------------|-------------------|
| `functions.invoke('name', body)` | `supabase.functions.invoke('name', { body })` |

### Agents → Custom Implementation

| Base44 SDK | Replacement |
|------------|-------------|
| `agents.createConversation(opts)` | Custom `conversations` table + OpenAI API |
| `agents.getConversation(id)` | Query `conversations` table |
| `agents.addMessage(conv, msg)` | Insert to `messages` + trigger AI response |
| `agents.subscribeToConversation(id, cb)` | Supabase Realtime subscription |

---

## 5. Serverless Functions → Edge Functions

### 5.1 fetchQuestTubeType
**Purpose:** Scrape Quest Diagnostics pages for tube type info, cache in LabTestInfo
**Complexity:** High (HTML scraping, retry logic, caching)
**Migration:** Direct port to Deno Edge Function. Replace `base44.entities.LabTestInfo.*` with supabase admin client.

### 5.2 syncQuestTubeType
**Purpose:** Re-sync tube type for existing LabTestInfo record
**Complexity:** High (same scraping logic)
**Migration:** Same as fetchQuestTubeType, can share utility functions.

### 5.3 generateICD10Codes
**Purpose:** Use LLM to generate ICD-10 codes for lab tests
**Complexity:** Medium
**Migration:** Replace `base44.integrations.Core.InvokeLLM` with direct OpenAI API call. Supabase Edge Function with `OPENAI_API_KEY` env var.

### 5.4 generateInventoryReport
**Purpose:** Generate filtered inventory reports
**Complexity:** Medium (data aggregation)
**Migration:** Could be replaced with a Postgres function/view, or kept as Edge Function with supabase admin client.

### 5.5 generateRecurringReminders
**Purpose:** Create next instances of recurring reminders
**Complexity:** Medium
**Migration:** Edge Function + pg_cron for scheduling.

### 5.6 remindersNotifier
**Purpose:** Check due reminders and send email notifications
**Complexity:** High (notification preferences, email sending, recurrence)
**Migration:** Edge Function + pg_cron. Replace SendEmail with Resend/SendGrid.

### 5.7 getUserActivityMetrics
**Purpose:** Aggregate user activity data for admin dashboard
**Complexity:** Medium
**Migration:** Could be a Postgres function for better performance, or Edge Function.

### 5.8 searchNPIRegistry
**Purpose:** Search NPI Registry API for providers
**Complexity:** Medium (multiple search strategies)
**Migration:** Direct port, no Base44-specific dependencies except auth check.

### 5.9 setDefaultUserPermissions
**Purpose:** Set default page_permissions JSON for new users with 'user' role
**Complexity:** Low
**Migration:** Postgres trigger on user insert, or Edge Function.

---

## 6. AI Integrations Replacement

### 6.1 InvokeLLM (8 usages)

| Location | Purpose | Prompt Summary |
|----------|---------|---------------|
| AftercareForm.jsx | Generate aftercare instructions | Clinical aftercare content generation |
| ConsentFormForm.jsx (×3) | Generate consent form, translate, suggest improvements | Medical consent form generation |
| EducationTopicForm.jsx | Generate education content | Patient education material |
| ProcedureForm.jsx | Generate procedure details | Clinical procedure documentation |
| InventoryAI.jsx (×2) | Inventory Q&A and recommendations | Inventory analysis chatbot |
| AISuggestTemplates.jsx (×2) | Suggest form templates | Template recommendations |
| generateICD10Codes.ts | Generate ICD-10 codes | Diagnosis code lookup |

**Replacement plan:**
1. Create a Supabase Edge Function `invoke-llm` that wraps OpenAI API
2. Accept same parameters: `prompt`, `response_json_schema`, `add_context_from_internet`
3. Create a client-side helper: `invokeLLM(params)` → `supabase.functions.invoke('invoke-llm', { body: params })`
4. Model: `gpt-4o` or `gpt-4o-mini` depending on complexity

### 6.2 GenerateImage (1 usage)

| Location | Purpose |
|----------|---------|
| EducationTopicForm.jsx | Generate education topic illustration |

**Replacement:** OpenAI DALL-E 3 API via Edge Function. Upload result to Supabase Storage.

### 6.3 SendEmail (2 usages)

| Location | Purpose |
|----------|---------|
| FAQ.jsx | Email FAQ question to admin |
| remindersNotifier.ts | Send reminder notifications |

**Replacement:** Resend (recommended) or SendGrid via Edge Function. ~$0/month for low volume.

---

## 7. Auth Migration

### Current Auth Flow
1. Base44 SDK handles auth with tokens from URL params (`appParams.token`)
2. `AuthContext.jsx` checks app public settings, then calls `base44.auth.me()`
3. User entity has `role` field for RBAC
4. `usePermissions.jsx` defines hardcoded permission matrix by role

### Supabase Auth Plan
1. **Supabase Auth** for authentication (email/password, magic link, or SSO)
2. **`users` table** synced with `auth.users` via trigger
3. **RLS policies** based on `auth.uid()` and user role
4. **Custom claims** or role column for RBAC
5. Replace `AuthContext.jsx` to use `supabase.auth.getSession()` and `onAuthStateChange()`

### Migration Steps
1. Create Supabase project with auth enabled
2. Set up `users` table with trigger to sync from `auth.users`
3. Migrate existing users (email, role, permissions)
4. Replace `AuthContext.jsx` with Supabase auth context
5. Update all `base44.auth.me()` calls to use auth context
6. Implement RLS policies on all tables

---

## 8. File Storage Migration

### Current Usage
- Files uploaded via `base44.integrations.Core.UploadFile({ file })`
- Returns `{ file_url }` - stored as text fields in entities
- Used for: aftercare images/PDFs, consent form documents, education images, library documents, special images

### Supabase Storage Plan
1. Create storage buckets: `documents`, `images`, `uploads`
2. Create upload helper:
```js
async function uploadFile(file, bucket = 'uploads') {
  const path = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { file_url: publicUrl };
}
```
3. Existing file URLs (on Base44 CDN) will need migration or proxy

---

## 9. Agent Chat System

### Current Usage (AgentChat.jsx)
- `base44.agents.createConversation({ agent_name, metadata })`
- `base44.agents.getConversation(id)`
- `base44.agents.addMessage(conv, { role, content })`
- `base44.agents.subscribeToConversation(id, callback)` (real-time)
- Conversation persistence in localStorage

### Replacement Plan
1. Create `conversations` and `conversation_messages` tables
2. Edge Function `agent-chat` that:
   - Receives user message
   - Loads conversation history
   - Calls OpenAI with system prompt + context (FAQs, inventory data, reminders)
   - Inserts assistant response
3. Use Supabase Realtime for live updates:
```js
supabase.channel('conv-123')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.123` }, callback)
  .subscribe()
```

---

## 10. Printing System Analysis & Fix Plan

### Current Components

1. **PrintableDocument.jsx** - Reusable wrapper component
   - Renders with Times New Roman, letter-size styling
   - Includes CHC logo, address, contact info header/footer
   - `@media print` CSS hides everything except `.printable-document`
   - Issues: relies on `position: absolute` for print which can conflict

2. **PrintHelper.jsx** - `openPrintWindow()` utility
   - Opens new window, copies all stylesheets from parent
   - Writes `.printable-document` innerHTML
   - Calls `window.print()` after 500ms delay
   - Issues: copies ALL stylesheets (Tailwind, etc.) which bloats and can conflict

3. **EducationPrintDialog.jsx** - Most complex printing
   - Generates full HTML document with inline CSS
   - Creates hidden iframe for printing
   - Also has PDF export via jsPDF (unreliable)
   - Custom template system with saved PrintTemplate entities
   - Has schedule-print-reminder feature

4. **DocumentPrintDialog.jsx** - Library document printing
   - PDF: creates hidden iframe with PDF URL
   - Image: uses `window.print()`
   - Uses Google Docs Viewer for preview

5. **AgentChat.jsx** - Print chat responses
   - Opens new window with formatted HTML
   - Converts markdown lists to checkbox HTML

6. **InventoryAuditForm.jsx** - Print audit form
   - Has dedicated print-only HTML with inline styles
   - Uses `openPrintWindow()` from PrintHelper

### Known Issues
1. **Inconsistent approach** - Some use PrintHelper, some generate HTML, some use iframes
2. **Style bleeding** - PrintHelper copies ALL page styles into print window
3. **PDF export broken** - jsPDF `html()` method is unreliable with complex layouts
4. **Logo loading** - External logo URL may fail to load before print
5. **Print-only content** - InventoryAuditForm has `.inventory-print-only { display: none }` class that relies on screen CSS being copied
6. **No unified print service** - Each component reinvents printing

### Fix Plan
1. **Create unified PrintService:**
```js
// src/services/PrintService.js
export function printHTML(html, title = 'Print') {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>/* base print styles only */</style>
  </head><body>${html}</body></html>`);
  win.document.close();
  win.onload = () => { win.print(); win.onafterprint = () => win.close(); };
}
```
2. **Use react-to-print** or similar library for component-based printing
3. **Replace jsPDF** with server-side PDF generation (Puppeteer in Edge Function or use html2pdf.js)
4. **Preload logo** as base64 data URL to avoid load failures
5. **Standardize print templates** - all use PrintableDocument wrapper

---

## 11. Migration Phases & Effort Estimates

### Phase 1: Foundation (2-3 weeks)
| Task | Effort |
|------|--------|
| Set up Supabase project | 2h |
| Create all 26 tables + schema | 4h |
| Write RLS policies | 8h |
| Create Supabase client wrapper | 4h |
| Auth migration (AuthContext, login/logout) | 16h |
| User data migration script | 4h |
| **Subtotal** | **~38h / 1 week** |

### Phase 2: Core Data Layer (2-3 weeks)
| Task | Effort |
|------|--------|
| Create entity service layer (CRUD helpers) | 8h |
| Migrate all entity.list/filter/create/update/delete calls | 24h |
| File storage migration (UploadFile) | 8h |
| Migrate existing file URLs | 4h |
| **Subtotal** | **~44h / 1.5 weeks** |

### Phase 3: Edge Functions (1-2 weeks)
| Task | Effort |
|------|--------|
| invoke-llm Edge Function (OpenAI wrapper) | 4h |
| generate-image Edge Function | 2h |
| send-email Edge Function (Resend) | 3h |
| fetchQuestTubeType + syncQuestTubeType | 6h |
| generateICD10Codes | 2h |
| generateInventoryReport | 4h |
| remindersNotifier + generateRecurringReminders | 6h |
| getUserActivityMetrics | 3h |
| searchNPIRegistry | 3h |
| setDefaultUserPermissions (trigger) | 2h |
| **Subtotal** | **~35h / 1 week** |

### Phase 4: Agent Chat System (1 week)
| Task | Effort |
|------|--------|
| Design conversations/messages schema | 2h |
| Edge Function for AI chat | 8h |
| Realtime subscriptions | 4h |
| Migrate AgentChat component | 6h |
| **Subtotal** | **~20h / 0.5 week** |

### Phase 5: Printing System Overhaul (1 week)
| Task | Effort |
|------|--------|
| Create unified PrintService | 4h |
| Fix PrintableDocument component | 3h |
| Fix EducationPrintDialog | 4h |
| Fix DocumentPrintDialog | 2h |
| Fix InventoryAuditForm printing | 2h |
| Fix AgentChat printing | 1h |
| PDF export (server-side) | 6h |
| **Subtotal** | **~22h / 0.5 week** |

### Phase 6: Testing & Data Migration (1-2 weeks)
| Task | Effort |
|------|--------|
| Data migration scripts (all 26 tables) | 16h |
| Integration testing | 16h |
| Fix edge cases and bugs | 16h |
| User acceptance testing | 8h |
| **Subtotal** | **~56h / 1.5 weeks** |

### Total Estimated Effort
**~215 hours / 6-8 weeks** with one developer

### Priority Order
1. Auth + Users (everything depends on this)
2. ClinicLocation, PricingItem, InventoryItem (most used entities)
3. Procedures, AftercareInstructions, ConsentForms, EducationTopics (clinical content)
4. Quotes, Discounts, Specials (business)
5. Lab tests, Panels, Providers (reference data)
6. Reminders, Messages, StaffCheckIn (operational)
7. Edge Functions (AI, notifications, Quest scraping)
8. Agent chat system
9. Printing system overhaul
10. Remaining entities (FAQ, FormTemplate, etc.)

---

## Appendix: JSON Fields to Normalize

Several entities store JSON as stringified text. In Supabase, use native `jsonb`:

| Entity | Field | Should Be |
|--------|-------|-----------|
| AftercareInstruction | tags | `jsonb` array |
| ConsentForm | tags | `jsonb` array |
| LibraryDocument | tags, file_urls | `jsonb` arrays |
| LabTestInfo | panel_ids, diagnosis_codes | `jsonb` arrays |
| InventoryItem | associated_pricing_item_ids | `jsonb` array |
| PricingItem | location_ids | `jsonb` array |
| Discount | applicable_item_ids | `jsonb` array |
| Quote | items | `jsonb` array |
| User | page_permissions | `jsonb` object |
