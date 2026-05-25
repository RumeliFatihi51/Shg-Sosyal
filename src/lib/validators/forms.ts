import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Geçerli bir e-posta yaz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});

export const signUpSchema = signInSchema.extend({
  first_name: z.string().min(2, "Ad en az 2 karakter olmalı.").max(60),
  last_name: z.string().min(2, "Soyad en az 2 karakter olmalı.").max(60),
  class_name: z.string().min(1, "Sınıf zorunlu.").max(20),
  school_number: z.string().min(1, "Okul numarası zorunlu.").max(30),
});

export const profileSchema = z.object({
  first_name: z.string().min(2).max(60),
  last_name: z.string().min(2).max(60),
  class_name: z.string().min(1).max(20),
  school_number: z.string().min(1).max(30),
  username: z.string().max(40).optional(),
  bio: z.string().max(280).optional(),
  interests: z.array(z.string().min(1).max(40)).max(12),
});

export const usernameSchema = z.object({
  username: z.string().min(3).max(40),
});

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export const messageEditSchema = messageSchema.extend({
  message_id: z.string().uuid(),
});

export const communitySchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(3).max(800),
});

export const eventSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(3).max(1600),
  event_date: z.string().min(1),
  start_time: z.string().min(1),
  location: z.string().min(1).max(140),
  capacity: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  community_id: z.string().uuid().optional().or(z.literal("")),
});

export const postSchema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(2).max(4000),
  community_id: z.string().uuid(),
});

export const commentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1).max(1200),
});

export const reportSchema = z.object({
  target_type: z.enum(["post", "comment", "event", "community"]),
  target_id: z.string().uuid(),
  reason: z.string().min(3).max(600),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(8).max(1600),
  audience: z.enum(["school", "students", "teachers"]).default("school"),
});

export const pollSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(800).optional(),
  options: z.array(z.string().min(1).max(140)).min(2).max(6),
  closes_at: z.string().optional(),
});
