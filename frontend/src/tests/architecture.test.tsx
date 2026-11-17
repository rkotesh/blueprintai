import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArchitecturePage from "../app/(app)/projects/[id]/architecture/page";

const { mockArchitecture, mockTraceResponse } = vi.hoisted(() => {
  const mockArchitecture = {
    id: "arch-1",
    projectId: "proj-123",
    version: 1,
    nodes: [
      {
        id: "node_fe",
        label: "Next.js Web App",
        layer: "frontend",
        description: "App Router client interface with Tailwind CSS",
        tech: "Next.js 14",
      },
      {
        id: "node_be",
        label: "Spring Boot API",
        layer: "backend",
        description: "Modular monolith backend handling business logic",
        tech: "Spring Boot 3.3",
      },
      {
        id: "node_db",
        label: "PostgreSQL Database",
        layer: "database",
        description: "Primary relational storage with JSONB documents",
        tech: "PostgreSQL 16",
      },
    ],
    edges: [
      {
        from: "node_fe",
        to: "node_be",
        label: "REST API",
        protocol: "HTTPS/JSON",
      },
      {
        from: "node_be",
        to: "node_db",
        label: "JPA Queries",
        protocol: "JDBC/SQL",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const mockTraceResponse = {
    trace_id: "trace-999",
    action: "User signs up",
    steps: [
      {
        order: 1,
        node_id: "node_fe",
        edge_id: "node_fe->node_be",
        analogy: "The receptionist greets you at the front desk.",
        plain_explanation: "The user submits their email and password from the browser.",
        technical_detail: "POST /api/auth/register with AuthRegisterRequest payload.",
      },
      {
        order: 2,
        node_id: "node_be",
        edge_id: "node_be->node_db",
        analogy: "The clerk checks the database filing cabinet.",
        plain_explanation: "The server checks for existing users and hashes the password.",
        technical_detail: "BCryptPasswordEncoder.encode() -> UserRepository.save(User).",
      },
    ],
  };

  return { mockArchitecture, mockTraceResponse };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, nodes, onNodeClick }: any) => (
    <div data-testid="react-flow-mock">
      {nodes?.map((n: any) => (
        <div
          key={n.id}
          data-testid={`flow-node-${n.id}`}
          onClick={(e) => onNodeClick?.(e, n)}
        >
          {n.data.label} - {n.data.tech}
        </div>
      ))}
      {children}
    </div>
  ),
  Background: () => <div data-testid="rf-background" />,
  Controls: () => <div data-testid="rf-controls" />,
  MiniMap: () => <div data-testid="rf-minimap" />,
  MarkerType: { ArrowClosed: "arrowclosed" },
  useNodesState: (initial: any) => {
    const [nodes, setNodes] = React.useState(initial);
    return [nodes, setNodes, vi.fn()];
  },
  useEdgesState: (initial: any) => {
    const [edges, setEdges] = React.useState(initial);
    return [edges, setEdges, vi.fn()];
  },
  Handle: () => null,
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
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
    getFeatures: vi.fn().mockResolvedValue([]),
    getArchitecture: vi.fn().mockResolvedValue(mockArchitecture),
    generateArchitecture: vi.fn().mockResolvedValue(mockArchitecture),
    traceAction: vi.fn().mockResolvedValue(mockTraceResponse),
  },
}));

describe("ArchitecturePage", () => {
  it("renders architecture diagram with version and nodes", async () => {
    render(<ArchitecturePage />);

    expect(screen.getByText("Mapping System Architecture...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Interactive Architecture & Action Tracer")).toBeInTheDocument();
      expect(screen.getByText("EventCraft")).toBeInTheDocument();
      expect(screen.getByText("v1")).toBeInTheDocument();
    });

    // Check rendered nodes in mock ReactFlow
    await waitFor(() => {
      expect(screen.getByTestId("flow-node-node_fe")).toHaveTextContent("Next.js Web App");
      expect(screen.getByTestId("flow-node-node_be")).toHaveTextContent("Spring Boot API");
      expect(screen.getByTestId("flow-node-node_db")).toHaveTextContent("PostgreSQL Database");
    });
  });

  it("opens node inspector when a node is clicked", async () => {
    render(<ArchitecturePage />);

    await waitFor(() => {
      expect(screen.getByTestId("flow-node-node_fe")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("flow-node-node_fe"));

    await waitFor(() => {
      expect(screen.getByText("Node Inspector")).toBeInTheDocument();
      expect(screen.getByText("What is this component?")).toBeInTheDocument();
      expect(
        screen.getByText("App Router client interface with Tailwind CSS")
      ).toBeInTheDocument();
    });
  });

  it("traces an action and displays 3-tier explanation (analogy, plain, technical)", async () => {
    render(<ArchitecturePage />);

    await waitFor(() => {
      expect(screen.getByText("Trace an Action (Flow C)")).toBeInTheDocument();
    });

    // Click quick suggestion "User signs up"
    const quickBtn = screen.getByRole("button", { name: "User signs up" });
    fireEvent.click(quickBtn);

    await waitFor(() => {
      expect(screen.getByText("Action Trace Active")).toBeInTheDocument();
      expect(screen.getByText('"User signs up"')).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    });

    // Check the 3-layer explanation
    expect(screen.getByText("💡 1. Real-World Analogy")).toBeInTheDocument();
    expect(screen.getByText('"The receptionist greets you at the front desk."')).toBeInTheDocument();

    expect(screen.getByText("🗣️ 2. Plain English")).toBeInTheDocument();
    expect(
      screen.getByText("The user submits their email and password from the browser.")
    ).toBeInTheDocument();

    expect(screen.getByText("⚙️ 3. Technical Detail")).toBeInTheDocument();
    expect(
      screen.getByText("POST /api/auth/register with AuthRegisterRequest payload.")
    ).toBeInTheDocument();
  });
});
