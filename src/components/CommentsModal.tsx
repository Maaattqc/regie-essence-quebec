"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/auth";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useComments } from "@/hooks/useComments";
import { X, ThumbsUp, ThumbsDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

const CommentItem = memo(function CommentItem({ c, replies, allComments, onVote, onSubmitReply, isAdmin, onDelete }: {
  c: Comment;
  replies: Comment[];
  allComments: Comment[];
  onVote: (id: number, vote: number) => void;
  onSubmitReply: (parentId: number, content: string) => Promise<boolean>;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}) {
  const { t } = useLanguage();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function timeAgo(d: string) {
    const diff = new Date().getTime() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t.comments.minutesAgo(mins);
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t.comments.hoursAgo(hrs);
    return t.comments.daysAgo(Math.floor(hrs / 24));
  }

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
              aria-label={c.likes > 0 ? t.comments.likes(c.likes) : t.comments.likes(0)}
            >
              <ThumbsUp className="size-3.5" /> {c.likes > 0 && c.likes}
            </button>
            <button
              onClick={() => onVote(c.id, -1)}
              className={`bg-transparent border-none cursor-pointer flex items-center gap-1 p-0 ${c.my_vote === -1 ? "text-[#e63946]" : "text-muted-foreground"}`}
              aria-label={c.dislikes > 0 ? t.comments.dislikes(c.dislikes) : t.comments.dislikes(0)}
            >
              <ThumbsDown className="size-3.5" /> {c.dislikes > 0 && c.dislikes}
            </button>
            <button
              onClick={() => setShowReply(!showReply)}
              className="bg-transparent border-none cursor-pointer text-muted-foreground p-0 font-semibold text-xs"
            >
              {t.comments.reply}
            </button>
            {isAdmin && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-transparent border-none cursor-pointer text-[#e63946] p-0 font-semibold text-xs"
              >
                {t.comments.delete}
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
                  <span className="font-semibold">{t.comments.confirmDelete}</span>
                  <button
                    onClick={() => { onDelete?.(c.id); setConfirmDelete(false); }}
                    className="bg-[#e63946] text-white border-none rounded px-2 py-0.5 cursor-pointer font-semibold text-xs"
                  >
                    {t.comments.yes}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="bg-transparent border border-[var(--divider)] rounded px-2 py-0.5 cursor-pointer font-semibold text-xs text-[var(--text)]"
                  >
                    {t.comments.no}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showReply && (
            <div className="flex gap-1.5 mt-1.5">
              <Input
                placeholder={t.comments.replyTo(c.author)}
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
                {t.comments.cancel}
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
});

export default function CommentsModal({ stationName, address, onClose, userEmail }: {
  stationName: string;
  address: string;
  onClose: () => void;
  userEmail?: string;
}) {
  const { t } = useLanguage();
  const trapRef = useFocusTrap();
  const { comments, loading, error, setError, submitComment, handleVote, handleDelete } = useComments(stationName, address);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setError("");
    setSending(true);
    const ok = await submitComment(newComment, null);
    if (ok) setNewComment("");
    setSending(false);
  }, [newComment, submitComment, setError]);

  const handleReply = useCallback(async (parentId: number, content: string): Promise<boolean> => {
    return submitComment(content, parentId);
  }, [submitComment]);

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (id: number) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="report-overlay" onClick={onClose} role="presentation">
      <div
        ref={trapRef}
        className="report-modal max-w-[30rem] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-modal-title"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h2 id="comments-modal-title" className="text-[1.0625rem] font-bold m-0">{t.comments.title(stationName)}</h2>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Fermer"><X className="size-4" /></button>
        </div>
        <div className="text-xs text-muted-foreground mb-3">{t.comments.count(comments.length)}</div>

        <form onSubmit={handleSubmit} className="shrink-0 mb-3">
          <div className="flex gap-1.5">
            <Input
              placeholder={t.comments.placeholder}
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
            <p className="text-muted-foreground text-[0.8125rem]">{t.comments.empty}</p>
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
