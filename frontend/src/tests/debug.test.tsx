import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DebugPage from "../app/(app)/projects/[id]/debug/page";

const { mockDebugSession } = vi.hoisted(() => {
  const mockDebugSession = {
    id: "dbg-1",
    projectId: "proj-123",
    errorText: "Connection to localhost:5432 refused",
    contextText: "mvn spring-boot:run",
    result: {
      layer: "database",
      title: "Database Connection Refused on Port 5432",
      analogy: "Like trying to turn on a lamp when the circuit breaker is tripped.",
      plain_cause: "The backend server cannot reach PostgreSQL because it is not running on port 5432.",
      technical_cause: "PSQLException: Connection refused via HikariCP connection pool.",
      fix_steps: [
        "Run 'docker compose up -d postgres' to start PostgreSQL",
        "Or run with '-Dspring-boot.run.profiles=dev' to use embedded database",
      ],
      preventive_tip: "Add Docker Compose healthchecks to orchestrate startup dependencies.",
    },
    createdAt: new Date().toISOString(),
  };
  return { mockDebugSession };
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
    getDebugHistory: vi.fn().mockResolvedValue([mockDebugSession]),
    diagnoseError: vi.fn().mockResolvedValue(mockDebugSession),
  },
}));

describe("DebugPage", () => {
  it("renders architectural debug report, isolated layer, and fix checklist", async () => {
    render(<DebugPage />);

    expect(screen.getByText("Loading Architectural Debug Guide...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Architectural Debug Guide (Flow F)")).toBeInTheDocument();
      expect(screen.getByText("Database Connection Refused on Port 5432")).toBeInTheDocument();
      expect(screen.getByText("Layer: database")).toBeInTheDocument();
    });

    expect(screen.getByText("Architectural Layer Isolation:")).toBeInTheDocument();
    expect(
      screen.getByText("The backend server cannot reach PostgreSQL because it is not running on port 5432.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Run 'docker compose up -d postgres' to start PostgreSQL")
    ).toBeInTheDocument();
  });
});
