package com.blueprintai.project;

import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.user.User;
import com.blueprintai.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse createProject(UUID userId, CreateProjectRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
            .user(user)
            .title(request.title().trim())
            .ideaText(request.ideaText().trim())
            .mode(request.mode() != null ? request.mode() : ProjectMode.BUILD)
            .targetPlatform(request.targetPlatform() != null ? request.targetPlatform() : TargetPlatform.WEB)
            .status(ProjectStatus.ACTIVE)
            .build();

        project = projectRepository.save(project);
        return ProjectResponse.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getUserProjects(UUID userId) {
        return projectRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(ProjectResponse::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID userId, UUID projectId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID userId, UUID projectId, UpdateProjectRequest request) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (request.title() != null && !request.title().isBlank()) {
            project.setTitle(request.title().trim());
        }
        if (request.ideaText() != null && !request.ideaText().isBlank()) {
            project.setIdeaText(request.ideaText().trim());
        }
        if (request.mode() != null) {
            project.setMode(request.mode());
        }
        if (request.targetPlatform() != null) {
            project.setTargetPlatform(request.targetPlatform());
        }
        if (request.status() != null) {
            project.setStatus(request.status());
        }

        project = projectRepository.save(project);
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public void deleteProject(UUID userId, UUID projectId) {
        Project project = projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        projectRepository.delete(project);
    }
}
