package com.blueprintai;

import com.blueprintai.auth.AuthResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Verify Markdown handbook export and preview endpoints")
    void testExportHandbook() throws Exception {
        // 1. Register user
        RegisterRequest registerReq = new RegisterRequest(
            "export@build.co",
            "securePass123",
            "Export Tester",
            UserLevel.ZERO
        );

        MvcResult authResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(authResult.getResponse().getContentAsString(), AuthResponse.class);
        String token = "Bearer " + auth.token();

        // 2. Create project
        CreateProjectRequest projectReq = new CreateProjectRequest(
            "EventCloud",
            "A ticket management system for conferences",
            ProjectMode.BUILD,
            TargetPlatform.WEB
        );

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(projectReq)))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectResponse project = objectMapper.readValue(projectResult.getResponse().getContentAsString(), ProjectResponse.class);

        // 3. Request Markdown handbook download
        MvcResult exportResult = mockMvc.perform(get("/api/projects/" + project.id() + "/export/handbook.md")
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"blueprint-handbook.md\""))
                .andReturn();

        String markdown = exportResult.getResponse().getContentAsString();
        assertThat(markdown).contains("# EventCloud - Architecture & Build Handbook");
        assertThat(markdown).contains("## 2. System Architecture Diagram");
        assertThat(markdown).contains("```mermaid");
        assertThat(markdown).contains("## 6. Architecture Glossary & Concept Cheatsheet");

        // 4. Request JSON preview
        mockMvc.perform(get("/api/projects/" + project.id() + "/export/handbook/preview")
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.markdown").exists());
    }
}
