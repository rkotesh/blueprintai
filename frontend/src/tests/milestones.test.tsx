import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MilestonesPage from "../app/(app)/projects/[id]/milestones/page";

const { mockMilestones } = vi.hoisted(() => {
  const mockMilestones = [
    {
      id: "ms-1",
      projectId: "proj-123",
      orderIndex: 1,
      title: "Project Setup & Scaffolding",
      description: "Initialize monorepo, configure build tools, verify basic healthchecks.",
      concepts: ["Monorepo", "Healthchecks"],
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    },
    {
      id: "ms-2",
      projectId: "proj-123",
      orderIndex: 2,
      title: "Database Schema & User Models",
      description: "Set up PostgreSQL migrations and define core user entities.",
      concepts: ["Relational Schema", "Primary Keys"],
      status: "TODO",
      createdAt: new Date().toISOString(),
    },
  ];
  return { mockMilestones };
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
    getMilestones: vi.fn().mockResolvedValue(mockMilestones),
    generateMilestones: vi.fn().mockResolvedValue(mockMilestones),
    updateMilestone: vi.fn().mockImplementation((id, payload) =>
      Promise.resolve({
        ...mockMilestones[0],
        ...payload,
      })
    ),
  },
}));

describe("MilestonesPage", () => {
  it("renders milestones roadmap with concepts and progress bar", async () => {
    render(<MilestonesPage />);

    expect(screen.getByText("Synthesizing Guided Build Milestones...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Guided Build & Learning Milestones")).toBeInTheDocument();
      expect(screen.getByText("Project Setup & Scaffolding")).toBeInTheDocument();
      expect(screen.getByText("Database Schema & User Models")).toBeInTheDocument();
    });

    expect(screen.getByText("Monorepo")).toBeInTheDocument();
    expect(screen.getByText("Healthchecks")).toBeInTheDocument();
    expect(screen.getAllByText("Explain Code for this Milestone")).toHaveLength(2);
  });
});
