"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { api } from "@/lib/api";
import { Project, CodeExplanation, Milestone } from "@/types";
import {
  Code2,
  Compass,
  Layers,
  Network,
  Cpu,
  Milestone as MilestoneIcon,
  Bug,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers as LayerIcon,
  Clock,
  History,
  FileCode,
  Lightbulb,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Database,
  Monitor,
  Globe,
  Send,
} from "lucide-react";

const SAMPLE_SNIPPETS: Record<string, { filename: string; language: string; code: string }> = {
  auth: {
    filename: "AuthController.java",
    language: "java",
    code: `@PostMapping("/register")
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    if (userRepository.existsByEmail(req.email())) {
        throw new BadRequestException("Email already registered");
    }
    String hashedPassword = passwordEncoder.encode(req.password());
    User user = User.builder()
        .email(req.email())
        .passwordHash(hashedPassword)
        .displayName(req.displayName())
        .build();
    userRepository.save(user);
    String token = jwtService.generateToken(user);
    return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, user));
}`,
  },
  frontend: {
    filename: "LoginForm.tsx",
    language: "typescript",
    code: `export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      toast.error("Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}`,
  },
  database: {
    filename: "V1__init.sql",
    language: "sql",
    code: `CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);`,
  },
};

export default function ExplainPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const milestoneIdQuery = searchParams.get("milestoneId");

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(milestoneIdQuery || "");
  const [history, setHistory] = useState<CodeExplanation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editor states
  const [filename, setFilename] = useState("AuthController.java");
  const [language, setLanguage] = useState("java");
  const [codeText, setCodeText] = useState(SAMPLE_SNIPPETS.auth.code);

  // Explaining states
  const [isExplaining, setIsExplaining] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<CodeExplanation | null>(null);
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
        const ms = await api.getMilestones(projectId);
        setMilestones(ms);
      } catch {}

      try {
        const list = await api.getExplanations(projectId);
        setHistory(list);
        if (list.length > 0) {
          setCurrentExplanation(list[0]);
        }
      } catch {}
    } catch (err: any) {
      setError(err?.message || "Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSnippet = (key: string) => {
    const s = SAMPLE_SNIPPETS[key];
    if (s) {
      setFilename(s.filename);
      setLanguage(s.language);
      setCodeText(s.code);
    }
  };

  const handleExplain = async () => {
    if (!codeText.trim()) return;

    try {
      setIsExplaining(true);
      setError(null);
      setStatusMessage("Connecting to Grok AI and diagnosing code layers...");

      const res = await api.explainCode(projectId, {
        filename,
        language,
        codeText,
        milestoneId: selectedMilestoneId || undefined,
      });

      setCurrentExplanation(res);
      setHistory((prev) => [res, ...prev.filter((h) => h.id !== res.id)]);
      setStatusMessage(null);
    } catch (err: any) {
      setError(err?.message || "Failed to explain code snippet.");
    } finally {
      setIsExplaining(false);
      setStatusMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading Code Explainer Studio...</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Code Explainer Studio (Flow F)</h1>
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            <span>Explain</span>
          </span>
          <Link
            href={`/projects/${projectId}/debug`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Debug</span>
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

      {/* Main Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Code Editor */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold">Code Input</h2>
              </div>

              {/* Sample snippet buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-muted-foreground mr-1">Load sample:</span>
                <button
                  onClick={() => loadSnippet("auth")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-all"
                >
                  Auth
                </button>
                <button
                  onClick={() => loadSnippet("frontend")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-all"
                >
                  React Form
                </button>
                <button
                  onClick={() => loadSnippet("database")}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-all"
                >
                  SQL Table
                </button>
              </div>
            </div>

            {/* Inputs: Filename, Language, Milestone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. AuthController.java"
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="java">Java</option>
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="sql">SQL</option>
                  <option value="python">Python</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Milestone (Optional)
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="">General Code</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.orderIndex}. {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="rounded-xl border overflow-hidden h-[420px] bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={language}
                value={codeText}
                onChange={(val) => setCodeText(val || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Paste any backend, frontend, or DB code to see its layer and explanation.
            </span>
            <button
              onClick={handleExplain}
              disabled={isExplaining || !codeText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isExplaining ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Explaining...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Explain Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: 3-Tier Explanation & Breakdown */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Layer-by-Layer Explanation</h2>
            </div>
            {currentExplanation && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Layer: {currentExplanation.layer}
              </span>
            )}
          </div>

          {isExplaining && (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">{statusMessage || "Grok AI is analyzing code structure..."}</p>
              <p className="text-xs text-muted-foreground max-w-xs text-center">
                Generating 3-tier mental model: Analogy, Plain English, and Technical Mechanics.
              </p>
            </div>
          )}

          {!isExplaining && !currentExplanation && (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground mb-1">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Code Explained Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Paste code in the left editor and click <strong>Explain Code</strong>. BlueprintAI will break down what it does into real-world analogies, plain English, and technical mechanics.
              </p>
            </div>
          )}

          {!isExplaining && currentExplanation && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Summary */}
              <div className="rounded-xl border bg-muted/40 p-3.5 text-xs text-foreground space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Summary
                </span>
                <p className="font-medium leading-relaxed">{currentExplanation.explanation.summary}</p>
              </div>

              {/* Tier 1: Analogy */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>1. Real-World Analogy</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed italic">
                  "{currentExplanation.explanation.analogy}"
                </p>
              </div>

              {/* Tier 2: Plain English */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>2. Plain English Explanation</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {currentExplanation.explanation.plain_explanation}
                </p>
              </div>

              {/* Tier 3: Technical Detail */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>3. Technical Mechanics</span>
                </div>
                <p className="text-xs font-mono text-foreground/90 leading-relaxed bg-background/50 p-2.5 rounded border">
                  {currentExplanation.explanation.technical_detail}
                </p>
              </div>

              {/* Key Takeaways */}
              {currentExplanation.explanation.key_takeaways && (
                <div className="space-y-2 pt-2 border-t">
                  <span className="text-xs font-bold text-foreground">Key Conceptual Takeaways</span>
                  <ul className="space-y-1.5">
                    {currentExplanation.explanation.key_takeaways.map((t, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
