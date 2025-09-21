// server/controllers/postsController.js
import { supabase } from '../supabase/client.js';

/**
 * POST /api/posts
 * Body: { content, visibility?, media?: [{ url, type, width?, height?, duration_seconds? }] }
 */
export const createPost = async (req, res) => {
  try {
    const authorId = req.user.id;
    const { content, visibility = 'public', media = [] } = req.body;

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .insert([{ author_id: authorId, content, visibility }])
      .select()
      .single();
    if (postErr) throw postErr;

    if (Array.isArray(media) && media.length > 0) {
      const rows = media.map((m) => ({
        post_id: post.id,
        url: m.url,
        type: m.type,
        width: m.width ?? null,
        height: m.height ?? null,
        duration_seconds: m.duration_seconds ?? null,
      }));
      const { error: mediaErr } = await supabase.from('post_media').insert(rows);
      if (mediaErr) throw mediaErr;
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/posts/:id/like
 */
export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const { data, error } = await supabase
      .from('post_likes')
      .upsert(
        { post_id: postId, user_id: userId },
        { onConflict: ['post_id', 'user_id'] }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, like: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/posts/:id/like
 */
export const unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/posts/:id/repost
 */
export const repostPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const { data, error } = await supabase
      .from('post_reposts')
      .upsert(
        { post_id: postId, user_id: userId },
        { onConflict: ['post_id', 'user_id'] }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, repost: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/posts/:id/hashtags
 * Body: { hashtagId }
 */
export const addHashtag = async (req, res) => {
  try {
    const postId = req.params.id;
    const { hashtagId } = req.body;
    if (!hashtagId) return res.status(400).json({ error: 'Missing hashtagId' });

    const { data, error } = await supabase
      .from('post_hashtags')
      .upsert(
        { post_id: postId, hashtag_id: hashtagId },
        { onConflict: ['post_id', 'hashtag_id'] }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, link: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/posts/:id/comments
 * Body: { body, parent_id? }
 */
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { body, parent_id = null } = req.body;
    if (!body) return res.status(400).json({ error: 'Missing comment body' });

    const { data, error } = await supabase
      .from('post_comments')
      .insert([{ post_id: postId, user_id: userId, body, parent_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    // RLS should enforce ownership; we also filter by user_id here
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
