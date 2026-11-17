import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ExplainPage from "../app/(app)/projects/[id]/explain/page";

const { mockExplanation } = vi.hoisted(() => {
  const mockExplanation = {
    id: "exp-1",
    projectId: "proj-123",
    filename: "AuthController.java",
    language: "java",
    codeText: "public void register() {}",
    layer: "backend",
    explanation: {
      layer: "backend",
      summary: "Handles user signup and securely hashes passwords.",
      analogy: "Like a building security guard checking photo badges before handing out keys.",
      plain_explanation: "This code receives user input from the browser and stores their password securely.",
      technical_detail: "Uses BCryptPasswordEncoder.encode() inside a Spring transactional boundary.",
      key_takeaways: ["Never store raw passwords", "Always validate email uniqueness"],
    },
    createdAt: new Date().toISOString(),
  };
  return { mockExplanation };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-editor-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
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
    getMilestones: vi.fn().mockResolvedValue([]),
    getExplanations: vi.fn().mockResolvedValue([mockExplanation]),
    explainCode: vi.fn().mockResolvedValue(mockExplanation),
  },
}));

describe("ExplainPage", () => {
  it("renders code editor studio and 3-tier explanation", async () => {
    render(<ExplainPage />);

    expect(screen.getByText("Loading Code Explainer Studio...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Code Explainer Studio (Flow F)")).toBeInTheDocument();
      expect(screen.getByText("Layer: backend")).toBeInTheDocument();
      expect(screen.getByText("1. Real-World Analogy")).toBeInTheDocument();
    });

    expect(
      screen.getByText('"Like a building security guard checking photo badges before handing out keys."')
    ).toBeInTheDocument();
    expect(
      screen.getByText("This code receives user input from the browser and stores their password securely.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Uses BCryptPasswordEncoder.encode() inside a Spring transactional boundary.")
    ).toBeInTheDocument();
  });
});
