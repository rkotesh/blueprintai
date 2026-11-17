"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  Compass,
  Layers,
  Network,
  Cpu,
  Milestone as MilestoneIcon,
  Code2,
  Bug,
  GraduationCap,
  BrainCircuit,
  Share2,
} from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadPreview();
  }, [projectId]);

  const loadPreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getHandbookPreview(projectId);
      setMarkdown(res.markdown);
    } catch (err: any) {
      setError(err?.message || "Failed to generate handbook preview.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blueprint-handbook.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sub-Nav Pill Bar */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-max border border-border/50 text-xs font-medium">
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Export</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Offline Architecture & Build Handbook
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Export a comprehensive Markdown document containing the complete architecture diagram (Mermaid),
            features, tech stack reasoning, milestones, and glossary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={isLoading || !markdown}
            className="px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied Markdown" : "Copy Markdown"}
          </button>

          <button
            onClick={handleDownload}
            disabled={isLoading || !markdown}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Download .md File
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Compiling offline architecture handbook...
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              blueprint-handbook.md Preview
            </span>
            <span className="text-xs text-muted-foreground">
              {markdown.split("\n").length} lines • {(markdown.length / 1024).toFixed(1)} KB
            </span>
          </div>
          <pre className="text-xs font-mono bg-background p-4 rounded-md border border-border/60 overflow-x-auto whitespace-pre-wrap leading-relaxed text-foreground/90 max-h-[600px] overflow-y-auto">
            {markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
