"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project } from "@/types";
import { Compass, Sparkles, Loader2 } from "lucide-react";

export default function RequirementsPlaceholderPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      api.getProject(projectId)
        .then(setProject)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading project requirements...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project?.title || "Project Requirements"}</h1>
            <p className="text-xs text-muted-foreground">Mode: {project?.mode} | Platform: {project?.targetPlatform}</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4 border text-sm text-foreground mb-6">
          <span className="font-semibold block mb-1">Your Initial Concept:</span>
          <p className="text-muted-foreground leading-relaxed">{project?.ideaText}</p>
        </div>

        <div className="flex items-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-foreground">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <span>
            Project record initialized. The AI guided interview engine will engage in Phase 2 to turn this into a structured Project Blueprint.
          </span>
        </div>
      </div>
    </div>
  );
}
