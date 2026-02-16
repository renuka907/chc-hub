#!/bin/bash
cd /Users/rosiejoy/.openclaw/workspace/apps/chc-hub

# Files to process (everything that imports base44Client except the client itself and already-migrated files)
FILES=$(grep -rl "base44Client\|from '@base44" src/ --include="*.jsx" --include="*.js" | grep -v base44Client.js | grep -v AuthContext.jsx | grep -v NavigationTracker.jsx | grep -v PageNotFound.jsx | grep -v app-params.js | grep -v supabase)

for f in $FILES; do
  echo "Processing: $f"
  
  # Step 1: Replace the import statement
  # Various import patterns for base44
  sed -i '' 's|import { base44 } from "@/api/base44Client";|import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";\nimport { supabase } from "@/api/supabaseClient";\nimport { useAuth } from "@/lib/AuthContext";|g' "$f"
  sed -i '' "s|import { base44 } from '@/api/base44Client';|import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from '@/api/supabaseHelpers';\nimport { supabase } from '@/api/supabaseClient';\nimport { useAuth } from '@/lib/AuthContext';|g" "$f"
  
  # Also handle cases where createAxiosClient or other base44 imports exist
  sed -i '' "s|import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';||g" "$f"
  
  # Step 2: Replace entity operations
  # base44.entities.EntityName.list() → entities.EntityName.list()
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.list|entities.\1.list|g' "$f"
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.filter|entities.\1.filter|g' "$f"
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.create|entities.\1.create|g' "$f"
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.update|entities.\1.update|g' "$f"
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.delete|entities.\1.delete|g' "$f"
  sed -i '' 's|base44\.entities\.\([A-Za-z]*\)\.get|entities.\1.get|g' "$f"
  
  # Handle dynamic entity access: base44.entities[entityName] → entities[entityName]
  sed -i '' 's|base44\.entities\[|entities[|g' "$f"
  
  # Step 3: Replace asServiceRole entity calls (same as regular since we use anon key with RLS)
  sed -i '' 's|base44\.asServiceRole\.entities\.\([A-Za-z]*\)\.list|entities.\1.list|g' "$f"
  sed -i '' 's|base44\.asServiceRole\.entities\.\([A-Za-z]*\)\.filter|entities.\1.filter|g' "$f"
  
  # Step 4: Replace integration calls
  sed -i '' 's|base44\.integrations\.Core\.InvokeLLM|invokeLLM|g' "$f"
  sed -i '' 's|base44\.integrations\.Core\.UploadFile|uploadFile|g' "$f"
  sed -i '' 's|base44\.integrations\.Core\.GenerateImage|generateImage|g' "$f"
  sed -i '' 's|base44\.integrations\.Core\.SendEmail|sendEmail|g' "$f"
  
  # Step 5: Replace function invocations
  # base44.functions.invoke('name', data) → supabase.functions.invoke('name', { body: data })
  # This is complex - for now just stub them inline
  sed -i '' "s|base44\.functions\.invoke('\([^']*\)', \([^)]*\))|/* TODO: Implement \1 as Supabase Edge Function */ Promise.resolve({ data: null })|g" "$f"
  sed -i '' 's|base44\.functions\.invoke("\([^"]*\)", \([^)]*\))|/* TODO: Implement \1 as Supabase Edge Function */ Promise.resolve({ data: null })|g' "$f"
  
  # Step 6: Replace agent calls
  sed -i '' 's|base44\.agents\.createConversation|agentChat.createConversation|g' "$f"
  sed -i '' 's|base44\.agents\.getConversation|agentChat.getConversation|g' "$f"
  sed -i '' 's|base44\.agents\.addMessage|agentChat.addMessage|g' "$f"
  sed -i '' 's|base44\.agents\.subscribeToConversation|agentChat.subscribeToConversation|g' "$f"
  
  # Step 7: Replace auth calls
  # base44.auth.me() needs special handling per file - we'll do specific fixes after
  sed -i '' 's|base44\.auth\.logout()|logout()|g' "$f"
  sed -i '' 's|base44\.auth\.logout|logout|g' "$f"
  sed -i '' 's|base44\.auth\.redirectToLogin()|navigateToLogin()|g' "$f"
  sed -i '' 's|base44\.auth\.redirectToLogin|navigateToLogin|g' "$f"
  
  # Step 8: Replace appLogs
  sed -i '' 's|base44\.appLogs\.logUserInApp|logUserActivity|g' "$f"
  
  # Step 9: Replace sort field names (created_date → created_at, updated_date → updated_at)
  sed -i '' "s|'-updated_date'|'-updated_at'|g" "$f"
  sed -i '' "s|'-created_date'|'-created_at'|g" "$f"
  sed -i '' "s|'updated_date'|'updated_at'|g" "$f"
  sed -i '' "s|'created_date'|'created_at'|g" "$f"
  sed -i '' 's|"-updated_date"|"-updated_at"|g' "$f"
  sed -i '' 's|"-created_date"|"-created_at"|g' "$f"
  
  # Step 10: Fix UploadFile call pattern - base44 used ({ file }) but our helper uses (file)
  # base44.integrations.Core.UploadFile({ file }) → uploadFile(file)
  sed -i '' 's|uploadFile({ file })|uploadFile(file)|g' "$f"
  sed -i '' 's|uploadFile({ file: \([^}]*\) })|uploadFile(\1)|g' "$f"
  
done

echo "Bulk sed replacements complete"
