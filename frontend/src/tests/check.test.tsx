import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UnderstandingCheckPage from "../app/(app)/projects/[id]/check/page";

const { mockCheck } = vi.hoisted(() => {
  const mockCheck = {
    id: "chk-1",
    projectId: "proj-123",
    userSummary: "In my app, Next.js calls Spring Boot with JWTs, which reads and writes to PostgreSQL.",
    score: 85,
    feedback: {
      total_score: 85,
      dimensions: {
        architecture: { score: 22, comment: "Clear explanation of client-server separation." },
        stack_reasons: { score: 20, comment: "Understands why PostgreSQL was chosen." },
        user_flows: { score: 23, comment: "Tracing actions from UI to database is well understood." },
        edge_cases: { score: 20, comment: "Mentioned token expiration scenarios." },
      },
      strengths: ["Clean separation of frontend and backend layers", "Good grasp of stateless auth"],
      gaps: ["Consider database connection pooling under load"],
      constructive_feedback: "Great grasp overall! Focus on how connection pools behave during high traffic.",
      recommended_concepts: ["connection-pooling", "rate-limiting"],
    },
    createdAt: new Date().toISOString(),
  };

  return { mockCheck };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getUnderstandingHistory: vi.fn().mockResolvedValue([mockCheck]),
    evaluateUnderstanding: vi.fn().mockResolvedValue(mockCheck),
  },
}));

describe("UnderstandingCheckPage", () => {
  it("renders understanding check form and scorecard history", async () => {
    render(<UnderstandingCheckPage />);

    await waitFor(() => {
      expect(screen.getByText("Understanding Check")).toBeInTheDocument();
      expect(screen.getByText("Mental Model Score")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("/ 100")).toBeInTheDocument();
      expect(screen.getByText("Clear explanation of client-server separation.")).toBeInTheDocument();
      expect(screen.getByText("Clean separation of frontend and backend layers")).toBeInTheDocument();
    });
  });

  it("submits new explanation and updates score", async () => {
    render(<UnderstandingCheckPage />);

    const textarea = screen.getByPlaceholderText(/E\.g\., In my app, when a user creates a project/i);
    fireEvent.change(textarea, {
      target: {
        value: "My app uses Next.js App Router for frontend UI and Spring Boot for secure business logic.",
      },
    });

    const submitBtn = screen.getByText("Submit Explanation for Feedback");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Mental Model Score")).toBeInTheDocument();
      expect(screen.getByText("Next Steps for Improvement")).toBeInTheDocument();
    });
  });
});
