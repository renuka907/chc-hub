import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normalize(str) {
  return (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}
function digits(str) {
  return (str || '').toString().replace(/\D+/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch referrals (batch if needed)
    const BATCH_LIMIT = 1000;
    let all = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.Referral.list('-updated_date', BATCH_LIMIT, skip);
      all = all.concat(batch || []);
      if (!batch || batch.length < BATCH_LIMIT) break;
      skip += BATCH_LIMIT;
    }

    const groups = new Map();
    for (const r of all) {
      const key = `${normalize(r.doctor_name)}|${normalize(r.office_name)}|${digits(r.phone)}`;
      const arr = groups.get(key) || [];
      arr.push(r);
      groups.set(key, arr);
    }

    const toDelete = [];
    const kept = [];
    let groupsAffected = 0;

    for (const arr of groups.values()) {
      if (arr.length > 1) {
        groupsAffected += 1;
        arr.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
        kept.push(arr[0].id);
        for (let i = 1; i < arr.length; i++) {
          toDelete.push(arr[i].id);
        }
      }
    }

    for (const id of toDelete) {
      await base44.asServiceRole.entities.Referral.delete(id);
    }

    return Response.json({
      success: true,
      total: all.length,
      deleted: toDelete.length,
      kept_count: kept.length,
      groupsAffected,
      message: `Deleted ${toDelete.length} duplicates across ${groupsAffected} groups.`
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});