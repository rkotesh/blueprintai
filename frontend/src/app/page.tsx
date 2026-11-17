import Link from "next/link";
import { ArrowRight, Layers, Compass, Brain, Sparkles, Code2, Bug, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <span>Blueprint<span className="text-primary">AI</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-xs font-semibold text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Understand-While-You-Build Companion</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground mb-6">
            AI helps you build apps. <br />
            <span className="text-primary">We help you understand what you built.</span>
          </h1>

          <p className="text-lg text-muted-foreground sm:text-xl mb-10 leading-relaxed">
            Translate vague ideas into architecture maps, tech stack decisions, animated data traces, and multi-layer code explanations. Build with the confidence of an architect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              Start Building Your Project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border bg-background px-6 py-3.5 text-base font-semibold text-foreground hover:bg-muted/50 transition-all"
            >
              Sign In to Existing Projects
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything between your idea and production code</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                No code jargon without definitions. No mystery black-box systems. Gain the mental models you need to guide AI builders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary mb-4">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Guided Requirements Interview</h3>
                <p className="text-sm text-muted-foreground">
                  Transform a raw idea into structured user flows, data models, and an MVP vs. Later feature split.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Interactive Architecture Map</h3>
                <p className="text-sm text-muted-foreground">
                  Explore full-system visual topologies and trigger animated traces showing how data flows from click to database.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3-Layer Code Explainer</h3>
                <p className="text-sm text-muted-foreground">
                  Paste code to inspect: 1) Analogy, 2) Plain English explanation, and 3) Technical mechanics with system links.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
                  <Bug className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Visual Debug Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Paste an error to pinpoint which architectural layer failed, why it broke, and step-by-step verified fixes.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Milestone Learning Roadmap</h3>
                <p className="text-sm text-muted-foreground">
                  Step-by-step deliverables paired with interactive concept flashcards, auto-linked glossaries, and quizzes.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Understanding Check</h3>
                <p className="text-sm text-muted-foreground">
                  Explain your application in your own words (or voice) and receive a deep, scored comprehension assessment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BlueprintAI. Built with Spring Boot 3 & Next.js 14.</p>
      </footer>
    </div>
  );
}
