"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project, Milestone, MilestoneStatus } from "@/types";
import {
  Milestone as MilestoneIcon,
  Compass,
  Layers,
  Network,
  Cpu,
  Code2,
  Bug,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  BookOpen,
  Award,
  GraduationCap,
  BrainCircuit,
} from "lucide-react";

export default function MilestonesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const list = await api.getMilestones(projectId);
        setMilestones(list);
      } catch (err: any) {
        if (err?.status === 404) {
          setMilestones([]);
        } else {
          setError(err?.message || "Failed to load milestones.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMilestones = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const list = await api.generateMilestones(projectId);
      setMilestones(list);
    } catch (err: any) {
      setError(err?.message || "Failed to generate milestones.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (milestoneId: string, newStatus: MilestoneStatus) => {
    try {
      const updated = await api.updateMilestone(milestoneId, { status: newStatus });
      setMilestones((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update milestone status.");
    }
  };

  const completedCount = milestones.filter((m) => m.status === "DONE").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Synthesizing Guided Build Milestones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
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
          <h1 className="text-2xl font-bold tracking-tight">Guided Build & Learning Milestones</h1>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs font-medium overflow-x-auto">
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <MilestoneIcon className="h-3.5 w-3.5 text-primary" />
            <span>Milestones</span>
          </span>
          <Link
            href={`/projects/${projectId}/explain`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Explain</span>
          </Link>
          <Link
            href={`/projects/${projectId}/debug`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Debug</span>
          </Link>
          <Link
            href={`/projects/${projectId}/learn`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Learn</span>
          </Link>
          <Link
            href={`/projects/${projectId}/check`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Check</span>
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

      {/* Progress & Milestone Generation Banner */}
      {milestones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <MilestoneIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Milestones Generated Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Let BlueprintAI convert your architecture and features into bite-sized, incremental milestones with learning concepts.
          </p>
          <button
            onClick={handleGenerateMilestones}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Build Milestones</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Progress Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">Build Progress ({completedCount}/{milestones.length} Milestones)</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Follow each milestone sequentially to build mental models and conceptual understanding as you write code.
              </p>
            </div>

            <div className="flex items-center gap-4 min-w-[240px]">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{progressPercent}% Complete</span>
                  <span className="text-muted-foreground">{milestones.length - completedCount} Remaining</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateMilestones}
                disabled={isGenerating}
                className="text-xs font-semibold px-3 py-2 rounded-xl border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>

          {/* Milestones Card List */}
          <div className="space-y-4">
            {milestones.map((m) => {
              const isDone = m.status === "DONE";
              const isInProgress = m.status === "IN_PROGRESS";
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-6 transition-all duration-200 shadow-sm space-y-4 ${
                    isDone
                      ? "bg-muted/20 border-border/60 opacity-90"
                      : isInProgress
                      ? "bg-card ring-2 ring-primary/40 border-primary/40"
                      : "bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : isInProgress
                            ? "bg-primary text-primary-foreground shadow"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : m.orderIndex}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {m.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-muted/60 p-1 rounded-xl text-xs font-medium">
                      <button
                        onClick={() => handleUpdateStatus(m.id, "TODO")}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          m.status === "TODO" ? "bg-card text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        To-Do
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(m.id, "IN_PROGRESS")}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          m.status === "IN_PROGRESS" ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(m.id, "DONE")}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          m.status === "DONE" ? "bg-emerald-500 text-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  {/* Concepts & Explainer CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                        <BookOpen className="h-3 w-3" />
                        Concepts:
                      </span>
                      {m.concepts.map((concept, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-muted px-2.5 py-0.5 rounded-lg text-foreground border"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/projects/${projectId}/explain?milestoneId=${m.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Explain Code for this Milestone</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
