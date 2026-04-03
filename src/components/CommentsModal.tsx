"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/auth";

export interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  likes: number;
  dislikes: number;
  created_at: string;
  author: string;
  user_id: string;
  my_vote: number;
}


function CommentItem({ c, replies, allComments, onVote, onSubmitReply, isAdmin, onDelete }: {
  c: Comment;
  replies: Comment[];
  allComments: Comment[];
  onVote: (id: number, vote: number) => void;
  onSubmitReply: (parentId: number, content: string) => Promise<boolean>;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const timeAgo = (d: string) => {
    const diff = new Date().getTime() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)}j`;
  };

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    const ok = await onSubmitReply(c.id, replyText);
    if (ok) { setReplyText(""); setShowReply(false); }
    setSending(false);
  }

  return (
    <div className="py-2">
      <div className="flex gap-2 items-start">
        <div className="size-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-bold shrink-0 text-[var(--text-secondary)]">
          {c.author[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xs">
            <strong>{c.author}</strong>
            <span className="text-muted-foreground ml-1.5">{timeAgo(c.created_at)}</span>
          </div>
          <p className="text-[0.8125rem] mt-1 mb-1.5 leading-snug text-[var(--text)]">{c.content}</p>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => onVote(c.id, 1)}
              className={`bg-transparent border-none cursor-pointer flex items-center gap-1 p-0 ${c.my_vote === 1 ? "text-[#0ea5e9]" : "text-muted-foreground"}`}
            >
              &#128077; {c.likes > 0 && c.likes}
            </button>
            <button
              onClick={() => onVote(c.id, -1)}
              className={`bg-transparent border-none cursor-pointer flex items-center gap-1 p-0 ${c.my_vote === -1 ? "text-[#e63946]" : "text-muted-foreground"}`}
            >
              &#128078; {c.dislikes > 0 && c.dislikes}
            </button>
            <button
              onClick={() => setShowReply(!showReply)}
              className="bg-transparent border-none cursor-pointer text-muted-foreground p-0 font-semibold text-xs"
            >
              Répondre
            </button>
            {isAdmin && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-transparent border-none cursor-pointer text-[#e63946] p-0 font-semibold text-xs"
              >
                Supprimer
              </button>
            )}
          </div>

          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mt-1.5 p-2 rounded-md bg-[var(--bg-hover)] text-xs">
                  <span className="font-semibold">Supprimer ce commentaire ?</span>
                  <button
                    onClick={() => { onDelete!(c.id); setConfirmDelete(false); }}
                    className="bg-[#e63946] text-white border-none rounded px-2 py-0.5 cursor-pointer font-semibold text-xs"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="bg-transparent border border-[var(--divider)] rounded px-2 py-0.5 cursor-pointer font-semibold text-xs text-[var(--text)]"
                  >
                    Non
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showReply && (
            <div className="flex gap-1.5 mt-1.5">
              <Input
                placeholder={`Répondre à ${c.author}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                className="flex-1 text-xs"
                autoFocus
              />
              <Button size="sm" onClick={handleReply} disabled={sending || !replyText.trim()}>
                {sending ? "..." : "Publier"}
              </Button>
              <button
                onClick={() => { setShowReply(false); setReplyText(""); }}
                className="bg-transparent border-none cursor-pointer text-muted-foreground text-xs p-0"
              >
                Annuler
              </button>
            </div>
          )}
          {replies.length > 0 && (
            <div className="ml-2 border-l-2 border-[var(--divider)] pl-3 mt-1.5">
              {replies.map((r) => (
                <CommentItem key={r.id} c={r} replies={allComments.filter((x) => x.parent_id === r.id)} allComments={allComments} onVote={onVote} onSubmitReply={onSubmitReply} isAdmin={isAdmin} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsModal({ stationName, address, onClose, userEmail }: {
  stationName: string;
  address: string;
  onClose: () => void;
  userEmail?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userEmail) return;
    const sb = createBrowserClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      sb.from("profiles").select("role").eq("id", session.user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === "admin");
      });
    });
  }, [userEmail]);

  async function getToken() {
    const { data: { session } } = await createBrowserClient().auth.getSession();
    return session?.access_token || null;
  }

  async function loadComments() {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const anonParam = !token ? `&anonymous_id=${encodeURIComponent(getAnonymousId())}` : "";
    const res = await fetch(`/api/reviews?station=${encodeURIComponent(stationName)}&address=${encodeURIComponent(address)}${anonParam}`, { headers });
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    const channel = createBrowserClient()
      .channel(`comments-${stationName}-${address}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `station_name=eq.${stationName}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();
    return () => {
      createBrowserClient().removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationName, address]);

  function getAnonymousId() {
    let id = localStorage.getItem("anonymous_comment_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("anonymous_comment_id", id); }
    return id;
  }

  async function submitComment(content: string, parentId: number | null): Promise<boolean> {
    const token = await getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const payload: Record<string, unknown> = { station_name: stationName, address, content, parent_id: parentId };
    if (!token) payload.anonymous_id = getAnonymousId();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) { loadComments(); return true; }
    const d = await res.json();
    setError(d.error || "Erreur");
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setError("");
    setSending(true);
    const ok = await submitComment(newComment, null);
    if (ok) setNewComment("");
    setSending(false);
  }

  async function handleReply(parentId: number, content: string): Promise<boolean> {
    return submitComment(content, parentId);
  }

  async function handleVote(commentId: number, vote: number) {
    const token = await getToken();
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      const wasVote = c.my_vote;
      if (wasVote === vote) {
        return { ...c, my_vote: 0, likes: c.likes - (vote === 1 ? 1 : 0), dislikes: c.dislikes - (vote === -1 ? 1 : 0) };
      }
      return {
        ...c,
        my_vote: vote,
        likes: c.likes + (vote === 1 ? 1 : 0) - (wasVote === 1 ? 1 : 0),
        dislikes: c.dislikes + (vote === -1 ? 1 : 0) - (wasVote === -1 ? 1 : 0),
      };
    }));
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch("/api/reviews", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "vote", comment_id: commentId, vote, anonymous_id: token ? undefined : getAnonymousId() }),
    });
  }

  async function handleDelete(commentId: number) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comment_id: commentId }),
    });
    if (res.ok) loadComments();
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (id: number) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="report-overlay" onClick={onClose}>
      <div
        className="report-modal max-w-[30rem] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h2 className="text-[1.0625rem] font-bold m-0">Commentaires — {stationName}</h2>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>
        <div className="text-xs text-muted-foreground mb-3">{comments.length} commentaire{comments.length !== 1 ? "s" : ""}</div>

        <form onSubmit={handleSubmit} className="shrink-0 mb-3">
          <div className="flex gap-1.5">
            <Input
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={sending || !newComment.trim()}>
              {sending ? "..." : "Publier"}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </form>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <Spinner />
          ) : topLevel.length === 0 ? (
            <p className="text-muted-foreground text-[0.8125rem]">Aucun commentaire. Soyez le premier !</p>
          ) : (
            topLevel.map((c) => (
              <CommentItem key={c.id} c={c} replies={getReplies(c.id)} allComments={comments} onVote={handleVote} onSubmitReply={handleReply} isAdmin={isAdmin} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
