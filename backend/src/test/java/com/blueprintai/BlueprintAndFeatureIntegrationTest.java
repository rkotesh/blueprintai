package com.blueprintai;

import com.blueprintai.auth.AuthResponse;
import com.blueprintai.auth.RegisterRequest;
import com.blueprintai.blueprint.BlueprintResponse;
import com.blueprintai.feature.FeatureAnalysisResponse;
import com.blueprintai.feature.FeaturePriority;
import com.blueprintai.feature.FeatureResponse;
import com.blueprintai.feature.UpdateFeatureRequest;
import com.blueprintai.interview.InterviewNextRequest;
import com.blueprintai.project.CreateProjectRequest;
import com.blueprintai.project.ProjectMode;
import com.blueprintai.project.ProjectResponse;
import com.blueprintai.project.TargetPlatform;
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
class BlueprintAndFeatureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Verify Flow B: Requirements -> Blueprint Generation -> Feature Normalization & Deep Analysis")
    void testFlowBLifecycle() throws Exception {
        // 1. Register & Login
        RegisterRequest registerReq = new RegisterRequest(
            "architect@blueprint.ai",
            "password123",
            "Taylor Architect",
            UserLevel.INTERMEDIATE
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

        // 2. Create project
        CreateProjectRequest projectReq = new CreateProjectRequest(
            "EventCraft",
            "A ticketing and guest management platform for boutique conferences",
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

        // 3. Interview turn
        InterviewNextRequest turn = new InterviewNextRequest("Organizers create event tickets and attendees purchase with QR codes.");
        mockMvc.perform(post("/api/projects/" + project.id() + "/interview/next")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(turn)))
            .andExpect(status().isOk());

        // 4. Generate Blueprint
        MvcResult blueprintResult = mockMvc.perform(post("/api/projects/" + project.id() + "/blueprint/generate")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(1))
            .andExpect(jsonPath("$.content.summary").isNotEmpty())
            .andExpect(jsonPath("$.content.features").isArray())
            .andReturn();

        BlueprintResponse blueprint = objectMapper.readValue(
            blueprintResult.getResponse().getContentAsString(),
            BlueprintResponse.class
        );
        assertThat(blueprint.content()).isNotNull();

        // 5. Query Normalized Features
        MvcResult featuresResult = mockMvc.perform(get("/api/projects/" + project.id() + "/features")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();

        List<FeatureResponse> features = objectMapper.readValue(
            featuresResult.getResponse().getContentAsString(),
            new TypeReference<List<FeatureResponse>>() {}
        );

        assertThat(features).isNotEmpty();
        FeatureResponse firstFeature = features.get(0);
        assertThat(firstFeature.name()).isNotEmpty();

        // 6. Update Feature Priority (e.g. swap MVP to LATER)
        UpdateFeatureRequest updateReq = new UpdateFeatureRequest(
            null,
            null,
            FeaturePriority.LATER,
            null,
            null,
            "Updated priority for phase testing",
            null
        );

        mockMvc.perform(patch("/api/features/" + firstFeature.id())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.priority").value("LATER"))
            .andExpect(jsonPath("$.logicNotes").value("Updated priority for phase testing"));

        // 7. Perform Feature Deep Breakdown
        MvcResult analysisResult = mockMvc.perform(post("/api/projects/" + project.id() + "/features/" + firstFeature.id() + "/analyze")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.screens").isArray())
            .andExpect(jsonPath("$.data_needed").isArray())
            .andExpect(jsonPath("$.steps_to_build").isArray())
            .andReturn();

        FeatureAnalysisResponse analysis = objectMapper.readValue(
            analysisResult.getResponse().getContentAsString(),
            FeatureAnalysisResponse.class
        );

        assertThat(analysis.screens()).isNotEmpty();
        assertThat(analysis.stepsToBuild()).isNotEmpty();
    }
}
