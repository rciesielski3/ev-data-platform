import type { LeadInterest, LeadSubmission } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const getLeadsByInterest = async (
  interest: LeadInterest,
  limit?: number
): Promise<LeadSubmission[]> =>
  prisma.leadSubmission.findMany({
    where: { interest },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
