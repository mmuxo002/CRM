# Development Department Module: Project Lifecycle & Team Collaboration Specification

This document outlines the architecture, data model, and tool suite for the Development Department facet of the custom CMS. It is designed to provide isolated, focused workspaces for the Apps Development Team and the CRM Development Team, ensuring secure project tracking and streamlined task management.

## 1. The Development Dashboard (The "Command Center")
When a developer logs into the system, they are presented with a unified dashboard tailored specifically to their assigned team (Apps or CRM) and active projects. The interface must enforce strict visibility rules, displaying only the tasks, projects, and team members relevant to their department.

### A. Left Navigation & Team Spaces
The sidebar provides quick access to core functions and project spaces.
*   **Global Navigation:** Dashboard, Assigned to me, Tasks, Projects, Schedule, and Companies (clients).
*   **Spaces (The Isolation Layer):** This section dynamically renders based on the user's role.
    *   **Apps Developers:** See "Apps Team" spaces (e.g., Mobile Build, Web Portal).
    *   **CRM Developers:** See "CRM Team" spaces (e.g., API Integrations, Workflow Automation).
    *   **Administrator:** Sees all spaces across both teams.

### B. Top Action Bar
A row of quick-action buttons for rapid data entry.
*   **Create Project:** Initialize a new repository or overarching goal.
*   **Create Task:** Generate a specific, actionable item linked to a project.
*   **Invite to Team:** Add new collaborators to a specific space (Admin/Manager only).
*   **Schedule Meeting:** Book project syncs directly from the dashboard.

### C. Core Dashboard Modules
The main viewing area is divided into four key quadrants for immediate context.
*   **Assigned Tasks (Top Left):** A prioritized list of tasks assigned directly to the logged-in user. Each row displays the task name, associated project, and due date, with a quick-view icon for details.
*   **Projects (Top Right):** Visual cards representing active projects within the user's team space. Cards display the project logo (e.g., GitHub, Shopify), title, and a quick status indicator (e.g., "3 tasks due soon").
*   **Recent Activity (Bottom Left):** A real-time, threaded feed of updates within the team space. This includes task completions, file uploads (with downloadable attachments), comments, and reactions (emojis), fostering asynchronous communication.
*   **People (Bottom Right):** A directory of team members and frequent collaborators within the specific team space (Apps or CRM). It displays profile pictures, names, and contact information, allowing for quick direct messaging or task assignment.

## 2. The Project Lifecycle Tool Suite
To support the development process from inception to deployment, the CMS must include the following built-in tools:

### A. Kanban & Sprint Boards
Within each project, tasks can be visualized in a Kanban board (To Do, In Progress, Review, Done) or organized into time-boxed Sprints. This allows teams to manage their workflow visually and track velocity.

### B. Integrated File & Asset Management
The "Recent Activity" feed and individual task views must support robust file sharing. Developers can upload design assets, PDF specifications, or code snippets directly to a task, ensuring all context remains centralized.

### C. Cross-Functional Handoff Protocol
While Apps and CRM teams are isolated, the system must support controlled handoffs for interconnected projects. A specific "Integration Task" type can be created by the Administrator, bridging the gap between the two teams without exposing the entirety of either team's workspace.

### D. Time Tracking & Capacity Planning
Developers can log time against specific tasks. The system aggregates this data to provide managers with capacity planning tools, ensuring workloads are balanced across the Apps and CRM teams independently.

## 3. Data Isolation & Security Protocol
The most critical aspect of this module is the strict enforcement of the data barrier between the two development teams.

*   **Database Level:** All Projects, Tasks, and Activity Feed entries must be tagged with a `team_id` (Apps, CRM, or Global).
*   **Query Level:** API endpoints serving the dashboard must inherently filter by the user's assigned `team_id`. An Apps developer querying `/api/projects` will only ever receive projects tagged with the Apps `team_id`.
*   **Search Isolation:** The global search bar (top left) must also respect these boundaries. A CRM developer searching for a keyword will not see results from the Apps team's documentation or tasks.
