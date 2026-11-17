package com.blueprintai.export;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/export")
@RequiredArgsConstructor
@Tag(name = "Export & Offline Handbook", description = "Endpoints for exporting project blueprints to Markdown handbooks")
public class ExportController {

    private final ExportService exportService;

    @GetMapping(value = "/handbook.md", produces = "text/markdown;charset=UTF-8")
    @Operation(summary = "Export comprehensive offline Markdown handbook including Mermaid diagrams and glossary")
    public ResponseEntity<byte[]> exportHandbook(@PathVariable UUID projectId) {
        String markdown = exportService.generateMarkdownHandbook(projectId);
        byte[] bytes = markdown.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"blueprint-handbook.md\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/markdown; charset=UTF-8")
                .body(bytes);
    }

    @GetMapping(value = "/handbook/preview")
    @Operation(summary = "Get raw markdown text for preview in UI")
    public ResponseEntity<Map<String, String>> previewHandbook(@PathVariable UUID projectId) {
        String markdown = exportService.generateMarkdownHandbook(projectId);
        return ResponseEntity.ok(Map.of("markdown", markdown));
    }
}
