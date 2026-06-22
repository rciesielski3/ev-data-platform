import type { LeadInterest, LeadSubmission } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const createLeadSubmission = (input: {
  name?: string;
  email: string;
  company?: string;
  interest: LeadInterest;
  message?: string;
}): Promise<LeadSubmission> =>
  prisma.leadSubmission.create({
    data: { ...input, email: input.email.trim().toLowerCase() },
  });
