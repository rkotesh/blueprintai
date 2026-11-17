import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StackPage from "../app/(app)/projects/[id]/stack/page";

const { mockChoices, mockUpdateStackChoice } = vi.hoisted(() => {
  const mockChoices = [
    {
      id: "choice-1",
      projectId: "proj-123",
      layer: "Database",
      recommended: "PostgreSQL",
      alternatives: [
        {
          name: "MongoDB",
          pros: ["Schema flexibility", "Native document storage"],
          cons: ["Lack of ACID multi-table joins", "Eventual consistency risks"],
          when_to_choose: "When data is unstructured or hierarchical",
        },
        {
          name: "MySQL",
          pros: ["Widely supported", "Simple setup"],
          cons: ["Inferior JSON support compared to PostgreSQL"],
          when_to_choose: "When existing team is MySQL focused",
        },
      ],
      reasoning: "PostgreSQL provides robust relational safety alongside native JSONB document flexibility.",
      userChoice: "PostgreSQL",
      createdAt: new Date().toISOString(),
    },
  ];

  const mockUpdateStackChoice = vi.fn().mockImplementation((choiceId, userChoice) =>
    Promise.resolve({
      ...mockChoices[0],
      userChoice,
    })
  );

  return { mockChoices, mockUpdateStackChoice };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getProject: vi.fn().mockResolvedValue({
      id: "proj-123",
      title: "EventCraft",
      ideaText: "Ticketing platform for conferences",
      mode: "BUILD",
      targetPlatform: "WEB",
      status: "ACTIVE",
    }),
    getStack: vi.fn().mockResolvedValue(mockChoices),
    updateStackChoice: (...args: any[]) => mockUpdateStackChoice(...args),
  },
}));

describe("StackPage", () => {
  it("renders tech stack layers, recommendations, and trade-offs", async () => {
    render(<StackPage />);

    expect(
      screen.getByText("Synthesizing Tech Stack Recommendations & Trade-offs...")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Tech Stack Advisor & Trade-off Analyzer")
      ).toBeInTheDocument();
      expect(screen.getByText("Database")).toBeInTheDocument();
      expect(
        screen.getByText("PostgreSQL provides robust relational safety alongside native JSONB document flexibility.")
      ).toBeInTheDocument();
    });

    // Check trade-offs for MongoDB
    expect(screen.getByText("MongoDB")).toBeInTheDocument();
    expect(screen.getByText("Schema flexibility")).toBeInTheDocument();
    expect(screen.getByText("Lack of ACID multi-table joins")).toBeInTheDocument();
  });

  it("opens confirmation modal and swaps technology, regenerating architecture", async () => {
    render(<StackPage />);

    await waitFor(() => {
      expect(screen.getByText("Database")).toBeInTheDocument();
    });

    // Find the select dropdown
    const select = screen.getByLabelText("Change Technology for Database");
    fireEvent.change(select, { target: { value: "MongoDB" } });

    // Confirm modal should appear
    await waitFor(() => {
      expect(screen.getByText("Confirm Technology Change")).toBeInTheDocument();
      expect(screen.getByText("Trade-off Consideration:")).toBeInTheDocument();
    });

    // Click Confirm & Regenerate
    const confirmBtn = screen.getByRole("button", { name: "Confirm & Regenerate" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockUpdateStackChoice).toHaveBeenCalledWith("choice-1", "MongoDB");
      expect(
        screen.getByText(
          "Successfully changed Database to MongoDB! Architecture map has been regenerated."
        )
      ).toBeInTheDocument();
    });
  });
});
