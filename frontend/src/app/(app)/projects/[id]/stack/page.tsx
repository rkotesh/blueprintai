"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project, StackChoice, StackAlternative } from "@/types";
import {
  Cpu,
  Compass,
  Layers,
  Network,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronDown,
  Layers as LayersIcon,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export default function StackPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [stackChoices, setStackChoices] = useState<StackChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Swap modal state
  const [swapModal, setSwapModal] = useState<{
    choice: StackChoice;
    newTech: string;
    alternative: StackAlternative;
  } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);

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
        const choices = await api.getStack(projectId);
        setStackChoices(choices);
      } catch (err: any) {
        if (err?.status === 404) {
          setStackChoices([]);
        } else {
          setError(err?.message || "Failed to load tech stack choices.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAlternative = (choice: StackChoice, altName: string) => {
    if (altName === choice.userChoice) return;

    // If reverting to recommended
    if (altName === choice.recommended) {
      confirmSwap(choice, altName);
      return;
    }

    const alt = choice.alternatives.find((a) => a.name === altName);
    if (alt) {
      setSwapModal({
        choice,
        newTech: altName,
        alternative: alt,
      });
    }
  };

  const confirmSwap = async (choice: StackChoice, newTech: string) => {
    try {
      setIsSwapping(true);
      setError(null);
      const updated = await api.updateStackChoice(choice.id, newTech);

      setStackChoices((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSwapSuccessMessage(
        `Successfully changed ${choice.layer} to ${newTech}! Architecture map has been regenerated.`
      );
      setSwapModal(null);
    } catch (err: any) {
      setError(err?.message || "Failed to update tech choice.");
    } finally {
      setIsSwapping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Synthesizing Tech Stack Recommendations & Trade-offs...</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Tech Stack Advisor & Trade-off Analyzer</h1>
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
          <Link
            href={`/projects/${projectId}/architecture`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Network className="h-3.5 w-3.5" />
            <span>Architecture</span>
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span>Tech Stack</span>
          </span>
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

      {swapSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{swapSuccessMessage}</span>
          </div>
          <Link
            href={`/projects/${projectId}/architecture`}
            className="text-xs font-semibold underline hover:opacity-80 flex items-center gap-1"
          >
            <span>View Architecture Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Main Stack Content */}
      {stackChoices.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center bg-card/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Cpu className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Stack Generated Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Stack choices are automatically synthesized when generating your architecture. Generate your architecture first to evaluate recommended technologies.
          </p>
          <Link
            href={`/projects/${projectId}/architecture`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Go to Architecture Generator</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary shrink-0" />
              <span>
                Each tier is recommended based on your project goals, developer ergonomics, and scalability. You can swap any layer; doing so regenerates your architecture graph.
              </span>
            </div>
            <Link
              href={`/projects/${projectId}/architecture`}
              className="text-primary hover:underline font-semibold shrink-0 ml-4 flex items-center gap-1"
            >
              <span>See in Architecture</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stackChoices.map((choice) => {
              const isModified = choice.userChoice !== choice.recommended;
              return (
                <div
                  key={choice.id}
                  className={`rounded-2xl border bg-card p-6 shadow-sm transition-all space-y-5 ${
                    isModified ? "ring-2 ring-primary/40 border-primary/40" : ""
                  }`}
                >
                  {/* Layer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Layer
                      </span>
                      <h3 className="text-lg font-bold text-foreground capitalize">{choice.layer}</h3>
                    </div>

                    {isModified ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        <span>Customized</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Recommended</span>
                      </span>
                    )}
                  </div>

                  {/* Active Selection */}
                  <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">Selected Technology:</div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-foreground">{choice.userChoice}</div>
                      {choice.userChoice === choice.recommended && (
                        <span className="text-[10px] bg-background px-2 py-0.5 rounded border text-muted-foreground">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-foreground">Why this choice?</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {choice.reasoning}
                    </p>
                  </div>

                  {/* Swap Technology Dropdown */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Change Technology</span>
                      {isModified && (
                        <button
                          onClick={() => confirmSwap(choice, choice.recommended)}
                          disabled={isSwapping}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Reset to Recommended
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={choice.userChoice}
                        onChange={(e) => handleSelectAlternative(choice, e.target.value)}
                        disabled={isSwapping}
                        aria-label={`Change Technology for ${choice.layer}`}
                        className="w-full appearance-none rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 pr-8"
                      >
                        <option value={choice.recommended}>
                          {choice.recommended} (Recommended)
                        </option>
                        {choice.alternatives.map((alt) => (
                          <option key={alt.name} value={alt.name}>
                            {alt.name} (Alternative)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Trade-offs of Alternatives */}
                  {choice.alternatives && choice.alternatives.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-semibold text-foreground">Alternative Trade-offs</div>
                      <div className="space-y-2">
                        {choice.alternatives.map((alt) => (
                          <div
                            key={alt.name}
                            className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                              choice.userChoice === alt.name
                                ? "bg-primary/5 border-primary/30"
                                : "bg-card"
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{alt.name}</span>
                              <span className="text-[10px] text-muted-foreground font-normal italic">
                                {alt.when_to_choose}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t">
                              <div>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mb-0.5">
                                  Pros:
                                </span>
                                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                  {alt.pros.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <span className="text-rose-600 dark:text-rose-400 font-semibold block mb-0.5">
                                  Cons:
                                </span>
                                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                  {alt.cons.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Swapping Tech (Flow D) */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-base">Confirm Technology Change</h3>
              </div>
              <button
                onClick={() => setSwapModal(null)}
                disabled={isSwapping}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                You are about to swap <strong>{swapModal.choice.layer}</strong> from{" "}
                <span className="font-semibold text-foreground">{swapModal.choice.userChoice}</span> to{" "}
                <span className="font-semibold text-primary">{swapModal.newTech}</span>.
              </p>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-foreground">
                <div className="font-semibold text-amber-700 dark:text-amber-400">
                  Trade-off Consideration:
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {swapModal.alternative.cons.join(". ") || "Alters your backend integration semantics."}
                </p>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                  When to choose: {swapModal.alternative.when_to_choose}
                </div>
              </div>

              <p className="text-[11px] italic">
                * Note: Changing your tech stack choice will automatically regenerate your architecture diagram and increment its version number.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSwapModal(null)}
                disabled={isSwapping}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmSwap(swapModal.choice, swapModal.newTech)}
                disabled={isSwapping}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSwapping ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Regenerating Architecture...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Regenerate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
