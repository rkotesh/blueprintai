"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project, DebugSession } from "@/types";
import {
  Bug,
  Compass,
  Layers,
  Network,
  Cpu,
  Milestone as MilestoneIcon,
  Code2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Database,
  Monitor,
  ShieldCheck,
  Globe,
  Radio,
  CheckSquare,
  Square,
  History,
  GraduationCap,
  BrainCircuit,
  FileText,
} from "lucide-react";

const SAMPLE_ERRORS = [
  {
    label: "DB Refused (Port 5432)",
    error: `org.flywaydb.core.internal.exception.FlywaySqlException: Unable to obtain connection from database: Connection to localhost:5432 refused.
Caused by: org.postgresql.util.PSQLException: Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.`,
    context: "Occurred when launching Spring Boot via mvn spring-boot:run",
  },
  {
    label: "CORS Blocked",
    error: `Access to XMLHttpRequest at 'http://localhost:8080/api/projects' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`,
    context: "Occurred when submitting a new project form from Next.js browser page",
  },
  {
    label: "JWT Expired",
    error: `io.jsonwebtoken.ExpiredJwtException: JWT expired at 2026-11-18T00:15:00Z. Current time: 2026-11-18T00:30:00Z, a difference of 900000 milliseconds.`,
    context: "Occurred when fetching /api/me after user was idle for 15 minutes",
  },
];

export default function DebugPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [history, setHistory] = useState<DebugSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DebugSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [errorText, setErrorText] = useState(SAMPLE_ERRORS[0].error);
  const [contextText, setContextText] = useState(SAMPLE_ERRORS[0].context);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checkbox state for fix steps
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

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
        const list = await api.getDebugHistory(projectId);
        setHistory(list);
        if (list.length > 0) {
          setCurrentSession(list[0]);
        }
      } catch {}
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnose = async () => {
    if (!errorText.trim()) return;

    try {
      setIsDiagnosing(true);
      setError(null);
      setCheckedSteps({});

      const res = await api.diagnoseError(projectId, {
        errorText,
        contextText: contextText.trim() || undefined,
      });

      setCurrentSession(res);
      setHistory((prev) => [res, ...prev.filter((h) => h.id !== res.id)]);
    } catch (err: any) {
      setError(err?.message || "Failed to diagnose error.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const loadSample = (s: (typeof SAMPLE_ERRORS)[0]) => {
    setErrorText(s.error);
    setContextText(s.context);
  };

  const detectedLayer = currentSession?.result.layer.toLowerCase() || "";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading Architectural Debug Guide...</p>
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
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Architectural Debug Guide (Flow F)</h1>
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
          <Link
            href={`/projects/${projectId}/milestones`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <MilestoneIcon className="h-3.5 w-3.5" />
            <span>Milestones</span>
          </Link>
          <Link
            href={`/projects/${projectId}/explain`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Explain</span>
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <Bug className="h-3.5 w-3.5 text-primary" />
            <span>Debug</span>
          </span>
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
          <Link
            href={`/projects/${projectId}/export`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export</span>
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

      {/* Main Debug Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Error Input Form */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold">Error & Stack Trace</h2>
              </div>

              {/* Sample error buttons */}
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-muted-foreground mr-1">Load sample:</span>
                {SAMPLE_ERRORS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(s)}
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Paste Error Message, Console Log, or Exception Trace
              </label>
              <textarea
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                rows={9}
                placeholder="e.g. PSQLException: Connection refused, or TypeError: undefined is not an object..."
                className="w-full rounded-xl border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Context / What were you doing when it failed? (Optional)
              </label>
              <input
                type="text"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g. Trying to start the backend with Maven on Windows..."
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              BlueprintAI will identify which layer failed and provide a step-by-step fix checklist.
            </span>
            <button
              onClick={handleDiagnose}
              disabled={isDiagnosing || !errorText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Diagnose Error</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Diagnosis & Fix Checklist */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Diagnostic Report</h2>
            </div>
            {currentSession && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                Layer: {currentSession.result.layer}
              </span>
            )}
          </div>

          {/* Mini Architecture Layer Visualizer */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Architectural Layer Isolation:
            </span>
            <div className="grid grid-cols-5 gap-2 pt-1 text-center text-xs">
              {[
                { key: "frontend", label: "Frontend", icon: Monitor },
                { key: "backend", label: "Backend", icon: Cpu },
                { key: "database", label: "Database", icon: Database },
                { key: "auth", label: "Auth", icon: ShieldCheck },
                { key: "network", label: "Network", icon: Globe },
              ].map(({ key, label, icon: Icon }) => {
                const isOffender = detectedLayer.includes(key);
                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition-all ${
                      isOffender
                        ? "bg-destructive/15 border-destructive text-destructive font-bold ring-2 ring-destructive/40 shadow-sm animate-pulse"
                        : "bg-muted/30 border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isDiagnosing && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Grok AI is isolating the broken architectural layer...</p>
              <p className="text-xs text-muted-foreground max-w-xs text-center">
                Comparing exception trace against your database, network, and backend configuration.
              </p>
            </div>
          )}

          {!isDiagnosing && !currentSession && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground mb-1">
                <Bug className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Diagnosis Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Paste an error on the left and click <strong>Diagnose Error</strong>. We'll tell you which layer broke and how to fix it in plain English.
              </p>
            </div>
          )}

          {!isDiagnosing && currentSession && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Problem Title */}
              <div className="rounded-xl border bg-destructive/10 border-destructive/20 p-3.5 text-xs text-destructive space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Identified Issue
                </span>
                <p className="font-bold text-sm leading-snug">{currentSession.result.title}</p>
              </div>

              {/* Analogy */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Real-World Analogy</span>
                </div>
                <p className="text-xs text-foreground/90 italic leading-relaxed">
                  "{currentSession.result.analogy}"
                </p>
              </div>

              {/* Plain English Cause */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">What happened in plain English?</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentSession.result.plain_cause}
                </p>
              </div>

              {/* Fix Steps Checklist */}
              <div className="space-y-2 pt-2 border-t">
                <span className="text-xs font-bold text-foreground">Step-by-Step Fix Checklist</span>
                <div className="space-y-1.5">
                  {currentSession.result.fix_steps.map((step, idx) => {
                    const isChecked = !!checkedSteps[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                          isChecked ? "bg-muted/40 line-through text-muted-foreground border-border/60" : "bg-card hover:bg-muted/20 text-foreground"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{step}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preventive Tip */}
              {currentSession.result.preventive_tip && (
                <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
                  <span className="font-semibold text-foreground text-[11px] block">
                    🛡️ How to prevent this in the future:
                  </span>
                  <p>{currentSession.result.preventive_tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
