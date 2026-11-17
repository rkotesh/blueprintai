export type UserLevel = "ZERO" | "BEGINNER" | "INTERMEDIATE";

export interface User {
  id: string;
  email: string;
  displayName: string;
  level: UserLevel;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type ProjectMode = "BUILD" | "LEARN";
export type TargetPlatform = "WEB" | "MOBILE";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  userId: string;
  title: string;
  ideaText: string;
  mode: ProjectMode;
  targetPlatform: TargetPlatform;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  ideaText: string;
  mode: ProjectMode;
  targetPlatform: TargetPlatform;
}

export type InterviewRole = "AI" | "USER";

export interface InterviewTurn {
  id: string;
  role: InterviewRole;
  content: string;
  turnIndex: number;
  createdAt: string;
}

export interface InterviewNextResponse {
  question: string;
  whyAsking: string;
  done: boolean;
  turnIndex: number;
}

export type FeaturePriority = "MVP" | "LATER";
export type FeatureStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Feature {
  id: string;
  projectId: string;
  name: string;
  description: string;
  priority: FeaturePriority;
  screens: string[];
  dataEntities: string[];
  logicNotes: string;
  status: FeatureStatus;
  createdAt: string;
}

export interface Blueprint {
  id: string;
  projectId: string;
  version: number;
  content: {
    summary: string;
    users: string[];
    features: {
      name: string;
      description: string;
      priority: FeaturePriority;
      screens: string[];
      data_entities: string[];
      logic_notes: string;
    }[];
    user_flows: string[];
    data_model: {
      entity: string;
      fields: string[];
      relations: string[];
    }[];
  };
  createdAt: string;
}

export interface FeatureAnalysis {
  screens: string[];
  data_needed: string[];
  api_calls: string[];
  edge_cases: string[];
  security_notes: string[];
  steps_to_build: string[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  layer: "frontend" | "backend" | "database" | "auth" | "external";
  description: string;
  tech: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label: string;
  protocol: string;
}

export interface ArchitectureGraph {
  id: string;
  projectId: string;
  version: number;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  createdAt: string;
}

export interface TraceStep {
  order: number;
  node_id: string;
  edge_id: string;
  analogy: string;
  plain_explanation: string;
  technical_detail: string;
}

export interface TraceResponse {
  trace_id: string;
  action: string;
  steps: TraceStep[];
}

export interface StackAlternative {
  name: string;
  pros: string[];
  cons: string[];
  when_to_choose: string;
}

export interface StackChoice {
  id: string;
  projectId: string;
  layer: string;
  recommended: string;
  alternatives: StackAlternative[];
  reasoning: string;
  userChoice: string;
  createdAt: string;
}

export type MilestoneStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Milestone {
  id: string;
  projectId: string;
  orderIndex: number;
  title: string;
  description: string;
  concepts: string[];
  status: MilestoneStatus;
  createdAt: string;
}

export interface CodeExplanationContent {
  layer: string;
  summary: string;
  analogy: string;
  plain_explanation: string;
  technical_detail: string;
  key_takeaways: string[];
}

export interface CodeExplanation {
  id: string;
  projectId: string;
  milestoneId?: string;
  filename: string;
  language: string;
  codeText: string;
  layer: string;
  explanation: CodeExplanationContent;
  createdAt: string;
}

export interface DebugResultContent {
  layer: string;
  title: string;
  analogy: string;
  plain_cause: string;
  technical_cause: string;
  fix_steps: string[];
  preventive_tip: string;
}

export interface DebugSession {
  id: string;
  projectId: string;
  errorText: string;
  contextText?: string;
  result: DebugResultContent;
  createdAt: string;
}

export interface GlossaryTerm {
  id: string;
  projectId?: string;
  term: string;
  definition: string;
  analogy: string;
  createdAt: string;
}

export interface Concept {
  id: string;
  slug: string;
  title: string;
  summary: string;
  layer: string;
  userStatus: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  projectId: string;
  milestoneId?: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: number[];
  questions: QuizQuestion[];
  createdAt: string;
}

export interface UnderstandingDimension {
  score: number;
  comment: string;
}

export interface UnderstandingFeedback {
  total_score: number;
  dimensions: {
    architecture?: UnderstandingDimension;
    stack_reasons?: UnderstandingDimension;
    user_flows?: UnderstandingDimension;
    edge_cases?: UnderstandingDimension;
    [key: string]: UnderstandingDimension | undefined;
  };
  strengths: string[];
  gaps: string[];
  constructive_feedback: string;
  recommended_concepts: string[];
}

export interface UnderstandingCheck {
  id: string;
  projectId: string;
  userSummary: string;
  score: number;
  feedback: UnderstandingFeedback;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}
