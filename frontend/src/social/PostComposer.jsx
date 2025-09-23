import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient.js';

export default function PostComposer({ onPosted }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const onFile = (e) => setFile(e.target.files?.[0] || null);

  async function submit() {
    if (!content.trim() && !file) {
      toast.error('Add some text or media');
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { data: post, error: perr } = await supabase
        .from('posts')
        .insert({ author_id: user.id, content })
        .select('*').single();
      if (perr) throw perr;

      if (file) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isVideo = file.type.startsWith('video/');
        const path = `${user.id}/${post.id}.${ext || (isVideo ? 'mp4' : 'jpg')}`;
        const { error: uerr } = await supabase.storage.from('post-media').upload(path, file, { upsert: true });
        if (uerr) throw uerr;

        const { data: pub } = supabase.storage.from('post-media').getPublicUrl(path);
        const { error: merr } = await supabase
          .from('post_media')
          .insert({ post_id: post.id, url: pub.publicUrl, type: isVideo ? 'video' : 'image' });
        if (merr) throw merr;
      }

      setContent('');
      setFile(null);
      toast.success('Posted!');
      onPosted?.();
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <textarea
        className="up-textarea"
        rows={2}
        placeholder="Share something… #hashtag  @mention"
        value={content}
        onChange={(e)=>setContent(e.target.value)}
        style={{ resize: 'vertical' }}
      />
      <div className="inline-actions">
        <button className="file-pill" type="button" onClick={()=>fileRef.current?.click()}>
          📎 Choose File
        </button>
        {file && (
          <span className="up-chip" title={file.name} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
        )}
        <button className="up-btn" onClick={submit} disabled={busy}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
    </>
  );
}
