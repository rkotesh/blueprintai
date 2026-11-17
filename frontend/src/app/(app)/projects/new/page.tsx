"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ProjectMode, TargetPlatform } from "@/types";
import { Sparkles, BookOpen, Globe, Smartphone, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ProjectMode>("BUILD");
  const [platform, setPlatform] = useState<TargetPlatform>("WEB");
  const [title, setTitle] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const project = await api.createProject({
        title,
        ideaText,
        mode,
        targetPlatform: platform,
      });

      // Flow A: Redirect directly to the requirements interview
      router.push(`/projects/${project.id}/requirements`);
    } catch (err: any) {
      setError(err?.message || "Failed to create project. Please verify your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create a New Blueprint</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us what you want to build or learn, and we will formulate the architecture.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-3.5 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        {/* Step 1: Choose Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            1. What is your primary goal?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("BUILD")}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                mode === "BUILD"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                  : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground block">I have an App Idea</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Turn a product concept into features, data models, and an MVP blueprint.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("LEARN")}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                mode === "LEARN"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                  : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground block">Learn by Building</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Master frameworks and systems by constructing a real, structured project.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Target Platform */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            2. Target Platform
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlatform("WEB")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                platform === "WEB"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                  : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <Globe className="h-4 w-4 text-primary" />
              <span>Web Application</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("MOBILE")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                platform === "MOBILE"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
                  : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Mobile Application</span>
            </button>
          </div>
        </div>

        {/* Step 3: Project Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            3. Project Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Artisan Marketplace, HabitTracker, DevPortfolio"
            className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Step 4: Describe your idea */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            4. Describe Your Idea or Learning Goal
          </label>
          <textarea
            required
            rows={4}
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Describe what the app should do, who will use it, or what tech stack you are excited to explore..."
            className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Don&apos;t worry if it&apos;s rough or vague! Our guided interview will refine it step-by-step.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Project...</span>
            </>
          ) : (
            <>
              <span>Proceed to Requirements Discovery</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
