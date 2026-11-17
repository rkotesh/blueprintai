package com.blueprintai.ai;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PromptService {

    private final Map<String, String> templateCache = new ConcurrentHashMap<>();

    public String loadTemplate(String templateName) {
        return templateCache.computeIfAbsent(templateName, name -> {
            try {
                ClassPathResource resource = new ClassPathResource("prompts/" + name + ".txt");
                return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to load prompt template: " + name, e);
            }
        });
    }

    public String render(String templateName, Map<String, String> variables) {
        String template = loadTemplate(templateName);
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            template = template.replace(placeholder, entry.getValue() != null ? entry.getValue() : "");
        }
        return template;
    }

    public String renderGlobalSystem(String userLevel) {
        return render("global_system", Map.of("level", userLevel != null ? userLevel : "BEGINNER"));
    }
}
