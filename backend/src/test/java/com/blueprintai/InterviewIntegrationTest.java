package com.blueprintai;

import com.blueprintai.auth.AuthResponse;
import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.interview.InterviewNextRequest;
import com.blueprintai.interview.InterviewNextResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InterviewIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Verify multi-turn requirements interview flow with Mock AI client")
    void testInterviewMultiTurnFlow() throws Exception {
        // 1. Register user
        RegisterRequest registerReq = new RegisterRequest(
            "founder@build.co",
            "securePass123",
            "Jordan Founder",
            UserLevel.ZERO
        );

        MvcResult authResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated())
            .andReturn();

        AuthResponse auth = objectMapper.readValue(
            authResult.getResponse().getContentAsString(),
            AuthResponse.class
        );
        String token = auth.token();

        // 2. Create a project
        CreateProjectRequest projectReq = new CreateProjectRequest(
            "CoffeePulse",
            "A subscription club connecting local artisan roasters with coffee enthusiasts",
            ProjectMode.BUILD,
            TargetPlatform.WEB
        );

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projectReq)))
            .andExpect(status().isCreated())
            .andReturn();

        ProjectResponse project = objectMapper.readValue(
            projectResult.getResponse().getContentAsString(),
            ProjectResponse.class
        );

        // 3. Initial GET /interview should create opening turn
        mockMvc.perform(get("/api/projects/" + project.id() + "/interview")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].role").value("AI"))
            .andExpect(jsonPath("$[0].content").isNotEmpty());

        // 4. Submit first answer
        InterviewNextRequest answer1 = new InterviewNextRequest(
            "Users should browse roasted beans, choose grind size, and subscribe monthly."
        );

        mockMvc.perform(post("/api/projects/" + project.id() + "/interview/next")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(answer1)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").isString())
            .andExpect(jsonPath("$.whyAsking").isString());

        // 5. Submit second answer
        InterviewNextRequest answer2 = new InterviewNextRequest(
            "Payments via Stripe, orders stored with tracking numbers, notifications via email."
        );

        mockMvc.perform(post("/api/projects/" + project.id() + "/interview/next")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(answer2)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.question").isString());

        // 6. Submit third answer -> reaches completion turn
        InterviewNextRequest answer3 = new InterviewNextRequest(
            "MVP only needs catalog and subscription checkout; reviews and roaster profiles can come later."
        );

        MvcResult finalResult = mockMvc.perform(post("/api/projects/" + project.id() + "/interview/next")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(answer3)))
            .andExpect(status().isOk())
            .andReturn();

        InterviewNextResponse finalTurn = objectMapper.readValue(
            finalResult.getResponse().getContentAsString(),
            InterviewNextResponse.class
        );

        assertThat(finalTurn.question()).isNotEmpty();
        assertThat(finalTurn.whyAsking()).isNotEmpty();
    }
}
