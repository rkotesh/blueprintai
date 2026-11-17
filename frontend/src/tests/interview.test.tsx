import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RequirementsInterviewPage from "../app/(app)/projects/[id]/requirements/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getProject: vi.fn().mockResolvedValue({
      id: "proj-123",
      title: "Artisan Marketplace",
      ideaText: "Connecting local pottery artisans with buyers",
      mode: "BUILD",
      targetPlatform: "WEB",
      status: "ACTIVE",
    }),
    getInterviewTurns: vi.fn().mockResolvedValue([
      {
        id: "turn-1",
        role: "AI",
        content: "Who are the key users visiting your store? [Why: Identifying users shapes the database roles]",
        turnIndex: 0,
        createdAt: new Date().toISOString(),
      },
    ]),
  },
}));

describe("RequirementsInterviewPage", () => {
  it("renders project title and AI opening question with why note", async () => {
    render(<RequirementsInterviewPage />);

    expect(await screen.findByText("Artisan Marketplace")).toBeInTheDocument();
    expect(await screen.findByText(/Who are the key users visiting your store\?/i)).toBeInTheDocument();
    expect(await screen.findByText(/Why am I asking this\?/i)).toBeInTheDocument();
  });
});
