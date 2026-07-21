import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { LeadInterest, LeadSubmission } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getLeadsByInterest } from "@/lib/db/get-leads";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  leadSubmission: {
    findMany: Mock;
  };
};

const createMockLead = (overrides?: Partial<LeadSubmission>): LeadSubmission => ({
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  company: null,
  interest: "GENERAL" as LeadInterest,
  message: null,
  createdAt: new Date("2026-01-01"),
  ...overrides,
});

describe("getLeadsByInterest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries leads by interest without limit", async () => {
    mockPrisma.leadSubmission.findMany = vi.fn().mockResolvedValue([]);

    await getLeadsByInterest("GENERAL");

    expect(mockPrisma.leadSubmission.findMany).toHaveBeenCalledWith({
      where: { interest: "GENERAL" },
      orderBy: { createdAt: "desc" },
      take: undefined,
    });
  });

  it("queries leads by interest with limit", async () => {
    mockPrisma.leadSubmission.findMany = vi.fn().mockResolvedValue([]);

    await getLeadsByInterest("PARTNERSHIP", 10);

    expect(mockPrisma.leadSubmission.findMany).toHaveBeenCalledWith({
      where: { interest: "PARTNERSHIP" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  });

  it("returns multiple leads ordered by creation date descending", async () => {
    const mockLeads = [
      createMockLead({
        id: "3",
        name: "Charlie",
        createdAt: new Date("2026-01-03"),
      }),
      createMockLead({
        id: "2",
        name: "Bob",
        createdAt: new Date("2026-01-02"),
      }),
      createMockLead({
        id: "1",
        name: "Alice",
        createdAt: new Date("2026-01-01"),
      }),
    ];

    mockPrisma.leadSubmission.findMany = vi
      .fn()
      .mockResolvedValue(mockLeads);

    const result = await getLeadsByInterest("GENERAL");

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("3");
    expect(result[1].id).toBe("2");
    expect(result[2].id).toBe("1");
  });

  it("returns empty array when no leads match the interest", async () => {
    mockPrisma.leadSubmission.findMany = vi.fn().mockResolvedValue([]);

    const result = await getLeadsByInterest("DATA_API");

    expect(result).toEqual([]);
    expect(mockPrisma.leadSubmission.findMany).toHaveBeenCalled();
  });

  it("respects limit parameter to return up to N leads", async () => {
    const mockLeads = [
      createMockLead({
        id: "2",
        name: "Bob",
        createdAt: new Date("2026-01-02"),
      }),
      createMockLead({
        id: "1",
        name: "Alice",
        createdAt: new Date("2026-01-01"),
      }),
    ];

    mockPrisma.leadSubmission.findMany = vi
      .fn()
      .mockResolvedValue(mockLeads);

    const result = await getLeadsByInterest("GENERAL", 2);

    expect(result).toHaveLength(2);
    expect(mockPrisma.leadSubmission.findMany).toHaveBeenCalledWith({
      where: { interest: "GENERAL" },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
  });

  it("filters by different interest types correctly", async () => {
    mockPrisma.leadSubmission.findMany = vi.fn().mockResolvedValue([]);

    const interests: LeadInterest[] = [
      "GENERAL",
      "PARTNERSHIP",
      "DATA_API",
    ] as LeadInterest[];

    for (const interest of interests) {
      await getLeadsByInterest(interest);
    }

    expect(mockPrisma.leadSubmission.findMany).toHaveBeenCalledTimes(3);
    expect(mockPrisma.leadSubmission.findMany).toHaveBeenNthCalledWith(1, {
      where: { interest: "GENERAL" },
      orderBy: { createdAt: "desc" },
      take: undefined,
    });
    expect(mockPrisma.leadSubmission.findMany).toHaveBeenNthCalledWith(2, {
      where: { interest: "PARTNERSHIP" },
      orderBy: { createdAt: "desc" },
      take: undefined,
    });
    expect(mockPrisma.leadSubmission.findMany).toHaveBeenNthCalledWith(3, {
      where: { interest: "DATA_API" },
      orderBy: { createdAt: "desc" },
      take: undefined,
    });
  });

  it("returns lead objects with all properties intact", async () => {
    const completeLead = createMockLead({
      id: "lead-123",
      name: "Jane Smith",
      email: "jane@company.com",
      company: "Tech Corp",
      interest: "PARTNERSHIP" as LeadInterest,
      message: "Interested in partnership opportunities",
      createdAt: new Date("2026-07-15"),
    });

    mockPrisma.leadSubmission.findMany = vi
      .fn()
      .mockResolvedValue([completeLead]);

    const result = await getLeadsByInterest("PARTNERSHIP");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(completeLead);
    expect(result[0].id).toBe("lead-123");
    expect(result[0].email).toBe("jane@company.com");
    expect(result[0].company).toBe("Tech Corp");
    expect(result[0].message).toBe("Interested in partnership opportunities");
  });
});
