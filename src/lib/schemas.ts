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
    .min(10, "Le message doit contenir au moins 10 caractères"),
});

export type ReportInput = z.infer<typeof reportSchema>;
