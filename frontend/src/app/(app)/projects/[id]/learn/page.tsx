"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlossaryTerm, Concept, Quiz, QuizAttempt } from "@/types";
import {
  BookOpen,
  HelpCircle,
  GraduationCap,
  Search,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  ChevronRight,
  Lightbulb,
  Compass,
  Network,
  Cpu,
  Milestone as MilestoneIcon,
  Code2,
  Bug,
  BrainCircuit,
  FileText,
} from "lucide-react";

export default function LearnPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [activeTab, setActiveTab] = useState<"glossary" | "concepts" | "quiz">("concepts");

  // Glossary state
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [glossaryFilter, setGlossaryFilter] = useState("");
  const [isLoadingGlossary, setIsLoadingGlossary] = useState(false);

  // Concepts state
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>("ALL");
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadGlossary();
    loadConcepts();
  }, [projectId]);

  const loadGlossary = async () => {
    try {
      setIsLoadingGlossary(true);
      const data = await api.getGlossary(projectId);
      setGlossary(data);
    } catch (err) {
      console.error("Failed to load glossary:", err);
    } finally {
      setIsLoadingGlossary(false);
    }
  };

  const loadConcepts = async () => {
    try {
      setIsLoadingConcepts(true);
      const data = await api.getConcepts(projectId);
      setConcepts(data);
    } catch (err) {
      console.error("Failed to load concepts:", err);
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  const toggleConceptStatus = async (concept: Concept) => {
    const newStatus = concept.userStatus === "UNDERSTOOD" ? "UNSEEN" : "UNDERSTOOD";
    try {
      await api.updateConceptProgress(projectId, concept.slug, newStatus);
      setConcepts((prev) =>
        prev.map((c) => (c.slug === concept.slug ? { ...c, userStatus: newStatus } : c))
      );
    } catch (err) {
      console.error("Failed to update concept progress:", err);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setIsGeneratingQuiz(true);
      setQuizError(null);
      setQuizResult(null);
      setSelectedAnswers({});
      const quiz = await api.generateQuiz(projectId);
      setActiveQuiz(quiz);
    } catch (err: any) {
      setQuizError(err?.message || "Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (quizResult) return; // locked after submission
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answersArray = activeQuiz.questions.map((_, i) =>
      selectedAnswers[i] !== undefined ? selectedAnswers[i] : -1
    );

    try {
      setIsSubmittingQuiz(true);
      const attempt = await api.submitQuizAttempt(projectId, activeQuiz.id, answersArray);
      setQuizResult(attempt);
    } catch (err: any) {
      setQuizError(err?.message || "Failed to submit quiz attempt.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const filteredGlossary = glossary.filter(
    (g) =>
      g.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
      g.definition.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
      g.analogy.toLowerCase().includes(glossaryFilter.toLowerCase())
  );

  const filteredConcepts =
    selectedLayer === "ALL"
      ? concepts
      : concepts.filter((c) => c.layer?.toLowerCase() === selectedLayer.toLowerCase());

  const layersList = ["ALL", ...Array.from(new Set(concepts.map((c) => c.layer?.toUpperCase()).filter(Boolean)))];

  const understoodCount = concepts.filter((c) => c.userStatus === "UNDERSTOOD").length;
  const progressPercent = concepts.length > 0 ? Math.round((understoodCount / concepts.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-foreground font-semibold shadow-sm">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span>Learn</span>
          </span>
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

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Learning Layer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Master the core concepts, architecture terms, and evaluate your knowledge with project-tailored quizzes.
          </p>
        </div>

        {/* Progress Bar Widget */}
        <div className="bg-card border border-border p-3 rounded-lg flex items-center gap-4 min-w-[260px]">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
              <span>Concepts Mastered</span>
              <span className="text-foreground font-semibold">
                {understoodCount} / {concepts.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("concepts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "concepts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          Concept Cards ({concepts.length})
        </button>
        <button
          onClick={() => setActiveTab("glossary")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "glossary"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Glossary ({glossary.length})
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "quiz"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Knowledge Quiz
        </button>
      </div>

      {/* Tab: Concept Cards */}
      {activeTab === "concepts" && (
        <div className="space-y-6">
          {/* Layer Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Layer:
            </span>
            {layersList.map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedLayer === layer
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          {isLoadingConcepts ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
              Loading concepts...
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              No concepts found for layer: {selectedLayer}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConcepts.map((concept) => {
                const isUnderstood = concept.userStatus === "UNDERSTOOD";
                return (
                  <div
                    key={concept.slug}
                    className={`p-5 rounded-lg border transition-all flex flex-col justify-between ${
                      isUnderstood
                        ? "bg-card border-emerald-500/30 dark:border-emerald-500/20 shadow-sm"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {concept.layer || "GENERAL"}
                        </span>
                        {isUnderstood && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Understood
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-base text-foreground mb-2">{concept.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{concept.summary}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                      <button
                        onClick={() => toggleConceptStatus(concept)}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                          isUnderstood
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {isUnderstood ? "Mark as Review" : "Mark as Understood"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Glossary */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search terms, analogies, definitions..."
              value={glossaryFilter}
              onChange={(e) => setGlossaryFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {isLoadingGlossary ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
              Loading glossary...
            </div>
          ) : filteredGlossary.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              No matching terms found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm">{item.term}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.definition}</p>
                  {item.analogy && (
                    <div className="bg-muted/50 p-2.5 rounded border border-border/40 text-xs text-foreground/90 flex gap-2">
                      <span className="font-semibold text-primary shrink-0">Analogy:</span>
                      <span>{item.analogy}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quiz */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {!activeQuiz && !isGeneratingQuiz && (
            <div className="p-8 text-center rounded-lg border border-dashed border-border bg-card max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Test Your Architecture Understanding</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  BlueprintAI generates a 3-question quiz specifically tailored to your project blueprint, stack, and features.
                </p>
              </div>
              <button
                onClick={handleGenerateQuiz}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Project Quiz
              </button>
              {quizError && <p className="text-xs text-destructive">{quizError}</p>}
            </div>
          )}

          {isGeneratingQuiz && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Grok AI is analyzing your project and crafting personalized questions...
            </div>
          )}

          {activeQuiz && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Blueprint Knowledge Check
                </h2>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New Quiz
                </button>
              </div>

              {quizResult && (
                <div
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    quizResult.score === quizResult.totalQuestions
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-primary/10 border-primary/20 text-foreground"
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-sm">
                      Quiz Completed! You scored {quizResult.score} out of {quizResult.totalQuestions}.
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      {quizResult.score === quizResult.totalQuestions
                        ? "Flawless score! You have a great mental model of this architecture."
                        : "Review the question explanations below to strengthen your understanding."}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {activeQuiz.questions.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[qIdx];
                  const isSubmitted = !!quizResult;
                  const isCorrect = isSubmitted && userAnswer === q.correct_index;

                  return (
                    <div
                      key={qIdx}
                      className={`p-5 rounded-lg border bg-card space-y-3 ${
                        isSubmitted
                          ? isCorrect
                            ? "border-emerald-500/30"
                            : "border-destructive/30"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0 mt-0.5">
                          Q{qIdx + 1}
                        </span>
                        <h4 className="font-medium text-sm text-foreground">{q.question}</h4>
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          let optStyle =
                            "border-border bg-background hover:border-primary/40 text-foreground";

                          if (isSubmitted) {
                            if (optIdx === q.correct_index) {
                              optStyle = "border-emerald-500 bg-emerald-500/10 text-foreground font-medium";
                            } else if (isSelected && optIdx !== q.correct_index) {
                              optStyle = "border-destructive bg-destructive/10 text-foreground";
                            } else {
                              optStyle = "border-border/40 opacity-50";
                            }
                          } else if (isSelected) {
                            optStyle = "border-primary bg-primary/10 text-foreground font-medium";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(qIdx, optIdx)}
                              disabled={isSubmitted}
                              className={`w-full text-left p-3 rounded-md border text-xs transition-colors flex items-center justify-between ${optStyle}`}
                            >
                              <span>{option}</span>
                              {isSubmitted && optIdx === q.correct_index && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isSubmitted && q.explanation && (
                        <div className="mt-3 p-3 bg-muted/60 rounded border border-border/40 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground mr-1">Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizResult && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={
                      isSubmittingQuiz ||
                      Object.keys(selectedAnswers).length < activeQuiz.questions.length
                    }
                    className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmittingQuiz ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Submit Answers
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
