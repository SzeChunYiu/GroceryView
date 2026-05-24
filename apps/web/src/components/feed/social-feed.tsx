'use client';

import { useEffect, useMemo, useState } from 'react';
import { socialFeedPosts } from '@/lib/social';
import type { FormEvent } from 'react';
import type { SocialComment } from '@/lib/social';

function groupComments(comments: SocialComment[]) {
  return comments.reduce<Record<string, SocialComment[]>>((groups, comment) => {
    groups[comment.postId] = [...(groups[comment.postId] ?? []), comment];
    return groups;
  }, {});
}

export function SocialFeed() {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [draftByPost, setDraftByPost] = useState<Record<string, string>>({});
  const [replyToByPost, setReplyToByPost] = useState<Record<string, SocialComment | undefined>>({});
  const [status, setStatus] = useState('Comments support replies and @mentions.');
  const commentsByPost = useMemo(() => groupComments(comments), [comments]);

  useEffect(() => {
    fetch('/api/social/comments')
      .then((response) => response.json())
      .then((payload: { comments?: SocialComment[] }) => setComments(payload.comments ?? []))
      .catch(() => setStatus('Comments are temporarily unavailable.'));
  }, []);

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const draft = draftByPost[postId]?.trim();
    if (!draft) return;

    const response = await fetch('/api/social/comments', {
      body: JSON.stringify({ body: draft, parentId: replyToByPost[postId]?.id, postId }),
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    });
    const payload = await response.json() as { comment?: SocialComment; error?: string };

    if (!response.ok || !payload.comment) {
      setStatus(payload.error ?? 'Unable to save comment.');
      return;
    }

    const savedComment = payload.comment;
    setComments((current) => [...current, savedComment]);
    setDraftByPost((current) => ({ ...current, [postId]: '' }));
    setReplyToByPost((current) => ({ ...current, [postId]: undefined }));
    setStatus(savedComment.mentions.length > 0
      ? `Reply saved and mentioned ${savedComment.mentions.map((mention) => `@${mention}`).join(', ')}.`
      : 'Reply saved.');
  }

  return (
    <section className="space-y-4" aria-label="Public social feed">
      <p aria-live="polite" className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950" role="status">{status}</p>
      {socialFeedPosts.map((post) => {
        const postComments = commentsByPost[post.id] ?? [];
        const replyTarget = replyToByPost[post.id];

        return (
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm" key={post.id}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{post.author}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{post.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{post.body}</p>

            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-black text-slate-950">Comment thread</h3>
              {postComments.map((comment) => (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700" key={comment.id}>
                  <p className="font-black text-slate-950">{comment.author}</p>
                  {comment.parentId ? <p className="text-xs font-bold text-slate-500">Reply in thread</p> : null}
                  <p className="mt-1">{comment.body}</p>
                  {comment.mentions.length > 0 ? (
                    <p className="mt-1 text-xs font-bold text-emerald-800">Mentions: {comment.mentions.map((mention) => `@${mention}`).join(', ')}</p>
                  ) : null}
                  <button
                    className="mt-2 text-xs font-black text-emerald-800 underline"
                    onClick={() => setReplyToByPost((current) => ({ ...current, [post.id]: comment }))}
                    type="button"
                  >
                    Reply
                  </button>
                </div>
              ))}
            </div>

            <form className="mt-4 space-y-2" onSubmit={(event) => submitComment(event, post.id)}>
              {replyTarget ? <p className="text-xs font-bold text-slate-600">Replying to {replyTarget.author}</p> : null}
              <label className="block text-sm font-black text-slate-700" htmlFor={`${post.id}-comment`}>Add a reply or @mention</label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-700"
                id={`${post.id}-comment`}
                maxLength={280}
                onChange={(event) => setDraftByPost((current) => ({ ...current, [post.id]: event.target.value }))}
                placeholder="Share a substitution, brand note, stock update, or @mention"
                value={draftByPost[post.id] ?? ''}
              />
              <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" type="submit">Post comment</button>
            </form>
          </article>
        );
      })}
    </section>
  );
}
