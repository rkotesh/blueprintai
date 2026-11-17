"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { api } from "@/lib/api";
import {
  Project,
  ArchitectureGraph,
  ArchitectureNode,
  ArchitectureEdge,
  TraceResponse,
  TraceStep,
  Feature,
} from "@/types";
import ArchitectureNodeComponent, {
  ArchitectureNodeData,
} from "@/components/diagrams/ArchitectureNode";
import {
  Network,
  Compass,
  Layers,
  Cpu,
  Sparkles,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Send,
  Info,
  ArrowRight,
  ShieldCheck,
  Database,
  Monitor,
  Globe,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

const nodeTypes = {
  architectureNode: ArchitectureNodeComponent,
};

export default function ArchitecturePage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureGraph | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected node for slide-over detail
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);

  // Trace state
  const [traceActionText, setTraceActionText] = useState("");
  const [isTracing, setIsTracing] = useState(false);
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // React Flow nodes & edges
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ArchitectureNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const proj = await api.getProject(projectId);
      setProject(proj);

      try {
        const featList = await api.getFeatures(projectId);
        setFeatures(featList);
      } catch {
        // features may be empty
      }

      try {
        const arch = await api.getArchitecture(projectId);
        setArchitecture(arch);
      } catch (err: any) {
        if (err?.status === 404) {
          // No architecture yet
          setArchitecture(null);
        } else {
          setError(err?.message || "Failed to load architecture graph.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateArchitecture = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const newArch = await api.generateArchitecture(projectId);
      setArchitecture(newArch);
    } catch (err: any) {
      setError(err?.message || "Failed to generate architecture graph.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute graph layout
  const activeStep: TraceStep | null = useMemo(() => {
    if (!trace || currentStepIndex < 0 || currentStepIndex >= trace.steps.length) {
      return null;
    }
    return trace.steps[currentStepIndex];
  }, [trace, currentStepIndex]);

  useEffect(() => {
    if (!architecture) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Group nodes by layer for structured column layout
    const layerCols: Record<string, ArchitectureNode[]> = {
      frontend: [],
      auth: [],
      backend: [],
      database: [],
      external: [],
    };

    architecture.nodes.forEach((n) => {
      const l = n.layer.toLowerCase();
      if (layerCols[l]) {
        layerCols[l].push(n);
      } else {
        layerCols.backend.push(n);
      }
    });

    const flowNodes: Node<ArchitectureNodeData>[] = [];

    // Layout configuration
    // Col 0: Frontend (x: 40)
    layerCols.frontend.forEach((n, idx) => {
      flowNodes.push({
        id: n.id,
        type: "architectureNode",
        position: { x: 40, y: 140 + idx * 160 },
        data: {
          ...n,
          isActiveTrace: activeStep?.node_id === n.id,
        },
      });
    });

    // Col 1: Auth (top) and Backend (middle) (x: 360)
    let col1Y = 40;
    layerCols.auth.forEach((n) => {
      flowNodes.push({
        id: n.id,
        type: "architectureNode",
        position: { x: 360, y: col1Y },
        data: {
          ...n,
          isActiveTrace: activeStep?.node_id === n.id,
        },
      });
      col1Y += 150;
    });

    layerCols.backend.forEach((n) => {
      flowNodes.push({
        id: n.id,
        type: "architectureNode",
        position: { x: 360, y: col1Y },
        data: {
          ...n,
          isActiveTrace: activeStep?.node_id === n.id,
        },
      });
      col1Y += 170;
    });

    // Col 2: Database (top) and External (bottom) (x: 680)
    let col2Y = 60;
    layerCols.database.forEach((n) => {
      flowNodes.push({
        id: n.id,
        type: "architectureNode",
        position: { x: 680, y: col2Y },
        data: {
          ...n,
          isActiveTrace: activeStep?.node_id === n.id,
        },
      });
      col2Y += 170;
    });

    layerCols.external.forEach((n) => {
      flowNodes.push({
        id: n.id,
        type: "architectureNode",
        position: { x: 680, y: col2Y },
        data: {
          ...n,
          isActiveTrace: activeStep?.node_id === n.id,
        },
      });
      col2Y += 170;
    });

    // Build edges
    const flowEdges: Edge[] = architecture.edges.map((e, idx) => {
      const isStepEdge = activeStep && (activeStep.edge_id === `${e.from}->${e.to}` || activeStep.node_id === e.to);
      return {
        id: `${e.from}-${e.to}-${idx}`,
        source: e.from,
        target: e.to,
        label: e.label ? `${e.label} (${e.protocol})` : e.protocol,
        animated: !!isStepEdge,
        style: {
          stroke: isStepEdge ? "#3b82f6" : "#94a3b8",
          strokeWidth: isStepEdge ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isStepEdge ? "#3b82f6" : "#94a3b8",
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [architecture, activeStep, setNodes, setEdges]);

  // Trace execution
  const handleTraceAction = async (customAction?: string) => {
    const actionQuery = customAction || traceActionText.trim();
    if (!actionQuery) return;

    try {
      setIsTracing(true);
      setError(null);
      const res = await api.traceAction(projectId, { action: actionQuery });
      setTrace(res);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err?.message || "Failed to trace action through architecture.");
    } finally {
      setIsTracing(false);
    }
  };

  // Auto-play timer for action trace
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && trace && trace.steps.length > 0) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= trace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, trace]);

  const handleNodeClick = (_: any, node: Node) => {
    if (!architecture) return;
    const found = architecture.nodes.find((n) => n.id === node.id);
    if (found) {
      setSelectedNode(found);
    }
  };

  // Inbound and outbound connections for selected node
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode || !architecture) return { inbound: [], outbound: [] };
    const inbound = architecture.edges.filter((e) => e.to === selectedNode.id);
    const outbound = architecture.edges.filter((e) => e.from === selectedNode.id);
    return { inbound, outbound };
  }, [selectedNode, architecture]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Mapping System Architecture...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Project Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-foreground">{project?.title}</span>
            {architecture && (
              <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                v{architecture.version}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Interactive Architecture & Action Tracer</h1>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs font-medium">
          <Link
            href={`/projects/${projectId}/requirements`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Interview</span>
          </Link>
          <Link
            href={`/projects/${projectId}/features`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Features</span>
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <Network className="h-3.5 w-3.5 text-primary" />
            <span>Architecture</span>
          </span>
          <Link
            href={`/projects/${projectId}/stack`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Tech Stack</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Architecture Content */}
      {!architecture ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Network className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Architecture Generated Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Let BlueprintAI synthesize your project's components into an end-to-end interactive architecture map.
          </p>
          <button
            onClick={handleGenerateArchitecture}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Designing Architecture...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Architecture Map</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left / Main Canvas Area (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Toolbar / Action Trace Trigger */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Trace an Action (Flow C)</h2>
                    <p className="text-xs text-muted-foreground">
                      Watch how a button click or request pulses end-to-end through every layer of your app.
                    </p>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleTraceAction("User signs up with email and password")}
                    disabled={isTracing}
                    className="text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 rounded-lg transition-all"
                  >
                    User signs up
                  </button>
                  {features.slice(0, 2).map((feat) => (
                    <button
                      key={feat.id}
                      onClick={() => handleTraceAction(`User performs action: ${feat.name}`)}
                      disabled={isTracing}
                      className="text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 rounded-lg transition-all max-w-[150px] truncate"
                    >
                      {feat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom action input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={traceActionText}
                  onChange={(e) => setTraceActionText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTraceAction()}
                  placeholder="e.g. User submits an order payment, or User uploads a photo..."
                  disabled={isTracing}
                  className="flex-1 rounded-xl border bg-background px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
                <button
                  onClick={() => handleTraceAction()}
                  disabled={isTracing || !traceActionText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0"
                >
                  {isTracing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Trace Path</span>
                </button>
              </div>
            </div>

            {/* React Flow Container */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden h-[580px] relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={1.5}
              >
                <Background gap={16} size={1} />
                <Controls showInteractive={false} position="bottom-right" />
                <MiniMap
                  nodeStrokeWidth={3}
                  zoomable
                  pannable
                  position="bottom-left"
                  className="!bg-background/80 !border !rounded-xl overflow-hidden"
                />
              </ReactFlow>

              {/* Layer Legend Overlay */}
              <div className="absolute top-3 left-3 bg-background/90 backdrop-blur border rounded-xl p-2.5 shadow-sm text-[11px] space-y-1.5 pointer-events-none">
                <div className="font-semibold text-xs mb-1 text-foreground">System Layers</div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-muted-foreground">Frontend (UI / Client)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-muted-foreground">Backend (API / Logic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-muted-foreground">Database (Storage)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
                  <span className="text-muted-foreground">Auth & Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-muted-foreground">External Services</span>
                </div>
              </div>
            </div>

            {/* Trace Step Controller & 3-Layer Explanation Banner */}
            {trace && (
              <div className="rounded-2xl border bg-card p-5 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Action Trace Active
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-foreground">"{trace.action}"</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Step {currentStepIndex + 1} of {trace.steps.length}
                    </p>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                      disabled={currentStepIndex <= 0}
                      className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 transition-all"
                      title="Previous Step"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>{currentStepIndex >= trace.steps.length - 1 ? "Replay" : "Play"}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (currentStepIndex >= trace.steps.length - 1) {
                          setCurrentStepIndex(0);
                        } else {
                          setCurrentStepIndex((p) => Math.min(trace.steps.length - 1, p + 1));
                        }
                      }}
                      disabled={currentStepIndex >= trace.steps.length - 1 && !isPlaying}
                      className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 transition-all"
                      title="Next Step"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTrace(null);
                        setCurrentStepIndex(-1);
                        setIsPlaying(false);
                      }}
                      className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-all ml-1"
                      title="Close Trace"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 3-Tier Explanation Panel (Section 8: Analogy -> Plain English -> Technical) */}
                {activeStep && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Tier 1: Analogy */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <span>💡 1. Real-World Analogy</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed italic">
                        "{activeStep.analogy}"
                      </p>
                    </div>

                    {/* Tier 2: Plain English */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <span>🗣️ 2. Plain English</span>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {activeStep.plain_explanation}
                      </p>
                    </div>

                    {/* Tier 3: Technical Mechanics */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <span>⚙️ 3. Technical Detail</span>
                      </div>
                      <p className="text-xs font-mono text-foreground/90 leading-relaxed bg-background/50 p-2 rounded border break-all">
                        {activeStep.technical_detail}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Node Inspector / Architecture Overview (1 col) */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">Node Inspector</h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {selectedNode.layer}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-1">{selectedNode.label}</h4>
                  <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                    {selectedNode.tech}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-foreground">What is this component?</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Connections list */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="text-xs font-semibold text-foreground">Connected Endpoints</div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground">Inbound Requests:</span>
                    {selectedNodeConnections.inbound.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">None (Entry point)</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedNodeConnections.inbound.map((e, i) => (
                          <li key={i} className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                            <span className="font-semibold text-foreground">{e.from}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                              {e.protocol}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground">Outbound Requests:</span>
                    {selectedNodeConnections.outbound.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">None (Data leaf)</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedNodeConnections.outbound.map((e, i) => (
                          <li key={i} className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                            <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            <span className="font-semibold text-foreground">{e.to}</span>
                            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                              {e.protocol}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">How to Explore</h3>
                </div>

                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    <p>Click on any node in the canvas to inspect its role, technology, and connections.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    <p>
                      Use the <strong>Trace Path</strong> feature above to see how data flows from user input to database storage.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-foreground shrink-0">3.</span>
                    <p>
                      Check the <strong>Tech Stack Advisor</strong> tab to evaluate or customize each component's library choice.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Link
                    href={`/projects/${projectId}/stack`}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span>Review Tech Stack</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
