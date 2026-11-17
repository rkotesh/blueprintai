package com.blueprintai;

import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.auth.AuthResponse;
import com.blueprintai.debug.DebugRequest;
import com.blueprintai.explainer.ExplainCodeRequest;
import com.blueprintai.milestone.MilestoneResponse;
import com.blueprintai.milestone.MilestoneStatus;
import com.blueprintai.milestone.UpdateMilestoneRequest;
import com.blueprintai.project.CreateProjectRequest;
import com.blueprintai.project.ProjectMode;
import com.blueprintai.project.ProjectResponse;
import com.blueprintai.project.TargetPlatform;
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
public class MilestoneExplainerAndDebugIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private String otherUserToken;
    private UUID projectId;

    @BeforeEach
    void setUp() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        // Register main user
        RegisterRequest registerRequest = new RegisterRequest(
            "dev_" + unique + "@example.com",
            "StrongPassword123!",
            "Dev User",
            UserLevel.BEGINNER
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
            regResult.getResponse().getContentAsString(),
            AuthResponse.class
        );
        userToken = authResponse.token();

        // Register secondary user for tenant isolation test
        RegisterRequest otherRequest = new RegisterRequest(
            "other_" + unique + "@example.com",
            "StrongPassword123!",
            "Other User",
            UserLevel.ZERO
        );
        MvcResult otherResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otherRequest)))
            .andExpect(status().isCreated())
            .andReturn();
        AuthResponse otherAuth = objectMapper.readValue(
            otherResult.getResponse().getContentAsString(),
            AuthResponse.class
        );
        otherUserToken = otherAuth.token();

        // Create project
        CreateProjectRequest projectRequest = new CreateProjectRequest(
            "FitTracker Pro",
            "A workout and nutrition planning app for fitness enthusiasts",
            ProjectMode.BUILD,
            TargetPlatform.WEB
        );

        MvcResult projResult = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projectRequest)))
            .andExpect(status().isCreated())
            .andReturn();

        ProjectResponse projectResponse = objectMapper.readValue(
            projResult.getResponse().getContentAsString(),
            ProjectResponse.class
        );
        projectId = projectResponse.id();
    }

    @Test
    void testMilestoneGenerationAndStatusUpdate() throws Exception {
        // 1. Generate milestones
        MvcResult genResult = mockMvc.perform(post("/api/projects/" + projectId + "/milestones/generate")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andReturn();

        List<MilestoneResponse> milestones = objectMapper.readValue(
            genResult.getResponse().getContentAsString(),
            new TypeReference<>() {}
        );

        assertNotNull(milestones);
        assertFalse(milestones.isEmpty());
        assertEquals("Project Setup & Scaffolding", milestones.get(0).title());
        assertEquals(MilestoneStatus.IN_PROGRESS, milestones.get(0).status());
        assertFalse(milestones.get(0).concepts().isEmpty());

        // 2. Fetch milestones via GET
        mockMvc.perform(get("/api/projects/" + projectId + "/milestones")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(milestones.size()));

        // 3. Update first milestone to DONE
        UUID firstId = milestones.get(0).id();
        UpdateMilestoneRequest updateReq = new UpdateMilestoneRequest(MilestoneStatus.DONE, null, null);

        mockMvc.perform(patch("/api/milestones/" + firstId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DONE"));

        // 4. Verify tenant isolation: other user cannot see milestones
        mockMvc.perform(get("/api/projects/" + projectId + "/milestones")
                .header("Authorization", "Bearer " + otherUserToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void testCodeExplainerService() throws Exception {
        ExplainCodeRequest explainReq = new ExplainCodeRequest(
            "AuthController.java",
            "java",
            """
            @PostMapping("/register")
            public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRegisterRequest req) {
                return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
            }
            """,
            null
        );

        mockMvc.perform(post("/api/projects/" + projectId + "/explain")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(explainReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layer").value("backend"))
            .andExpect(jsonPath("$.explanation.analogy").isNotEmpty())
            .andExpect(jsonPath("$.explanation.plain_explanation").isNotEmpty())
            .andExpect(jsonPath("$.explanation.technical_detail").isNotEmpty())
            .andExpect(jsonPath("$.explanation.key_takeaways.length()").value(3));

        // Fetch history
        mockMvc.perform(get("/api/projects/" + projectId + "/explain")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void testDebugGuideService() throws Exception {
        DebugRequest debugReq = new DebugRequest(
            "org.postgresql.util.PSQLException: Connection to localhost:5432 refused",
            "Occurred when launching backend server via mvn spring-boot:run"
        );

        mockMvc.perform(post("/api/projects/" + projectId + "/debug")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(debugReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.layer").value("database"))
            .andExpect(jsonPath("$.result.title").value("Database Connection Refused on Port 5432"))
            .andExpect(jsonPath("$.result.plain_cause").isNotEmpty())
            .andExpect(jsonPath("$.result.fix_steps.length()").value(3))
            .andExpect(jsonPath("$.result.preventive_tip").isNotEmpty());

        // Fetch debug history
        mockMvc.perform(get("/api/projects/" + projectId + "/debug")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }
}
