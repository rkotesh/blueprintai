package com.blueprintai.learning;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.milestone.Milestone;
import com.blueprintai.milestone.MilestoneRepository;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.user.User;
import com.blueprintai.user.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final GlossaryTermRepository glossaryTermRepository;
    private final ConceptRepository conceptRepository;
    private final UserConceptProgressRepository progressRepository;
    private final MilestoneRepository milestoneRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;
    private final AiClient aiClient;
    private final PromptService promptService;

    private static final String QUIZ_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "questions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "question": { "type": "string" },
                  "options": { "type": "array", "items": { "type": "string" } },
                  "correct_index": { "type": "integer" },
                  "explanation": { "type": "string" }
                },
                "required": ["question", "options", "correct_index", "explanation"],
                "additionalProperties": false
              }
            }
          },
          "required": ["questions"],
          "additionalProperties": false
        }
        """;

    @PostConstruct
    @Transactional
    public void seedInitialConceptsAndGlossary() {
        if (conceptRepository.count() == 0) {
            List<Concept> initial = List.of(
                Concept.builder().slug("client-server").title("Client-Server Architecture").summary("The frontend browser acts as the client requesting data; the backend server processes logic and guards the database.").layer("architecture").build(),
                Concept.builder().slug("rest-api").title("RESTful APIs").summary("Representational State Transfer using HTTP verbs (GET, POST, PATCH, DELETE) for standardized communication between systems.").layer("backend").build(),
                Concept.builder().slug("jwt-auth").title("JWT Authentication").summary("Stateless JSON Web Tokens signed cryptographically to prove user identity without requiring server-side session lookup.").layer("auth").build(),
                Concept.builder().slug("bcrypt-hashing").title("Password Hashing (BCrypt)").summary("A slow one-way cryptographic function designed to convert plain-text passwords into irreversible hashes with salt.").layer("auth").build(),
                Concept.builder().slug("relational-db").title("Relational Databases & SQL").summary("Databases organized into strict tables with primary keys, foreign keys, and ACID transaction guarantees.").layer("database").build(),
                Concept.builder().slug("database-indexes").title("Database Indexes").summary("B-tree lookup data structures created on columns (like email) to enable sub-millisecond query lookups instead of scanning every table row.").layer("database").build(),
                Concept.builder().slug("cors-policy").title("CORS (Cross-Origin Resource Sharing)").summary("Browser security mechanism that blocks web pages from making AJAX requests to a different domain unless permitted by the backend.").layer("frontend").build()
            );
            conceptRepository.saveAll(initial);
        }

        if (glossaryTermRepository.count() == 0) {
            List<GlossaryTerm> terms = List.of(
                GlossaryTerm.builder().term("API (Application Programming Interface)").definition("A defined contract allowing two pieces of software to communicate and exchange data.").analogy("A restaurant menu where you order a dish and the kitchen prepares and delivers it.").build(),
                GlossaryTerm.builder().term("JWT (JSON Web Token)").definition("A secure, URL-safe string containing signed user identity and permission claims.").analogy("A stamped concert wristband that lets security guards know you paid without looking up your ticket each time.").build(),
                GlossaryTerm.builder().term("BCrypt").definition("An adaptive key derivation function used for salting and hashing passwords securely.").analogy("A paper shredder with a unique confetti pattern that cannot be reassembled back into the original paper.").build(),
                GlossaryTerm.builder().term("CORS").definition("Cross-Origin Resource Sharing protocol enforced by web browsers to restrict cross-domain data access.").analogy("A bouncer checking if visitors from another neighborhood are on the guest list before admitting them.").build()
            );
            glossaryTermRepository.saveAll(terms);
        }
    }

    @Transactional(readOnly = true)
    public List<GlossaryTermResponse> getGlossary(UUID projectId) {
        return glossaryTermRepository.findByProjectIdOrProjectIsNull(projectId).stream()
            .map(GlossaryTermResponse::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ConceptResponse> getConcepts(UUID userId) {
        List<Concept> allConcepts = conceptRepository.findAll();
        Map<UUID, String> progressMap = new HashMap<>();
        for (UserConceptProgress p : progressRepository.findByUserId(userId)) {
            progressMap.put(p.getConcept().getId(), p.getStatus());
        }

        return allConcepts.stream()
            .map(c -> ConceptResponse.of(c, progressMap.getOrDefault(c.getId(), "UNSEEN")))
            .toList();
    }

    @Transactional
    public ConceptResponse updateConceptProgress(UUID userId, String slug, String newStatus) {
        Concept concept = conceptRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Concept not found with slug: " + slug));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        UserConceptProgress progress = progressRepository.findByUserIdAndConceptId(userId, concept.getId())
            .orElse(UserConceptProgress.builder().user(user).concept(concept).build());

        progress.setStatus(newStatus != null ? newStatus : "UNDERSTOOD");
        progressRepository.save(progress);

        return ConceptResponse.of(concept, progress.getStatus());
    }

    @Transactional
    public QuizResponse generateQuiz(UUID projectId, UUID userId, UUID milestoneId) {
        Project project = getProjectForUser(projectId, userId);

        String conceptsList = "General full-stack web and database concepts.";
        String milestoneTitle = "General Project Architecture";
        Milestone milestone = null;

        if (milestoneId != null) {
            milestone = milestoneRepository.findById(milestoneId).orElse(null);
            if (milestone != null) {
                milestoneTitle = milestone.getTitle();
                if (milestone.getConcepts() != null && !milestone.getConcepts().isEmpty()) {
                    conceptsList = String.join(", ", milestone.getConcepts());
                }
            }
        }

        Map<String, String> variables = Map.of(
            "title", project.getTitle(),
            "concepts", conceptsList,
            "milestone", milestoneTitle
        );

        String userPrompt = promptService.render("quiz_generate.txt", variables);
        String systemPrompt = "You are a technical educator creating conceptual multiple-choice quizzes that build mental models.";

        QuizQuestionsAiOutput output = aiClient.generateStructuredOutput(
            "quiz_generate",
            systemPrompt,
            userPrompt,
            QuizQuestionsAiOutput.class,
            userId,
            "quiz_generate_response",
            QUIZ_SCHEMA
        );

        Quiz quiz = Quiz.builder()
            .project(project)
            .milestone(milestone)
            .questions(output.questions() != null ? output.questions() : List.of())
            .build();

        return QuizResponse.fromEntity(quizRepository.save(quiz));
    }

    @Transactional
    public QuizAttemptResponse submitQuizAttempt(UUID quizId, UUID userId, List<Integer> userAnswers) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        int correctCount = 0;
        List<QuizQuestion> questions = quiz.getQuestions();

        for (int i = 0; i < questions.size(); i++) {
            if (userAnswers != null && i < userAnswers.size()) {
                int chosen = userAnswers.get(i);
                if (chosen == questions.get(i).correct_index()) {
                    correctCount++;
                }
            }
        }

        int scorePercent = questions.isEmpty() ? 0 : Math.round(((float) correctCount / questions.size()) * 100);

        QuizAttempt attempt = QuizAttempt.builder()
            .quiz(quiz)
            .user(user)
            .answers(userAnswers != null ? userAnswers : List.of())
            .score(scorePercent)
            .build();

        QuizAttempt saved = attemptRepository.save(attempt);

        return new QuizAttemptResponse(
            saved.getId(),
            quiz.getId(),
            scorePercent,
            questions.size(),
            saved.getAnswers(),
            questions,
            saved.getCreatedAt()
        );
    }

    private Project getProjectForUser(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        if (!project.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return project;
    }
}
