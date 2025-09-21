// supabase/functions/autoApproveMatches/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Runs on a Supabase schedule (see cron.json).
// Auto-approves friendly matches pending for >= 48 hours.

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const cutoffIso = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id')
    .eq('match_level', 'friendly')
    .eq('status', 'pending')
    .lte('played_at', cutoffIso);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processed = 0;

  for (const m of matches ?? []) {
    const { error: u1 } = await supabase
      .from('matches')
      .update({ status: 'approved' })
      .eq('id', m.id);

    if (!u1) {
      await supabase.from('match_confirmations').update({ approved: true }).eq('match_id', m.id);
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'match_auto_approved',
        title: '✅ Match Auto-Approved',
        message: 'A match you were in was automatically approved after 48 hours.',
        is_read: false,
        metadata: { match_id: m.id }
      });
      processed += 1;
    }
  }

  return new Response(JSON.stringify({ success: true, processed }), { status: 200 });
});
