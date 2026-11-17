import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FeaturesPage from "../app/(app)/projects/[id]/features/page";

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
    getLatestBlueprint: vi.fn().mockResolvedValue({
      id: "bp-1",
      projectId: "proj-123",
      version: 1,
      content: {
        summary: "A modern conference ticketing system.",
        users: ["Event Organizer", "Attendee"],
        features: [],
        user_flows: ["Organizer creates event -> Attendee buys ticket"],
        data_model: [],
      },
    }),
    getFeatures: vi.fn().mockResolvedValue([
      {
        id: "feat-1",
        projectId: "proj-123",
        name: "Ticket Purchase & QR Generation",
        description: "Allow attendees to purchase tickets and generate cryptographically signed QR passes.",
        priority: "MVP",
        screens: ["CheckoutModal", "TicketPassView"],
        dataEntities: ["Order", "Ticket"],
        logicNotes: "Validate seat availability before charge.",
        status: "TODO",
        createdAt: new Date().toISOString(),
      },
      {
        id: "feat-2",
        projectId: "proj-123",
        name: "Sponsor Booth Analytics",
        description: "Real-time attendee engagement metrics for conference sponsors.",
        priority: "LATER",
        screens: ["SponsorDashboard"],
        dataEntities: ["SponsorLead"],
        logicNotes: "Aggregate lead scans.",
        status: "TODO",
        createdAt: new Date().toISOString(),
      },
    ]),
  },
}));

describe("FeaturesPage", () => {
  it("renders Blueprint summary, MVP and Later columns, and feature cards", async () => {
    render(<FeaturesPage />);

    expect(await screen.findByText("Project Blueprint & Feature Breakdown")).toBeInTheDocument();
    expect(await screen.findByText("A modern conference ticketing system.")).toBeInTheDocument();
    expect(await screen.findByText("MVP Features")).toBeInTheDocument();
    expect(await screen.findByText("Later / Phase 2")).toBeInTheDocument();
    expect(await screen.findByText("Ticket Purchase & QR Generation")).toBeInTheDocument();
    expect(await screen.findByText("Sponsor Booth Analytics")).toBeInTheDocument();
  });
});
