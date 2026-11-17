package com.blueprintai;

import com.blueprintai.architecture.ArchitectureGraphResponse;
import com.blueprintai.architecture.TraceRequest;
import com.blueprintai.architecture.TraceResponse;
import com.blueprintai.auth.AuthResponse;
import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.interview.InterviewNextRequest;
import com.blueprintai.project.CreateProjectRequest;
import com.blueprintai.project.ProjectMode;
import com.blueprintai.project.ProjectResponse;
import com.blueprintai.project.TargetPlatform;
import com.blueprintai.stack.StackChoiceResponse;
import com.blueprintai.stack.UpdateStackChoiceRequest;
import com.blueprintai.user.UserLevel;
import com.fasterxml.jackson.core.type.TypeReference;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ArchitectureAndStackIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Verify Flows C & D: Architecture Generation, Trace, Stack Advice, and Swap-to-Regenerate")
    void testArchitectureAndStackFlows() throws Exception {
        // 1. Setup user and project
        RegisterRequest registerReq = new RegisterRequest(
            "dev@systemcraft.com",
            "password123",
            "Dev Builder",
            UserLevel.BEGINNER
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

        CreateProjectRequest projectReq = new CreateProjectRequest(
            "FleetLogix",
            "Vehicle fleet tracking and predictive maintenance schedule",
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

        // 2. Add turn and generate blueprint
        mockMvc.perform(post("/api/projects/" + project.id() + "/interview/next")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new InterviewNextRequest("Drivers submit trip logs and mechanics log oil changes."))))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/projects/" + project.id() + "/blueprint/generate")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());

        // 3. Flow D: Recommend Stack
        MvcResult stackResult = mockMvc.perform(post("/api/projects/" + project.id() + "/stack/recommend")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();

        List<StackChoiceResponse> stackChoices = objectMapper.readValue(
            stackResult.getResponse().getContentAsString(),
            new TypeReference<List<StackChoiceResponse>>() {}
        );
        assertThat(stackChoices).isNotEmpty();

        // 4. Flow C: Generate Architecture Graph
        MvcResult graphResult = mockMvc.perform(post("/api/projects/" + project.id() + "/architecture/generate")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(1))
            .andExpect(jsonPath("$.nodes").isArray())
            .andExpect(jsonPath("$.edges").isArray())
            .andReturn();

        ArchitectureGraphResponse graph = objectMapper.readValue(
            graphResult.getResponse().getContentAsString(),
            ArchitectureGraphResponse.class
        );
        assertThat(graph.nodes().size()).isGreaterThanOrEqualTo(3);

        // 5. Flow C: Trace an Action
        TraceRequest traceReq = new TraceRequest(null, "Driver submits daily inspection log");
        MvcResult traceResult = mockMvc.perform(post("/api/projects/" + project.id() + "/architecture/trace")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(traceReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.steps").isArray())
            .andReturn();

        TraceResponse trace = objectMapper.readValue(
            traceResult.getResponse().getContentAsString(),
            TraceResponse.class
        );
        assertThat(trace.steps()).isNotEmpty();
        assertThat(trace.steps().get(0).analogy()).isNotEmpty();
        assertThat(trace.steps().get(0).plainExplanation()).isNotEmpty();
        assertThat(trace.steps().get(0).technicalDetail()).isNotEmpty();

        // 6. Flow D: Swap a choice and verify architecture regenerates with version 2
        StackChoiceResponse firstChoice = stackChoices.get(0);
        UpdateStackChoiceRequest swapReq = new UpdateStackChoiceRequest("Vite + React SPA");

        mockMvc.perform(patch("/api/stack/" + firstChoice.id())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(swapReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userChoice").value("Vite + React SPA"));

        // Verify architecture graph has now incremented to version 2
        mockMvc.perform(get("/api/projects/" + project.id() + "/architecture")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(2));
    }
}
