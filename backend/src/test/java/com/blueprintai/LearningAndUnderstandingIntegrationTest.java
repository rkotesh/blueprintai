package com.blueprintai;

import com.blueprintai.auth.AuthResponse;
import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.learning.ConceptResponse;
import com.blueprintai.learning.GlossaryTermResponse;
import com.blueprintai.learning.QuizAttemptResponse;
import com.blueprintai.learning.QuizResponse;
import com.blueprintai.learning.SubmitQuizAttemptRequest;
import com.blueprintai.project.CreateProjectRequest;
import com.blueprintai.project.ProjectMode;
import com.blueprintai.project.ProjectResponse;
import com.blueprintai.project.TargetPlatform;
import com.blueprintai.understanding.UnderstandingCheckRequest;
import com.blueprintai.understanding.UnderstandingCheckResponse;
import com.blueprintai.user.UserLevel;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LearningAndUnderstandingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private UUID projectId;

    @BeforeEach
    void setUp() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        RegisterRequest regReq = new RegisterRequest(
            "student_" + unique + "@example.com",
            "SecurePassword123!",
            "Student Maker",
            UserLevel.BEGINNER
        );

        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regReq)))
            .andExpect(status().isCreated())
            .andReturn();

        AuthResponse auth = objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class);
        userToken = auth.token();

        CreateProjectRequest projReq = new CreateProjectRequest(
            "DevLearn Hub",
            "An educational portal for learning software architecture",
            ProjectMode.BUILD,
            TargetPlatform.WEB
        );

        MvcResult projRes = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projReq)))
            .andExpect(status().isCreated())
            .andReturn();

        ProjectResponse proj = objectMapper.readValue(projRes.getResponse().getContentAsString(), ProjectResponse.class);
        projectId = proj.id();
    }

    @Test
    void testGlossaryAndConcepts() throws Exception {
        MvcResult glossRes = mockMvc.perform(get("/api/projects/" + projectId + "/learning/glossary")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andReturn();

        List<GlossaryTermResponse> terms = objectMapper.readValue(
            glossRes.getResponse().getContentAsString(),
            new TypeReference<>() {}
        );
        assertFalse(terms.isEmpty());

        MvcResult concRes = mockMvc.perform(get("/api/learning/concepts")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andReturn();

        List<ConceptResponse> concepts = objectMapper.readValue(
            concRes.getResponse().getContentAsString(),
            new TypeReference<>() {}
        );
        assertFalse(concepts.isEmpty());

        mockMvc.perform(post("/api/learning/concepts/" + concepts.get(0).slug() + "/progress?status=UNDERSTOOD")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userStatus").value("UNDERSTOOD"));
    }

    @Test
    void testQuizGenerationAndSubmission() throws Exception {
        MvcResult quizRes = mockMvc.perform(post("/api/projects/" + projectId + "/learning/quiz")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andReturn();

        QuizResponse quiz = objectMapper.readValue(quizRes.getResponse().getContentAsString(), QuizResponse.class);
        assertNotNull(quiz);
        assertFalse(quiz.questions().isEmpty());

        SubmitQuizAttemptRequest attemptReq = new SubmitQuizAttemptRequest(List.of(1, 0, 1));
        MvcResult attemptRes = mockMvc.perform(post("/api/quizzes/" + quiz.id() + "/attempt")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attemptReq)))
            .andExpect(status().isOk())
            .andReturn();

        QuizAttemptResponse attempt = objectMapper.readValue(
            attemptRes.getResponse().getContentAsString(),
            QuizAttemptResponse.class
        );
        assertNotNull(attempt);
        assertTrue(attempt.score() >= 0);
    }

    @Test
    void testUnderstandingCheckEvaluation() throws Exception {
        UnderstandingCheckRequest checkReq = new UnderstandingCheckRequest(
            "My application uses Next.js on the client to send HTTP requests to a Spring Boot API server, which authenticates users with JWT and saves state in PostgreSQL."
        );

        MvcResult checkRes = mockMvc.perform(post("/api/projects/" + projectId + "/check")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(checkReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").isNumber())
            .andExpect(jsonPath("$.feedback.dimensions.architecture").exists())
            .andExpect(jsonPath("$.feedback.dimensions.stack_reasons").exists())
            .andExpect(jsonPath("$.feedback.dimensions.user_flows").exists())
            .andExpect(jsonPath("$.feedback.dimensions.edge_cases").exists())
            .andExpect(jsonPath("$.feedback.strengths").isArray())
            .andReturn();

        UnderstandingCheckResponse response = objectMapper.readValue(
            checkRes.getResponse().getContentAsString(),
            UnderstandingCheckResponse.class
        );
        assertNotNull(response);
        assertTrue(response.score() > 0);

        mockMvc.perform(get("/api/projects/" + projectId + "/check")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }
}
