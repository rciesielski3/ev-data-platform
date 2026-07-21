import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import type { LeadInterest, LeadSubmission } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createLeadSubmission } from "@/lib/db/lead-submissions";

vi.mock("@/lib/db/prisma");

const mockPrisma = prisma as unknown as {
  leadSubmission: {
    create: Mock;
  };
};

const mockLeadSubmission: LeadSubmission = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  company: "Acme Corp",
  interest: "GENERAL" as LeadInterest,
  message: "Interested in your platform",
  createdAt: new Date("2026-01-01"),
};

describe("createLeadSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("creates a lead submission with all fields", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Corp",
      interest: "GENERAL" as LeadInterest,
      message: "Interested in your platform",
    };

    const result = await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        ...input,
        email: "john@example.com",
      },
    });
    expect(result).toEqual(mockLeadSubmission);
  });

  it("normalizes email by trimming whitespace", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      email: "  john@example.com  ",
      interest: "GENERAL" as LeadInterest,
    };

    await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        email: "john@example.com",
        interest: "GENERAL",
      },
    });
  });

  it("normalizes email by lowercasing", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      email: "JOHN@EXAMPLE.COM",
      interest: "GENERAL" as LeadInterest,
    };

    await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        email: "john@example.com",
        interest: "GENERAL",
      },
    });
  });

  it("normalizes email by trimming and lowercasing together", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      email: "  JOHN@EXAMPLE.COM  ",
      interest: "PARTNERSHIP" as LeadInterest,
    };

    await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        email: "john@example.com",
        interest: "PARTNERSHIP",
      },
    });
  });

  it("creates a submission with only required fields (email and interest)", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      email: "minimal@example.com",
      interest: "GENERAL" as LeadInterest,
    };

    await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        email: "minimal@example.com",
        interest: "GENERAL",
      },
    });
  });

  it("preserves optional fields (name, company, message) when provided", async () => {
    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(mockLeadSubmission);

    const input = {
      name: "Jane Smith",
      email: "jane@example.com",
      company: "TechCorp",
      interest: "DATA_API" as LeadInterest,
      message: "We want to integrate your API",
    };

    await createLeadSubmission(input);

    expect(mockPrisma.leadSubmission.create).toHaveBeenCalledWith({
      data: {
        name: "Jane Smith",
        email: "jane@example.com",
        company: "TechCorp",
        interest: "DATA_API",
        message: "We want to integrate your API",
      },
    });
  });

  it("returns the created lead submission object from Prisma", async () => {
    const expectedSubmission: LeadSubmission = {
      id: "test-id-123",
      name: "Test User",
      email: "test@example.com",
      company: null,
      interest: "GENERAL" as LeadInterest,
      message: null,
      createdAt: new Date("2026-01-15"),
    };

    mockPrisma.leadSubmission.create = vi
      .fn()
      .mockResolvedValue(expectedSubmission);

    const result = await createLeadSubmission({
      name: "Test User",
      email: "test@example.com",
      interest: "GENERAL" as LeadInterest,
    });

    expect(result).toEqual(expectedSubmission);
  });
});
