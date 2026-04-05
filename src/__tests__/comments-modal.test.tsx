import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Comment } from "@/components/CommentsModal";

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  submitComment: vi.fn(),
  handleVote: vi.fn(),
  handleDelete: vi.fn(),
  setError: vi.fn(),
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
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } =
        props as Record<string, unknown>;
      void initial;
      void animate;
      void exit;
      void transition;
      return (
        <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
      );
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/lib/auth", () => ({
  createBrowserClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
    }),
  }),
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("@/hooks/useComments", () => ({
  useComments: () => mocks.useCommentsReturn,
}));

import CommentsModal from "@/components/CommentsModal";

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
    mocks.useCommentsReturn = {
      comments: [],
      loading: true,
      error: "",
      setError: mocks.setError,
      submitComment: mocks.submitComment,
      handleVote: mocks.handleVote,
      handleDelete: mocks.handleDelete,
    };
  });

  it("affiche le titre avec le nom de la station", () => {
    render(<CommentsModal {...defaultProps} />);

    expect(
      screen.getByText("Commentaires — Petro-Canada Laval")
    ).toBeInTheDocument();
  });

  it("affiche le spinner de chargement", () => {
    render(<CommentsModal {...defaultProps} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("affiche l'état vide quand il n'y a aucun commentaire", () => {
    mocks.useCommentsReturn = {
      ...mocks.useCommentsReturn,
      loading: false,
      comments: [],
    };

    render(<CommentsModal {...defaultProps} />);

    expect(
      screen.getByText("Aucun commentaire. Soyez le premier !")
    ).toBeInTheDocument();
  });

  it("affiche les commentaires après le chargement", () => {
    const fakeComments: Comment[] = [
      {
        id: 1,
        content: "Prix toujours exact ici",
        parent_id: null,
        likes: 3,
        dislikes: 0,
        created_at: new Date().toISOString(),
        author: "Alice",
        user_id: "u1",
        my_vote: 0,
      },
      {
        id: 2,
        content: "Service rapide",
        parent_id: null,
        likes: 1,
        dislikes: 0,
        created_at: new Date().toISOString(),
        author: "Bob",
        user_id: "u2",
        my_vote: 0,
      },
    ];

    mocks.useCommentsReturn = {
      ...mocks.useCommentsReturn,
      loading: false,
      comments: fakeComments,
    };

    render(<CommentsModal {...defaultProps} />);

    expect(screen.getByText("Prix toujours exact ici")).toBeInTheDocument();
    expect(screen.getByText("Service rapide")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("2 commentaires")).toBeInTheDocument();
  });

  it("soumet un commentaire via le formulaire", async () => {
    mocks.submitComment.mockResolvedValueOnce(true);
    mocks.useCommentsReturn = {
      ...mocks.useCommentsReturn,
      loading: false,
      comments: [],
    };

    render(<CommentsModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Ajouter un commentaire...");
    fireEvent.change(input, {
      target: { value: "Excellent service !" },
    });

    const publishBtn = screen.getByRole("button", { name: "Publier" });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(mocks.submitComment).toHaveBeenCalledWith(
        "Excellent service !",
        null
      );
    });
  });
});
