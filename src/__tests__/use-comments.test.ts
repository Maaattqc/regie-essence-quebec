import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mocks = vi.hoisted(() => {
  const getSession = vi.fn();
  const on = vi.fn().mockReturnThis();
  const subscribe = vi.fn().mockReturnThis();
  const removeChannel = vi.fn();
  const channel = vi.fn(() => ({ on, subscribe }));

  return {
    createBrowserClient: vi.fn(() => ({
      auth: { getSession },
      channel,
      removeChannel,
    })),
    getSession,
    channel,
    on,
    subscribe,
    removeChannel,
    fetchMock: vi.fn(),
  };
});

vi.mock("@/lib/auth", () => ({
  createBrowserClient: mocks.createBrowserClient,
}));

/* ------------------------------------------------------------------ */
/*  Import du hook APRÈS le mock                                       */
/* ------------------------------------------------------------------ */

import { useComments } from "@/hooks/useComments";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATION = "Shell Montréal";
const ADDRESS = "123 rue Test";

const fakeComments = [
  { id: 1, content: "Super!", parent_id: null, likes: 3, dislikes: 0, created_at: "2026-01-01", author: "Alice", user_id: "u1", my_vote: 0 },
  { id: 2, content: "Correct", parent_id: null, likes: 1, dislikes: 1, created_at: "2026-01-02", author: "Bob", user_id: "u2", my_vote: 0 },
];

function mockSessionWithToken(token: string | null) {
  mocks.getSession.mockResolvedValue({
    data: { session: token ? { access_token: token } : null },
  });
}

function mockFetchJson(data: unknown, ok = true) {
  mocks.fetchMock.mockResolvedValueOnce({
    ok,
    json: async () => data,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("useComments", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mocks.fetchMock);
    mocks.fetchMock.mockReset();
    mocks.getSession.mockReset();
    mocks.channel.mockClear();
    mocks.on.mockClear().mockReturnThis();
    mocks.subscribe.mockClear().mockReturnThis();
    mocks.removeChannel.mockClear();

    // Par défaut : utilisateur authentifié
    mockSessionWithToken("tok-123");
  });

  it("charge les commentaires au montage", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual(fakeComments);
    expect(mocks.fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/reviews?station="),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok-123" }) }),
    );
  });

  it("retourne loading=true puis false après fetch", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));

    // Initialement loading est true
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("submitComment envoie un POST et recharge", async () => {
    // Premier fetch : chargement initial
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // POST submitComment
    mockFetchJson({ ok: true }, true);
    // Rechargement après POST (loadComments)
    mockFetchJson([...fakeComments, { id: 3, content: "Nouveau", parent_id: null, likes: 0, dislikes: 0, created_at: "2026-01-03", author: "Claire", user_id: "u3", my_vote: 0 }]);

    let success!: boolean;
    await act(async () => {
      success = await result.current.submitComment("Nouveau", null);
    });

    expect(success).toBe(true);
    // Le POST doit avoir été appelé avec les bonnes données
    const postCall = mocks.fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse(postCall![1].body as string);
    expect(body).toMatchObject({ station_name: STATION, address: ADDRESS, content: "Nouveau", parent_id: null });
  });

  it("handleVote fait un update optimiste (likes +1)", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Vote +1 sur le commentaire id=1 (my_vote=0 → 1)
    mockFetchJson({ ok: true }, true);

    await act(async () => {
      await result.current.handleVote(1, 1);
    });

    const updated = result.current.comments.find((c) => c.id === 1);
    expect(updated?.likes).toBe(4); // 3 + 1
    expect(updated?.my_vote).toBe(1);
  });

  it("handleVote annule un vote existant (likes -1)", async () => {
    const commentsWithVote = [
      { ...fakeComments[0], my_vote: 1 }, // déjà voté +1
      fakeComments[1],
    ];
    mockFetchJson(commentsWithVote);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Re-voter +1 annule le vote
    mockFetchJson({ ok: true }, true);

    await act(async () => {
      await result.current.handleVote(1, 1);
    });

    const updated = result.current.comments.find((c) => c.id === 1);
    expect(updated?.likes).toBe(2); // 3 - 1
    expect(updated?.my_vote).toBe(0);
  });

  it("handleDelete envoie un DELETE avec token", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // DELETE réponse
    mockFetchJson({}, true);
    // Rechargement après suppression
    mockFetchJson([fakeComments[1]]);

    await act(async () => {
      await result.current.handleDelete(1);
    });

    const deleteCall = mocks.fetchMock.mock.calls.find(
      (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall![1].headers).toMatchObject({ Authorization: "Bearer tok-123" });
    const body = JSON.parse(deleteCall![1].body as string);
    expect(body).toMatchObject({ comment_id: 1 });
  });

  it("retourne error quand submitComment échoue", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // POST échoue
    mockFetchJson({ error: "Commentaire trop court" }, false);

    let success!: boolean;
    await act(async () => {
      success = await result.current.submitComment("X", null);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Commentaire trop court");
  });

  it("génère un anonymous_id si pas de token", async () => {
    mockSessionWithToken(null);

    const fakeUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    vi.stubGlobal("crypto", { randomUUID: () => fakeUuid });

    mockFetchJson(fakeComments);

    renderHook(() => useComments(STATION, ADDRESS));

    await waitFor(() => {
      expect(mocks.fetchMock).toHaveBeenCalled();
    });

    // L'URL doit contenir le anonymous_id
    const fetchUrl = mocks.fetchMock.mock.calls[0][0] as string;
    expect(fetchUrl).toContain(`anonymous_id=${encodeURIComponent(fakeUuid)}`);

    // localStorage doit avoir été mis à jour
    expect(localStorage.getItem("anonymous_comment_id")).toBe(fakeUuid);
  });

  it("submitComment retourne false et met error quand le POST échoue sans message", async () => {
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // POST échoue sans message d'erreur spécifique
    mockFetchJson({}, false);

    let success!: boolean;
    await act(async () => {
      success = await result.current.submitComment("Test", null);
    });

    expect(success).toBe(false);
    // Quand data.error est undefined, le fallback "Erreur" est utilisé
    expect(result.current.error).toBe("Erreur");
  });

  it("handleDelete ne fait rien sans token", async () => {
    mockSessionWithToken(null);
    mockFetchJson(fakeComments);

    const { result } = renderHook(() => useComments(STATION, ADDRESS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCountBefore = mocks.fetchMock.mock.calls.length;

    await act(async () => {
      await result.current.handleDelete(1);
    });

    // Aucun nouveau fetch (DELETE) n'est fait
    const deleteCall = mocks.fetchMock.mock.calls.slice(callCountBefore).find(
      (c) => (c[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(deleteCall).toBeUndefined();
  });
});
