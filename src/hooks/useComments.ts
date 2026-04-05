import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/auth";
import type { Comment } from "@/components/CommentsModal";

function getAnonymousId() {
  let id = localStorage.getItem("anonymous_comment_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("anonymous_comment_id", id); }
  return id;
}

async function getToken() {
  const { data: { session } } = await createBrowserClient().auth.getSession();
  return session?.access_token || null;
}

export function useComments(stationName: string, address: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const anonParam = !token ? `&anonymous_id=${encodeURIComponent(getAnonymousId())}` : "";
    const res = await fetch(`/api/reviews?station=${encodeURIComponent(stationName)}&address=${encodeURIComponent(address)}${anonParam}`, { headers });
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [stationName, address]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const anonParam = !token ? `&anonymous_id=${encodeURIComponent(getAnonymousId())}` : "";
      const res = await fetch(`/api/reviews?station=${encodeURIComponent(stationName)}&address=${encodeURIComponent(address)}${anonParam}`, { headers });
      if (cancelled) return;
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
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
        () => { loadComments(); }
      )
      .subscribe();
    return () => { cancelled = true; createBrowserClient().removeChannel(channel); };
  }, [stationName, address, loadComments]);

  const submitComment = useCallback(async (content: string, parentId: number | null): Promise<boolean> => {
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
  }, [stationName, address, loadComments]);

  const handleVote = useCallback(async (commentId: number, vote: number) => {
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
  }, []);

  const handleDelete = useCallback(async (commentId: number) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comment_id: commentId }),
    });
    if (res.ok) loadComments();
  }, [loadComments]);

  return { comments, loading, error, setError, submitComment, handleVote, handleDelete };
}
