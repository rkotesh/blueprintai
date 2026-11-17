import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LearnPage from "../app/(app)/projects/[id]/learn/page";

const { mockGlossary, mockConcepts, mockQuiz, mockQuizAttempt } = vi.hoisted(() => {
  const mockGlossary = [
    {
      id: "term-1",
      term: "JWT (JSON Web Token)",
      definition: "A digitally signed token containing claims about the user identity.",
      analogy: "A theme park wristband stamped by security.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "term-2",
      term: "Foreign Key",
      definition: "A field in one table that references the primary key of another table.",
      analogy: "A numbered baggage claim ticket linked to a specific passenger record.",
      createdAt: new Date().toISOString(),
    },
  ];

  const mockConcepts = [
    {
      id: "c-1",
      slug: "stateless-auth",
      title: "Stateless Authentication",
      summary: "Every request contains sufficient credential state so the server does not store session tables.",
      layer: "AUTH",
      userStatus: "UNSEEN",
    },
    {
      id: "c-2",
      slug: "relational-foreign-keys",
      title: "Relational Foreign Keys",
      summary: "Preserving referential integrity across relational tables.",
      layer: "DATABASE",
      userStatus: "UNDERSTOOD",
    },
  ];

  const mockQuiz = {
    id: "quiz-1",
    projectId: "proj-123",
    questions: [
      {
        question: "Why does the backend sign JWTs with a cryptographic secret?",
        options: [
          "To encrypt database passwords",
          "To verify token integrity without querying the database each time",
          "To make the HTTP requests faster",
          "To allow client-side password resets",
        ],
        correct_index: 1,
        explanation: "Digital signatures ensure tokens cannot be tampered with by the client or middleboxes.",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const mockQuizAttempt = {
    id: "attempt-1",
    quizId: "quiz-1",
    score: 1,
    totalQuestions: 1,
    answers: [1],
    questions: mockQuiz.questions,
    createdAt: new Date().toISOString(),
  };

  return { mockGlossary, mockConcepts, mockQuiz, mockQuizAttempt };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "proj-123" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getGlossary: vi.fn().mockResolvedValue(mockGlossary),
    getConcepts: vi.fn().mockResolvedValue(mockConcepts),
    updateConceptProgress: vi.fn().mockResolvedValue({
      slug: "stateless-auth",
      userStatus: "UNDERSTOOD",
    }),
    generateQuiz: vi.fn().mockResolvedValue(mockQuiz),
    submitQuizAttempt: vi.fn().mockResolvedValue(mockQuizAttempt),
  },
}));

describe("LearnPage", () => {
  it("renders concept cards and toggles understood state", async () => {
    render(<LearnPage />);

    await waitFor(() => {
      expect(screen.getByText("Stateless Authentication")).toBeInTheDocument();
      expect(screen.getByText("Relational Foreign Keys")).toBeInTheDocument();
    });

    // Verify progress tracking
    expect(screen.getByText(/Concepts Mastered/i)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();

    // Toggle concept state
    const markButton = screen.getByText("Mark as Understood");
    fireEvent.click(markButton);

    await waitFor(() => {
      expect(screen.getAllByText("Mark as Review")).toHaveLength(2);
    });
  });

  it("switches to glossary and filters terms", async () => {
    render(<LearnPage />);

    await waitFor(() => {
      expect(screen.getByText(/Glossary \(2\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Glossary \(2\)/i));

    await waitFor(() => {
      expect(screen.getByText("JWT (JSON Web Token)")).toBeInTheDocument();
      expect(screen.getByText("Foreign Key")).toBeInTheDocument();
      expect(screen.getByText("A theme park wristband stamped by security.")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search terms, analogies/i);
    fireEvent.change(searchInput, { target: { value: "wristband" } });

    expect(screen.getByText("JWT (JSON Web Token)")).toBeInTheDocument();
    expect(screen.queryByText("Foreign Key")).not.toBeInTheDocument();
  });

  it("generates and completes a knowledge quiz", async () => {
    render(<LearnPage />);

    fireEvent.click(screen.getByText("Knowledge Quiz"));

    await waitFor(() => {
      expect(screen.getByText("Test Your Architecture Understanding")).toBeInTheDocument();
    });

    const generateBtn = screen.getByText("Generate Project Quiz");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText("Why does the backend sign JWTs with a cryptographic secret?")).toBeInTheDocument();
    });

    const correctOption = screen.getByText("To verify token integrity without querying the database each time");
    fireEvent.click(correctOption);

    const submitBtn = screen.getByText("Submit Answers");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Quiz Completed! You scored 1 out of 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Digital signatures ensure tokens cannot be tampered/i)).toBeInTheDocument();
    });
  });
});
