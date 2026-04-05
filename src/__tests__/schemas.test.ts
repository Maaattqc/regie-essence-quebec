import { describe, it, expect } from "vitest";
import { commentSchema, voteSchema, suggestionSchema } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// commentSchema
// ---------------------------------------------------------------------------
describe("commentSchema", () => {
  const validComment = {
    station_name: "Petro-Canada Québec",
    address: "456 boul. Laurier, Québec",
    content: "Très bon service, prix compétitifs.",
  };

  it("accepte des données valides", () => {
    const result = commentSchema.safeParse(validComment);
    expect(result.success).toBe(true);
  });

  it("accepte des champs optionnels (parent_id, anonymous_id)", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      parent_id: 42,
      anonymous_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("accepte parent_id null", () => {
    const result = commentSchema.safeParse({ ...validComment, parent_id: null });
    expect(result.success).toBe(true);
  });

  it("rejette un contenu vide", () => {
    const result = commentSchema.safeParse({ ...validComment, content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("content"))).toBe(true);
    }
  });

  it("rejette un contenu de plus de 1000 caractères", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      content: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("content"))).toBe(true);
    }
  });

  it("rejette un parent_id négatif", () => {
    const result = commentSchema.safeParse({ ...validComment, parent_id: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("parent_id"))).toBe(true);
    }
  });

  it("rejette un parent_id décimal", () => {
    const result = commentSchema.safeParse({ ...validComment, parent_id: 3.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("parent_id"))).toBe(true);
    }
  });

  it("rejette un anonymous_id qui n'est pas un UUID", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      anonymous_id: "pas-un-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("anonymous_id"))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// voteSchema
// ---------------------------------------------------------------------------
describe("voteSchema", () => {
  const validVote = {
    action: "vote" as const,
    comment_id: 1,
    vote: 1 as const,
  };

  it("accepte un vote +1 valide", () => {
    const result = voteSchema.safeParse(validVote);
    expect(result.success).toBe(true);
  });

  it("accepte un vote -1 valide", () => {
    const result = voteSchema.safeParse({ ...validVote, vote: -1 });
    expect(result.success).toBe(true);
  });

  it("accepte un anonymous_id optionnel", () => {
    const result = voteSchema.safeParse({
      ...validVote,
      anonymous_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un vote de 0", () => {
    const result = voteSchema.safeParse({ ...validVote, vote: 0 });
    expect(result.success).toBe(false);
  });

  it("rejette un vote de 2", () => {
    const result = voteSchema.safeParse({ ...validVote, vote: 2 });
    expect(result.success).toBe(false);
  });

  it("rejette un vote de -2", () => {
    const result = voteSchema.safeParse({ ...validVote, vote: -2 });
    expect(result.success).toBe(false);
  });

  it("rejette si comment_id est manquant", () => {
    const noId = { action: "vote" as const, vote: 1 as const };
    const result = voteSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it("rejette un comment_id non positif", () => {
    const result = voteSchema.safeParse({ ...validVote, comment_id: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("comment_id"))).toBe(true);
    }
  });

  it("rejette un anonymous_id invalide", () => {
    const result = voteSchema.safeParse({
      ...validVote,
      anonymous_id: "invalide",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("anonymous_id"))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// suggestionSchema
// ---------------------------------------------------------------------------
describe("suggestionSchema", () => {
  const validSuggestion = {
    first_name: "Marie",
    last_name: "Dupont",
    email: "marie@example.com",
    message: "Il serait bien d'ajouter un filtre par marque de station.",
  };

  it("accepte des données valides", () => {
    const result = suggestionSchema.safeParse(validSuggestion);
    expect(result.success).toBe(true);
  });

  it("rejette un prénom trop court (moins de 2 caractères)", () => {
    const result = suggestionSchema.safeParse({ ...validSuggestion, first_name: "M" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("first_name"))).toBe(true);
    }
  });

  it("rejette un nom trop court (moins de 2 caractères)", () => {
    const result = suggestionSchema.safeParse({ ...validSuggestion, last_name: "D" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("last_name"))).toBe(true);
    }
  });

  it("rejette un email invalide", () => {
    const result = suggestionSchema.safeParse({ ...validSuggestion, email: "pas-un-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejette un message trop court (moins de 10 caractères)", () => {
    const result = suggestionSchema.safeParse({ ...validSuggestion, message: "Court" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("message"))).toBe(true);
    }
  });

  it("rejette un message trop long (plus de 2000 caractères)", () => {
    const result = suggestionSchema.safeParse({
      ...validSuggestion,
      message: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("message"))).toBe(true);
    }
  });

  it("rejette si des champs sont manquants", () => {
    const result = suggestionSchema.safeParse({ first_name: "Marie" });
    expect(result.success).toBe(false);
  });
});
