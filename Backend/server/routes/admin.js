import express from 'express';
import { supabase } from '../supabase/client.js';
import { requireAuthSameUser } from '../security/auth.js';

// Optional: replace with your own admin check (e.g., profiles.role === 'admin')
async function requireAdmin(req, res, next) {
  const userId = req.body?.userId || req.query?.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (prof?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  return next();
}

const router = express.Router();

router.post('/rls-report', requireAuthSameUser, requireAdmin, async (_req, res) => {
  const { data: tables, error: tErr } = await supabase.from('admin_rls_tables').select('*');
  const { data: policies, error: pErr } = await supabase.from('admin_policies').select('*');

  if (tErr || pErr) return res.status(500).json({ error: tErr?.message || pErr?.message });

  // Organize per table
  const byTable = {};
  for (const t of tables || []) {
    byTable[`${t.schema}.${t.table}`] = { rls_enabled: t.rls_enabled, policies: [] };
  }
  for (const p of policies || []) {
    const key = `${p.schema}.${p.table}`;
    if (!byTable[key]) byTable[key] = { rls_enabled: null, policies: [] };
    byTable[key].policies.push({
      policyname: p.policyname,
      cmd: p.cmd,
      roles: p.roles,
      permissive: p.permissive,
      qual: p.qual,
      with_check: p.with_check
    });
  }

  return res.json(byTable);
});

export default router;
