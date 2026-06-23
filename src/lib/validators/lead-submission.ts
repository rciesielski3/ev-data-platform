import { z } from "zod";

export const leadSubmissionSchema = z.object({
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional(),
  interest: z.enum(["REPORT", "FEATURED_LISTING", "BOTH"]),
  message: z.string().trim().max(4000).optional(),
});

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
