import { describe, expect, it } from "vitest";

import { leadSubmissionSchema } from "@/lib/validators/lead-submission";

describe("leadSubmissionSchema", () => {
  it("accepts a fully filled, valid submission", () => {
    const result = leadSubmissionSchema.safeParse({
      name: "Jan Kowalski",
      email: "jan@example.com",
      company: "Acme Sp. z o.o.",
      interest: "BOTH",
      message: "Jesteśmy zainteresowani raportem.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a submission with only the required fields", () => {
    const result = leadSubmissionSchema.safeParse({
      email: "jan@example.com",
      interest: "REPORT",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    expect(
      leadSubmissionSchema.safeParse({ interest: "REPORT" }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(
      leadSubmissionSchema.safeParse({
        email: "not-an-email",
        interest: "REPORT",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing interest", () => {
    expect(
      leadSubmissionSchema.safeParse({ email: "jan@example.com" }).success,
    ).toBe(false);
  });

  it("rejects an interest value outside the enum", () => {
    expect(
      leadSubmissionSchema.safeParse({
        email: "jan@example.com",
        interest: "SOMETHING_ELSE",
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from text fields", () => {
    const result = leadSubmissionSchema.safeParse({
      name: "  Jan Kowalski  ",
      email: "  jan@example.com  ",
      interest: "BOTH",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jan Kowalski");
      expect(result.data.email).toBe("jan@example.com");
    }
  });

  it("rejects a message longer than 4000 characters", () => {
    expect(
      leadSubmissionSchema.safeParse({
        email: "jan@example.com",
        interest: "REPORT",
        message: "a".repeat(4001),
      }).success,
    ).toBe(false);
  });
});
