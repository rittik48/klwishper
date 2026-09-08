import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
export const postSchema = z.object({ roomId: z.string().uuid(), content: z.string().trim().min(1).max(500) });
export const replySchema = z.object({ postId: z.string().uuid(), content: z.string().trim().min(1).max(500) });
export const reportSchema = z.object({ postId: z.string().uuid(), reason: z.enum(["Spam", "Harassment", "Threat", "Personal Information", "Sexual Content", "Impersonation", "Other"]) });
export const profileSchema = z.object({ department: z.string().trim().min(1).max(80), year: z.string().trim().min(1).max(30) });
export const roomSchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(240).default(""), type: z.enum(["general", "college", "department", "subject", "hostel", "events"]).default("general") });
