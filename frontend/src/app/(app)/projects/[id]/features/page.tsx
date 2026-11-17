"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project, Blueprint, Feature, FeaturePriority, FeatureAnalysis } from "@/types";
import {
  Layers,
  Sparkles,
  ArrowRightLeft,
  Search,
  Loader2,
  AlertCircle,
  X,
  Compass,
  Network,
  Cpu,
  Milestone,
  CheckCircle2,
  ShieldCheck,
  Code2,
  Database,
  Monitor,
  Flame,
} from "lucide-react";

export default function FeaturesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis modal state
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [analysis, setAnalysis] = useState<FeatureAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const proj = await api.getProject(projectId);
      setProject(proj);

      try {
        const bp = await api.getLatestBlueprint(projectId);
        setBlueprint(bp);
        const featList = await api.getFeatures(projectId);
        setFeatures(featList);
      } catch (bpErr) {
        // Blueprint not yet generated, attempt auto-generation if interview turns exist
        await handleGenerateBlueprint();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load project features");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const bp = await api.generateBlueprint(projectId);
      setBlueprint(bp);
      const featList = await api.getFeatures(projectId);
      setFeatures(featList);
    } catch (err: any) {
      setError(err?.message || "Could not generate blueprint. Please finish the requirements interview first.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePriority = async (feature: Feature) => {
    const newPriority: FeaturePriority = feature.priority === "MVP" ? "LATER" : "MVP";

    // Optimistic UI update
    setFeatures((prev) =>
      prev.map((f) => (f.id === feature.id ? { ...f, priority: newPriority } : f))
    );

    try {
      await api.updateFeature(feature.id, { priority: newPriority });
    } catch (err) {
      // Revert on failure
      setFeatures((prev) =>
        prev.map((f) => (f.id === feature.id ? { ...f, priority: feature.priority } : f))
      );
      alert("Failed to update feature priority");
    }
  };

  const handleOpenAnalysis = async (feature: Feature) => {
    setSelectedFeature(feature);
    setAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const result = await api.analyzeFeature(projectId, feature.id);
      setAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err?.message || "Failed to analyze feature");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mvpFeatures = features.filter((f) => f.priority === "MVP");
  const laterFeatures = features.filter((f) => f.priority === "LATER");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Synthesizing Project Blueprint & Features...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Project Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-foreground">{project?.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Project Blueprint & Feature Breakdown</h1>
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Features</span>
          </span>
          <Link
            href={`/projects/${projectId}/architecture`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Network className="h-3.5 w-3.5" />
            <span>Architecture</span>
          </Link>
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
          <button
            onClick={handleGenerateBlueprint}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Retry Blueprint Generation"}
          </button>
        </div>
      )}

      {/* Blueprint Summary Card */}
      {blueprint && (
        <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Blueprint v{blueprint.version}</span>
            </div>

            <button
              onClick={handleGenerateBlueprint}
              disabled={isGenerating}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Regenerate Blueprint"}
            </button>
          </div>

          <p className="text-base text-foreground font-medium leading-relaxed">
            {blueprint.content?.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Target Users
              </span>
              <div className="flex flex-wrap gap-1.5">
                {blueprint.content?.users?.map((u, i) => (
                  <span key={i} className="bg-muted px-2 py-0.5 rounded-md text-foreground">
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Key User Flow
              </span>
              <p className="text-muted-foreground">
                {blueprint.content?.user_flows?.[0] || "End-to-end journey mapped across system layers."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Kanban Board: MVP vs. Later */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MVP Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-lg text-foreground">MVP Features</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {mvpFeatures.length} Essential
            </span>
          </div>

          <div className="space-y-3">
            {mvpFeatures.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No features marked for MVP yet.
              </div>
            ) : (
              mvpFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="group rounded-xl border bg-card p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm text-foreground">{feat.name}</h3>
                    <button
                      onClick={() => handleTogglePriority(feat)}
                      title="Move to Later"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0 bg-muted/60 px-2 py-1 rounded-md"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>Move to Later</span>
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>

                  {feat.logicNotes && (
                    <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground border">
                      <strong className="text-foreground">Logic: </strong>
                      {feat.logicNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                      <span>{feat.screens?.length || 0} screens</span>
                      <span>•</span>
                      <span>{feat.dataEntities?.length || 0} entities</span>
                    </div>

                    <button
                      onClick={() => handleOpenAnalysis(feat)}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Analyze Feature</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Later Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Flame className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Later / Phase 2</h2>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {laterFeatures.length} Growth
            </span>
          </div>

          <div className="space-y-3">
            {laterFeatures.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No features deferred to later.
              </div>
            ) : (
              laterFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="group rounded-xl border bg-card p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all space-y-3 opacity-90 hover:opacity-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm text-foreground">{feat.name}</h3>
                    <button
                      onClick={() => handleTogglePriority(feat)}
                      title="Move to MVP"
                      className="text-xs text-muted-foreground hover:text-emerald-600 flex items-center gap-1 shrink-0 bg-muted/60 px-2 py-1 rounded-md"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>Move to MVP</span>
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="text-[11px] text-muted-foreground">Deferred post-MVP launch</span>
                    <button
                      onClick={() => handleOpenAnalysis(feat)}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Analyze Feature</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Feature Deep Breakdown Drawer / Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Architectural Breakdown
                </span>
                <h2 className="text-xl font-bold text-foreground">{selectedFeature.name}</h2>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Breaking feature into screens, APIs, security, and build steps...</p>
              </div>
            ) : analysisError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {analysisError}
              </div>
            ) : analysis ? (
              <div className="space-y-6 text-xs">
                {/* 1. Screens & Modals */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span>User Interface Screens & Modals</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.screens.map((s, i) => (
                      <span key={i} className="bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Data Entities & Fields */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <span>Database Entities & Fields Read/Written</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.data_needed.map((d, i) => (
                      <span key={i} className="bg-muted text-foreground font-mono px-2.5 py-1 rounded-md">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. API Endpoints */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Code2 className="h-4 w-4 text-indigo-600" />
                    <span>API Endpoints</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.api_calls.map((call, i) => (
                      <li key={i} className="bg-muted/40 p-2 rounded-lg font-mono text-[11px] border">
                        {call}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Edge Cases */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Edge Cases to Handle</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed">
                    {analysis.edge_cases.map((ec, i) => (
                      <li key={i}>{ec}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. Security Notes */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <ShieldCheck className="h-4 w-4 text-rose-600" />
                    <span>Security & Privacy Checklist</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed">
                    {analysis.security_notes.map((sec, i) => (
                      <li key={i}>{sec}</li>
                    ))}
                  </ul>
                </div>

                {/* 6. Implementation Steps */}
                <div>
                  <h4 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Ordered Build Steps</span>
                  </h4>
                  <ol className="space-y-1.5">
                    {analysis.steps_to_build.map((step, i) => (
                      <li key={i} className="bg-muted/50 p-2.5 rounded-lg border text-foreground leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
