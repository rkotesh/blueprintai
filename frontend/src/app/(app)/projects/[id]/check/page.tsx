"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { UnderstandingCheck } from "@/types";
import {
  BrainCircuit,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Layers,
  ArrowRight,
  Compass,
  Network,
  Cpu,
  Milestone as MilestoneIcon,
  Code2,
  Bug,
  GraduationCap,
} from "lucide-react";

export default function UnderstandingCheckPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [summary, setSummary] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestCheck, setLatestCheck] = useState<UnderstandingCheck | null>(null);
  const [history, setHistory] = useState<UnderstandingCheck[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadHistory();

    // Check Web Speech API support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setSummary((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, [projectId]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await api.getUnderstandingHistory(projectId);
      setHistory(data);
      if (data.length > 0 && !latestCheck) {
        setLatestCheck(data[0]);
      }
    } catch (err) {
      console.error("Failed to load understanding history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionInstance) return;

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    try {
      setIsEvaluating(true);
      setError(null);
      const check = await api.evaluateUnderstanding(projectId, summary);
      setLatestCheck(check);
      setHistory((prev) => [check, ...prev.filter((i) => i.id !== check.id)]);
    } catch (err: any) {
      setError(err?.message || "Failed to evaluate understanding. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <BrainCircuit className="h-3.5 w-3.5 text-primary" />
            <span>Check</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Understanding Check
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prove your mastery by explaining your project in your own words. Grok AI will evaluate your
          architectural mental model and pinpoint your strengths and gaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-lg border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Explain Your App
              </h2>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title="Dictate with voice"
                >
                  {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {isRecording ? "Recording..." : "Voice Input"}
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Think about: How does data travel when a user takes an action? Why did you pick your database
              and backend? What edge cases could occur?
            </p>

            <form onSubmit={handleEvaluate} className="space-y-4">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="E.g., In my app, when a user creates a project, the Next.js frontend sends a POST request with a JWT in the Authorization header to Spring Boot. The backend validates it, writes the record to PostgreSQL, and calls Grok AI to generate features..."
                rows={8}
                className="w-full p-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
              />

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={isEvaluating || !summary.trim()}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Grok is Evaluating Your Understanding...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    Submit Explanation for Feedback
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Previous Submissions History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Past Evaluations ({history.length})
              </h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLatestCheck(item)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      latestCheck?.id === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="truncate max-w-[280px]">
                      <p className="font-medium truncate text-foreground">{item.userSummary}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-xs ${
                        item.score >= 80
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : item.score >= 60
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {item.score}/100
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scorecard & Feedback */}
        <div className="lg:col-span-6">
          {latestCheck ? (
            <div className="space-y-6">
              {/* Overall Score Header */}
              <div className="p-6 rounded-lg border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mental Model Score
                  </span>
                  <div className="text-4xl font-extrabold text-foreground mt-1 flex items-baseline gap-1">
                    <span>{latestCheck.score}</span>
                    <span className="text-lg font-normal text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latestCheck.score >= 80
                      ? "Excellent! You think like a software architect."
                      : latestCheck.score >= 60
                      ? "Good foundation! A few concepts still need clarity."
                      : "Keep practicing! Review the recommended concepts below."}
                  </p>
                </div>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    latestCheck.score >= 80
                      ? "bg-emerald-500/10 text-emerald-500"
                      : latestCheck.score >= 60
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <Award className="h-8 w-8" />
                </div>
              </div>

              {/* Dimensions Breakdown */}
              <div className="p-6 rounded-lg border border-border bg-card space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Dimension Breakdown
                </h3>

                <div className="space-y-3">
                  {latestCheck.feedback.dimensions &&
                    Object.entries(latestCheck.feedback.dimensions).map(([key, dim]) => {
                      if (!dim) return null;
                      const title = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-foreground">{title}</span>
                            <span className="text-muted-foreground">{dim.score} / 25</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${(dim.score / 25) * 100}%` }}
                            />
                          </div>
                          {dim.comment && (
                            <p className="text-[11px] text-muted-foreground">{dim.comment}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                  </h4>
                  <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-4">
                    {latestCheck.feedback.strengths?.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Concepts to Review
                  </h4>
                  <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-4">
                    {latestCheck.feedback.gaps?.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Constructive Advice */}
              {latestCheck.feedback.constructive_feedback && (
                <div className="p-4 rounded-lg border border-border bg-card space-y-1.5">
                  <h4 className="text-xs font-semibold text-foreground">Next Steps for Improvement</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {latestCheck.feedback.constructive_feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border bg-card">
              <BrainCircuit className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
              <h3 className="font-semibold text-sm">No Evaluation Yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Write a brief explanation of how your app works on the left, then click submit to receive
                feedback and your mental model score.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
