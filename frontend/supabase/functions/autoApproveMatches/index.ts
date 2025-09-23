// supabase/functions/autoApproveMatches/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: pendingMatches, error } = await supabaseClient
    .from('matches')
    .select('id, submitted_by, played_at, match_level, status, match_confirmations(id, approved, user_id)')
    .eq('match_level', 'friendly')
    .eq('status', 'pending')

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  const now = new Date()

  for (const match of pendingMatches || []) {
    const matchTime = new Date(match.played_at)
    const diffHours = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60)

    if (diffHours >= 48) {
      // Auto-approve this match
      await supabaseClient.from('matches').update({ status: 'approved' }).eq('id', match.id)

      // Update confirmations
      await supabaseClient
        .from('match_confirmations')
        .update({ approved: true })
        .eq('match_id', match.id)

      // Optional: Send final notification
      for (const conf of match.match_confirmations || []) {
        await supabaseClient.from('notifications').insert({
          user_id: conf.user_id,
          type: 'match_auto_approved',
          title: '✅ Match Auto-Approved',
          message: `A match you were in was automatically approved after 48 hours.`,
          is_read: false,
          metadata: { match_id: match.id }
        })
      }
    }
  }

  return new Response(JSON.stringify({ success: true }))
})
