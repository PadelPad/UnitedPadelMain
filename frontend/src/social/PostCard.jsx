import { useMemo } from 'react';
import { supabase } from '../supabaseClient.js';
import LikeButton from './LikeButton.jsx';
import RepostButton from './RepostButton.jsx';
import CommentsPanel from './CommentsPanel.jsx';

function linkifyContent(text) {
  const esc = (s)=>s.replace(/[&<>"']/g,(m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const withTags = esc(text)
    .replace(/#(\w+)/g, '<span class="up-chip hashtag-chip">#$1</span>')
    .replace(/@([\w\.\-_]+)/g, '<span class="up-chip">@$1</span>');
  return withTags;
}

export default function PostCard({ post }) {
  const isRepost = !!post.repost_id;
  const createdAt = useMemo(() => new Date(post.created_at).toLocaleString(), [post.created_at]);

  return (
    <article className="post">
      <header className="post__hdr">
        <div className="up-ring">
          <img className="up-avatar" src={post.avatar_url || 'https://placehold.co/80x80'} alt="" />
        </div>
        <div>
          <div className="post__name">
            {post.full_name || post.username || 'Player'} {isRepost && <span className="up-chip" style={{ marginLeft: 6 }}>Repost</span>}
          </div>
          <div className="post__meta">{createdAt}</div>
        </div>
        {post.elo_delta ? <span className="up-chip">+{post.elo_delta} Elo</span> : null}
      </header>

      {post.content && (
        <div className="post__content" dangerouslySetInnerHTML={{ __html: linkifyContent(post.content) }} />
      )}

      {post.media_url && (
        <div className="post__media">
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls playsInline />
          ) : (
            <img src={post.media_url} alt="" />
          )}
        </div>
      )}

      <div className="post__actions">
        <LikeButton postId={post.post_id} initialCount={post.likes_count || 0} />
        <RepostButton postId={post.post_id} count={post.reposts_count || 0} />
        <span className="action">{(post.comments_count || 0)} Comments</span>
      </div>

      <CommentsPanel postId={post.post_id} />
    </article>
  );
}
