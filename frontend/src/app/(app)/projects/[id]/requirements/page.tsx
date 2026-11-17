"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Project, InterviewTurn } from "@/types";
import {
  Compass,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Bot,
  User as UserIcon,
} from "lucide-react";

export default function RequirementsInterviewPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [answerInput, setAnswerInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    turnsEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  };

  useEffect(() => {
    if (projectId) {
      loadProjectAndInterview();
    }
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [turns]);

  const loadProjectAndInterview = async () => {
    try {
      setIsLoading(true);
      const [projData, turnsData] = await Promise.all([
        api.getProject(projectId),
        api.getInterviewTurns(projectId),
      ]);
      setProject(projData);
      setTurns(turnsData);

      // Check if conversation already has a completed state
      const userTurns = turnsData.filter((t) => t.role === "USER").length;
      if (userTurns >= 3) {
        setIsDone(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load requirements interview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isSubmitting) return;

    const currentAnswer = answerInput.trim();
    setAnswerInput("");
    setIsSubmitting(true);
    setError(null);

    // Optimistic user turn
    const optimisticTurn: InterviewTurn = {
      id: "temp-" + Date.now(),
      role: "USER",
      content: currentAnswer,
      turnIndex: turns.length,
      createdAt: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, optimisticTurn]);

    try {
      const nextResponse = await api.submitInterviewAnswer(projectId, currentAnswer);

      // Add AI turn
      let aiContent = nextResponse.question;
      if (nextResponse.whyAsking) {
        aiContent += ` [Why: ${nextResponse.whyAsking}]`;
      }

      const aiTurn: InterviewTurn = {
        id: "ai-" + Date.now(),
        role: "AI",
        content: aiContent,
        turnIndex: nextResponse.turnIndex,
        createdAt: new Date().toISOString(),
      };

      setTurns((prev) => [...prev.filter((t) => !t.id.startsWith("temp-")), optimisticTurn, aiTurn]);

      if (nextResponse.done) {
        setIsDone(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to parse question & why note
  const parseAiTurn = (content: string) => {
    const whyMatch = content.match(/\[Why:\s*(.*?)\]$/);
    if (whyMatch) {
      const question = content.replace(/\[Why:\s*(.*?)\]$/, "").trim();
      return { question, whyAsking: whyMatch[1].trim() };
    }
    return { question: content, whyAsking: null };
  };

  const userTurnCount = turns.filter((t) => t.role === "USER").length;
  const progressPercent = Math.min(100, Math.round((userTurnCount / 4) * 100));

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Initiating requirements discovery with BlueprintAI...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Project Header Bar */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project?.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs uppercase font-semibold text-primary">{project?.mode} MODE</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{project?.targetPlatform} PLATFORM</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex flex-col items-end sm:min-w-[180px]">
            <div className="flex items-center justify-between w-full text-xs font-semibold mb-1.5">
              <span className="text-muted-foreground">Discovery Progress</span>
              <span className="text-primary">{isDone ? "100%" : `${progressPercent}%`}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${isDone ? 100 : Math.max(10, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Concept accordion */}
        <div className="rounded-xl bg-muted/40 p-3.5 border text-xs text-foreground flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Original Concept: </span>
            <span className="text-muted-foreground">{project?.ideaText}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Chat Conversation Turns */}
      <div className="space-y-4 min-h-[300px]">
        {turns.map((turn, idx) => {
          if (turn.role === "AI") {
            const { question, whyAsking } = parseAiTurn(turn.content);
            return (
              <div key={turn.id || idx} className="flex items-start gap-3 max-w-2xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-2xl rounded-tl-sm border bg-card p-4 shadow-sm text-sm text-foreground leading-relaxed">
                    {question}
                  </div>
                  {whyAsking && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/15 px-3 py-1.5 text-xs text-muted-foreground">
                      <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        <strong className="text-primary font-medium">Why am I asking this? </strong>
                        {whyAsking}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div key={turn.id || idx} className="flex items-start justify-end gap-3">
                <div className="rounded-2xl rounded-tr-sm bg-primary p-4 shadow-sm text-sm text-primary-foreground max-w-xl leading-relaxed">
                  {turn.content}
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <UserIcon className="h-5 w-5" />
                </div>
              </div>
            );
          }
        })}

        {isSubmitting && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 pl-12">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>BlueprintAI is analyzing your system requirements...</span>
          </div>
        )}

        <div ref={turnsEndRef} />
      </div>

      {/* Done Banner / Blueprint CTA */}
      {isDone && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Requirements Discovery Complete!</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                We have captured your users, core workflows, and MVP boundaries. Ready to formulate the Project Blueprint.
              </p>
            </div>
          </div>

          <Link
            href={`/projects/${projectId}/features`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-all shrink-0"
          >
            <span>Generate Project Blueprint</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Answer Input Box */}
      {!isDone && (
        <form onSubmit={handleSendAnswer} className="sticky bottom-4 z-20">
          <div className="rounded-2xl border bg-card p-3 shadow-lg focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <textarea
              rows={3}
              value={answerInput}
              disabled={isSubmitting}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer(e);
                }
              }}
              placeholder="Type your answer in plain English... (Press Enter to send, Shift+Enter for new line)"
              className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-border/40 px-2">
              <span className="text-[11px] text-muted-foreground">
                Explain in your own words. No technical jargon required.
              </span>
              <button
                type="submit"
                disabled={!answerInput.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Send Answer</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
