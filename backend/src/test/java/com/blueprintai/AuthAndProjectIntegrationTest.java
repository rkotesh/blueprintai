package com.blueprintai;

import com.blueprintai.auth.AuthResponse;
import com.blueprintai.auth.LoginRequest;
import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.project.CreateProjectRequest;
import com.blueprintai.project.ProjectMode;
import com.blueprintai.project.ProjectResponse;
import com.blueprintai.project.TargetPlatform;
import com.blueprintai.user.UserLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthAndProjectIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Complete Flow A: Registration, Login, Protected Profile, and Project CRUD")
    void testAuthAndProjectLifecycle() throws Exception {
        // 1. Register a new user
        RegisterRequest registerReq = new RegisterRequest(
            "maker@example.com",
            "password123",
            "Alex Maker",
            UserLevel.BEGINNER
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andExpect(jsonPath("$.user.email").value("maker@example.com"))
            .andExpect(jsonPath("$.user.level").value("BEGINNER"))
            .andReturn();

        AuthResponse auth = objectMapper.readValue(
            registerResult.getResponse().getContentAsString(),
            AuthResponse.class
        );
        String token = auth.token();

        // 2. Reject duplicate email
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Bad Request"));

        // 3. Login with credentials
        LoginRequest loginReq = new LoginRequest("maker@example.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString());

        // 4. Reject bad login credentials
        LoginRequest badLogin = new LoginRequest("maker@example.com", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badLogin)))
            .andExpect(status().isUnauthorized());

        // 5. Access protected /api/me without token -> 401
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));

        // 6. Access protected /api/me with valid token -> 200
        mockMvc.perform(get("/api/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("maker@example.com"))
            .andExpect(jsonPath("$.displayName").value("Alex Maker"));

        // 7. Create a new project
        CreateProjectRequest projectReq = new CreateProjectRequest(
            "FitPulse AI",
            "An AI workout planner that adapts routines from biometrics",
            ProjectMode.BUILD,
            TargetPlatform.WEB
        );

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projectReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("FitPulse AI"))
            .andExpect(jsonPath("$.mode").value("BUILD"))
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andReturn();

        ProjectResponse project = objectMapper.readValue(
            projectResult.getResponse().getContentAsString(),
            ProjectResponse.class
        );
        assertThat(project.id()).isNotNull();

        // 8. List user projects
        mockMvc.perform(get("/api/projects")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(project.id().toString()))
            .andExpect(jsonPath("$[0].title").value("FitPulse AI"));

        // 9. Get project by ID
        mockMvc.perform(get("/api/projects/" + project.id())
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("FitPulse AI"));

        // 10. Delete project
        mockMvc.perform(delete("/api/projects/" + project.id())
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        // 11. Verify deleted
        mockMvc.perform(get("/api/projects/" + project.id())
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }
}
