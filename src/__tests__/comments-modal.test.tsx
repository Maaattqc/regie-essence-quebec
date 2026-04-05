import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Comment } from "@/components/CommentsModal";

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  submitComment: vi.fn(),
  handleVote: vi.fn(),
  handleDelete: vi.fn(),
  setError: vi.fn(),
  getSession: vi.fn(),
  profileQuery: vi.fn(),
  useCommentsReturn: {
    comments: [] as Comment[],
    loading: true,
    error: "",
    setError: vi.fn(),
    submitComment: vi.fn(),
    handleVote: vi.fn(),
    handleDelete: vi.fn(),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>;
      void initial; void animate; void exit; void transition;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/lib/auth", () => ({
  createBrowserClient: () => ({
    auth: { getSession: mocks.getSession },
    from: () => ({
      select: () => ({ eq: () => ({ single: mocks.profileQuery }) }),
    }),
  }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("@/hooks/useComments", () => ({
  useComments: () => mocks.useCommentsReturn,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "fr",
    toggle: vi.fn(),
    t: {
      comments: {
        title: (name: string) => `Commentaires — ${name}`,
        count: (n: number) => n === 1 ? "1 commentaire" : `${n} commentaires`,
        placeholder: "Ajouter un commentaire...",
        publish: "Publier",
        empty: "Aucun commentaire. Soyez le premier !",
        minutesAgo: (n: number) => `il y a ${n}m`,
        hoursAgo: (n: number) => `il y a ${n}h`,
        daysAgo: (n: number) => `il y a ${n}j`,
        likes: (n: number) => n === 0 ? "J'aime" : `J'aime (${n})`,
        dislikes: (n: number) => n === 0 ? "Je n'aime pas" : `Je n'aime pas (${n})`,
        reply: "Répondre",
        delete: "Supprimer",
        confirmDelete: "Supprimer ce commentaire ?",
        yes: "Oui",
        no: "Non",
        replyTo: (author: string) => `Répondre à ${author}...`,
        cancel: "Annuler",
      },
    },
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div className="animate-spin" data-testid="spinner" />,
}));

import CommentsModal from "@/components/CommentsModal";

const COMMENT_A: Comment = {
  id: 1, content: "Prix toujours exact", parent_id: null,
  likes: 3, dislikes: 1, created_at: new Date().toISOString(),
  author: "Alice", user_id: "u1", my_vote: 0,
};
const COMMENT_B: Comment = {
  id: 2, content: "Service rapide", parent_id: null,
  likes: 0, dislikes: 0, created_at: new Date().toISOString(),
  author: "Bob", user_id: "u2", my_vote: 1,
};
const REPLY_A: Comment = {
  id: 3, content: "Merci!", parent_id: 1,
  likes: 0, dislikes: 0, created_at: new Date().toISOString(),
  author: "Charlie", user_id: "u3", my_vote: 0,
};

describe("CommentsModal", () => {
  const defaultProps = {
    stationName: "Petro-Canada Laval",
    address: "456 Boulevard des Laurentides",
    onClose: mocks.onClose,
  };

  beforeEach(() => {
    mocks.onClose.mockReset();
    mocks.submitComment.mockReset();
    mocks.handleVote.mockReset();
    mocks.handleDelete.mockReset();
    mocks.setError.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.profileQuery.mockResolvedValue({ data: null });
    mocks.useCommentsReturn = {
      comments: [], loading: true, error: "",
      setError: mocks.setError,
      submitComment: mocks.submitComment,
      handleVote: mocks.handleVote,
      handleDelete: mocks.handleDelete,
    };
  });

  it("affiche le titre avec le nom de la station", () => {
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("Commentaires — Petro-Canada Laval")).toBeInTheDocument();
  });

  it("affiche le spinner de chargement", () => {
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("affiche l'état vide", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("Aucun commentaire. Soyez le premier !")).toBeInTheDocument();
  });

  it("affiche les commentaires après chargement", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A, COMMENT_B] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("Prix toujours exact")).toBeInTheDocument();
    expect(screen.getByText("Service rapide")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("2 commentaires")).toBeInTheDocument();
  });

  it("affiche 1 commentaire au singulier", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("1 commentaire")).toBeInTheDocument();
  });

  it("soumet un commentaire", async () => {
    mocks.submitComment.mockResolvedValueOnce(true);
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Ajouter un commentaire..."), { target: { value: "Super!" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(mocks.submitComment).toHaveBeenCalledWith("Super!", null));
  });

  it("désactive Publier quand le champ est vide", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Publier" })).toBeDisabled();
  });

  it("ferme avec Escape", () => {
    render(<CommentsModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it("ferme au clic sur l'overlay", () => {
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(document.querySelector(".report-overlay")!);
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it("affiche une erreur", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, error: "Erreur serveur" };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("Erreur serveur")).toBeInTheDocument();
  });

  // ── Votes ──

  it("affiche les boutons de vote avec compteurs", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByLabelText("J'aime (3)")).toBeInTheDocument();
    expect(screen.getByLabelText("Je n'aime pas (1)")).toBeInTheDocument();
  });

  it("appelle handleVote(id, 1) au clic like", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("J'aime (3)"));
    expect(mocks.handleVote).toHaveBeenCalledWith(1, 1);
  });

  it("appelle handleVote(id, -1) au clic dislike", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Je n'aime pas (1)"));
    expect(mocks.handleVote).toHaveBeenCalledWith(1, -1);
  });

  it("met en surbrillance le vote actif (my_vote=1)", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_B] };
    render(<CommentsModal {...defaultProps} />);
    // COMMENT_B a my_vote=1 — le bouton like doit avoir la classe de surbrillance
    const likeBtn = screen.getByLabelText("J'aime");
    expect(likeBtn.className).toContain("0ea5e9");
  });

  // ── Réponses ──

  it("affiche le formulaire de réponse au clic Répondre", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Répondre"));
    expect(screen.getByPlaceholderText("Répondre à Alice...")).toBeInTheDocument();
  });

  it("masque le formulaire au clic Annuler", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Répondre"));
    fireEvent.click(screen.getByText("Annuler"));
    expect(screen.queryByPlaceholderText("Répondre à Alice...")).not.toBeInTheDocument();
  });

  it("soumet une réponse via Enter", async () => {
    mocks.submitComment.mockResolvedValueOnce(true);
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Répondre"));
    const replyInput = screen.getByPlaceholderText("Répondre à Alice...");
    fireEvent.change(replyInput, { target: { value: "Bien dit!" } });
    fireEvent.keyDown(replyInput, { key: "Enter" });
    await waitFor(() => expect(mocks.submitComment).toHaveBeenCalledWith("Bien dit!", 1));
  });

  it("affiche les réponses imbriquées", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A, REPLY_A] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("Merci!")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  // ── Admin ──

  it("détecte le rôle admin via userEmail", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    mocks.profileQuery.mockResolvedValue({ data: { role: "admin" } });
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} userEmail="admin@test.com" />);
    await waitFor(() => {
      expect(screen.getByText("Supprimer")).toBeInTheDocument();
    });
  });

  it("affiche la confirmation de suppression", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    mocks.profileQuery.mockResolvedValue({ data: { role: "admin" } });
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} userEmail="admin@test.com" />);
    await waitFor(() => screen.getByText("Supprimer"));
    fireEvent.click(screen.getByText("Supprimer"));
    expect(screen.getByText("Supprimer ce commentaire ?")).toBeInTheDocument();
    expect(screen.getByText("Oui")).toBeInTheDocument();
    expect(screen.getByText("Non")).toBeInTheDocument();
  });

  it("confirme la suppression avec Oui", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    mocks.profileQuery.mockResolvedValue({ data: { role: "admin" } });
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} userEmail="admin@test.com" />);
    await waitFor(() => screen.getByText("Supprimer"));
    fireEvent.click(screen.getByText("Supprimer"));
    fireEvent.click(screen.getByText("Oui"));
    expect(mocks.handleDelete).toHaveBeenCalledWith(1);
  });

  it("annule la suppression avec Non", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
    mocks.profileQuery.mockResolvedValue({ data: { role: "admin" } });
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} userEmail="admin@test.com" />);
    await waitFor(() => screen.getByText("Supprimer"));
    fireEvent.click(screen.getByText("Supprimer"));
    fireEvent.click(screen.getByText("Non"));
    expect(screen.queryByText("Supprimer ce commentaire ?")).not.toBeInTheDocument();
  });

  it("ne montre pas Supprimer sans userEmail", () => {
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [COMMENT_A] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.queryByText("Supprimer")).not.toBeInTheDocument();
  });

  // ── timeAgo branches (heures et jours) ──

  it("affiche 'il y a Xh' pour un commentaire vieux de 2 heures", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const commentHours: Comment = {
      id: 10, content: "Commentaire 2h", parent_id: null,
      likes: 0, dislikes: 0, created_at: twoHoursAgo,
      author: "Diane", user_id: "u10", my_vote: 0,
    };
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [commentHours] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("il y a 2h")).toBeInTheDocument();
  });

  it("affiche 'il y a Xj' pour un commentaire vieux de 3 jours", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const commentDays: Comment = {
      id: 11, content: "Commentaire 3j", parent_id: null,
      likes: 0, dislikes: 0, created_at: threeDaysAgo,
      author: "Eve", user_id: "u11", my_vote: 0,
    };
    mocks.useCommentsReturn = { ...mocks.useCommentsReturn, loading: false, comments: [commentDays] };
    render(<CommentsModal {...defaultProps} />);
    expect(screen.getByText("il y a 3j")).toBeInTheDocument();
  });
});
