package com.netcracker.edu.tms.project.controller;

import com.netcracker.edu.tms.project.model.*;
import com.netcracker.edu.tms.project.service.ProjectService;
import com.netcracker.edu.tms.security.model.UserPrincipal;
import com.netcracker.edu.tms.user.model.User;
import com.netcracker.edu.tms.user.model.UserWithPassword;
import com.netcracker.edu.tms.user.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.el.stream.Stream;
import org.hibernate.validator.internal.util.logging.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@RestController
@PreAuthorize("hasRole('USER')")
@RequestMapping("/api/projects")
public class ProjectRestController {

    private ProjectService projectService;
    private UserService userService;

    @Autowired
    public ProjectRestController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/")
    public ResponseEntity<Iterable<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/")
    public ResponseEntity<Project> createProject(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @RequestBody ProjectInfo projectInfo) {

        User creator = userService.getUserByEmail(currentUser.getUsername());
        Project project = projectInfo.getProject();
        project.setCreator(creator);

        Iterable<ProjectMember> team = projectInfo.getTeam();

        if (team == null || !team.iterator().hasNext())
            return ResponseEntity.badRequest().build();

        team = processTeam(team);

        //save project
        Project created = projectService.addProject(project);

        //add team
        projectService.setProjectsTeam(created, team);

        //notify team
        projectService.sendInvitationToNewProject(created);

        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable(name = "id") BigInteger id) {
        try{
            Project project = projectService.getProjectById(id);
            return ResponseEntity.ok(project);
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @Transactional
    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @RequestBody ProjectInfo projectInfo, @PathVariable BigInteger id) {

        User creator = userService.getUserByEmail(currentUser.getUsername());
        Project newProject = projectInfo.getProject();
        Iterable<ProjectMember> team = projectInfo.getTeam();

        if (team == null || !team.iterator().hasNext())
            return ResponseEntity.badRequest().build();

        Project projectToUpdate = projectService.getProjectById(id);

        if (!projectToUpdate.getCreator().equals(creator))
            return ResponseEntity.badRequest().build();

        team = processTeam(team);

        try {
            Project project = projectService.updateProject(projectToUpdate, newProject);

            projectService.deleteTeam(project);
            projectService.setProjectsTeam(project, team);
            return ResponseEntity.ok(project);

        } catch (Exception exception) {
            log.error(exception.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/member/{id}")
    public ResponseEntity<Iterable<ProjectMember>> getProjectsByMember(@PathVariable(name="id") BigInteger id) {
        User user = userService.getUserById(id);
        Iterable<ProjectMember> projects = projectService.getProjectsWithUser(user);
        return ResponseEntity.ok(projects);
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/creator/{id}")
    public ResponseEntity<Iterable<Project>> getAllProjects(@PathVariable(name = "id") BigInteger id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(projectService.getProjectsByCreator(user));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/team/{id}")
    public ResponseEntity<Iterable<UserWithRole>> getTeamByProjectId(@PathVariable(name = "id") BigInteger id) {
        Project project = projectService.getProjectById(id);

        return ResponseEntity.ok(StreamSupport.stream(projectService.getTeamByProject(project).spliterator(), false)
                .map(UserWithRole::of)
                .collect(Collectors.toList()));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("{id}")
    public ResponseEntity<HttpStatus> deleteProject(@AuthenticationPrincipal UserPrincipal currentUser,
                                                    @PathVariable(name = "id") BigInteger id) {

        User user = userService.getUserByEmail(currentUser.getUsername());
        Project project = projectService.getProjectById(id);

        if (project.getCreator().equals(user)
                && projectService.deleteProject(project)
        )
            return ResponseEntity.ok().build();

        return ResponseEntity.badRequest().build();
    }

    @Data
    @AllArgsConstructor
    private static class UserWithRole {
        private User user;
        private ProjectRole role;

        private static UserWithRole of(ProjectMember projectMember) {
            return new UserWithRole(projectMember.getUser(), projectMember.getRole());
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class ProjectInfo {
        private Project project;
        private Iterable<ProjectMember> team;
    }

    private Iterable<ProjectMember> processTeam(Iterable<ProjectMember> team) {
        return StreamSupport.stream(team.spliterator(), false)
                .map(this::processMember).collect(Collectors.toList());
    }

    private ProjectMember processMember(ProjectMember member) {
        User user = userService.getUserByEmail(member.getUser().getEmail());
        ProjectRole role = projectService.createRoleIfNotExists(member.getRole().getName());

        member.setRole(role);
        member.setUser(user);

        return member;
    }

}
