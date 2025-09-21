import React, { useState } from 'react';
import { z } from 'zod';
import { supabase } from '../lib/supabaseClient';

const schema = z.object({
  player1: z.string().uuid('Invalid player id'),
  player2: z.string().uuid('Invalid player id'),
  set1: z.string().regex(/^\d+-\d+$/, 'Use format e.g. 6-4'),
  set2: z.string().regex(/^\d+-\d+$/, 'Use format e.g. 6-4'),
  set3: z.string().optional(),
  played_at: z.string().optional(),
  context: z.string().optional(),
});

export default function SubmitMatch() {
  const [form, setForm] = useState({
    player1: '',
    player2: '',
    set1: '',
    set2: '',
    set3: '',
    played_at: '',
    context: ''
  });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parse = schema.safeParse(form);
    if (!parse.success) {
      setStatus(parse.error.errors.map(e => e.message).join(', '));
      return;
    }
    setStatus('Submitting...');
    const { error } = await supabase
      .from('matches')
      .insert({
        set1_score: form.set1,
        set2_score: form.set2,
        set3_score: form.set3 || null,
        played_at: form.played_at || new Date().toISOString(),
        match_type: 'individual',
        match_context: form.context || null,
        status: 'pending'
      });
    if (error) {
      setStatus('Error: ' + error.message);
      return;
    }
    setStatus('Submitted! Waiting for confirmation.');
  }

  function update(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div>
      <h2>Submit Match</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Player 1 (UUID)" value={form.player1} onChange={e => update('player1', e.target.value)} />
        <input placeholder="Player 2 (UUID)" value={form.player2} onChange={e => update('player2', e.target.value)} />
        <input placeholder="Set 1 (e.g. 6-4)" value={form.set1} onChange={e => update('set1', e.target.value)} />
        <input placeholder="Set 2 (e.g. 7-5)" value={form.set2} onChange={e => update('set2', e.target.value)} />
        <input placeholder="Set 3 (optional)" value={form.set3} onChange={e => update('set3', e.target.value)} />
        <input placeholder="Played at ISO (optional)" value={form.played_at} onChange={e => update('played_at', e.target.value)} />
        <input placeholder="Context (e.g. friendly, ranked)" value={form.context} onChange={e => update('context', e.target.value)} />
        <button type="submit">Submit</button>
      </form>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
