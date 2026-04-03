import { z } from "zod";

export const reportSchema = z.object({
  station_name: z
    .string()
    .min(1, "Le nom de la station est requis"),
  address: z
    .string()
    .min(1, "L'adresse est requise"),
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .email("L'adresse courriel est invalide"),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const commentSchema = z.object({
  station_name: z.string().min(1).max(200),
  address: z.string().min(1).max(300),
  content: z.string().min(1, "Contenu requis").max(1000, "Le commentaire ne peut pas dépasser 1000 caractères"),
  parent_id: z.number().int().positive().nullable().optional(),
  anonymous_id: z.string().uuid("Identifiant anonyme invalide").optional(),
});

export const voteSchema = z.object({
  action: z.literal("vote"),
  comment_id: z.number().int().positive("ID commentaire invalide"),
  vote: z.union([z.literal(1), z.literal(-1)]),
  anonymous_id: z.string().uuid("Identifiant anonyme invalide").optional(),
});

export const suggestionSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .email("L'adresse courriel est invalide"),
  message: z
    .string()
    .min(10, "La suggestion doit contenir au moins 10 caractères")
    .max(2000, "La suggestion ne peut pas dépasser 2000 caractères"),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;
