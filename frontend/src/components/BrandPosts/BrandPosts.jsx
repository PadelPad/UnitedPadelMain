import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const BrandPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('brand_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Brand posts error:', error);
      else setPosts(data);
    };

    fetchPosts();
  }, []);

  return (
    <div className="p-4 bg-white border rounded shadow">
      <h3 className="text-lg font-bold text-orange-500 mb-3">📢 Brand Announcements</h3>
      {posts.map((post) => (
        <div key={post.id} className="mb-4 border-b pb-2">
          <h4 className="font-semibold text-orange-700">{post.title}</h4>
          <p className="text-sm">{post.content}</p>
          <p className="text-xs text-gray-500">Posted on: {new Date(post.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default BrandPosts;