# Kanban System Specification: Two-Tier Architecture

This document outlines the design and data model for the Kanban-style tracking system within the CMS. To provide both a high-level "pulse" for management and granular task tracking for individual teams, the system utilizes a two-tier Kanban architecture: the **Main Admin Dashboard** and the **Department-Level Boards**.

---

## 1. Tier One: The Main Admin Dashboard (The "Pulse")
The primary view for the Administrator (and other executives) is a macro-level Kanban board designed to track entire projects across the organization, broken down by the department currently handling them.

### A. Column Structure (Departments)
Instead of traditional workflow stages like "To Do" or "In Progress," the columns on the main dashboard represent the core departments of the organization. This allows leadership to see exactly where a project sits in the company's lifecycle.

The columns begin with **Sales / Prospecting**, representing projects currently in the sales cycle or negotiation phase. Next is **Apps Development**, holding projects currently being built by the Apps team. This is followed by **CRM Development**, for projects under the purview of the CRM team. The final columns are **QA / Review**, for projects in final testing before launch, and **Completed / Live**, for successfully deployed projects.

### B. Card Data Model (The Project Card)
Each card in this view represents a full Project or Client Engagement, rather than an individual task. The card must display key high-level information to provide immediate context without requiring a click-through.

| Data Field | Description |
|---|---|
| **Platform/Category Tags** | Color-coded labels for quick identification (e.g., "Mobile," "Web," "B2B") |
| **Priority Badge** | Visual indicator of urgency (e.g., "High Priority" in Red, "Medium Priority" in Yellow) |
| **Project Title** | The name of the engagement (e.g., "Landing Page Revamp") |
| **Brief Description** | A one-sentence summary of the project goal |
| **Assignee Avatars** | Small circular profile pictures of the Lead Developer or Account Executive responsible |
| **Due Date** | The overarching deadline for the current phase |
| **Metrics Row** | Icons showing the total number of tasks, unread comments, and attached files |
| **Progress Bar** | A visual horizontal bar (0-100%) indicating the completion status, calculated automatically |

### C. Drag-and-Drop Handoffs
When the Administrator drags a Project Card from "Sales" to "Apps Development," the system automatically triggers a handoff protocol. It reassigns the project owner, notifies the Apps team lead, and makes the project visible within the Apps team's isolated workspace.

---

## 2. Tier Two: Department-Level Kanban Boards (The "Nitty-Gritty")
When a user navigates into a specific department (e.g., Sales or Apps Dev), the Kanban board changes context. The columns now represent workflow stages, and the cards represent individual Tasks or Leads.

### A. Sales Department Kanban (Pipeline View)
For the Sales team, the Kanban board acts as their deal pipeline. The columns represent the stages of qualification: New Lead, Contact Attempted, Meeting Scheduled, Proposal Sent, and Ready to Call (High Level).

The cards in this view represent individual Leads or Deals. They display the Lead Name or Company Name, a Lead Source Tag (e.g., "Inbound," "Cold Outreach"), the Projected Value, the Assignee Avatar (The Sales Rep), and the Next Action Date. Notably, progress bars are hidden here, replaced by Deal Probability percentages.

### B. Apps & CRM Development Kanban (Sprint View)
For the development teams, the Kanban board acts as their sprint or task tracker. The columns represent the development lifecycle: Backlog / Pipeline, Research / Design, In Development, Code Review, and Done.

The cards in this view represent specific Tasks, closely mirroring the reference design.

| Data Field | Description |
|---|---|
| **Platform Tag** | Contextual label (e.g., "Desktop," "iOS") |
| **Priority Badge** | Visual indicator (e.g., "Low Priority") |
| **Task Title** | The specific action item (e.g., "CRM Admin Dashboard Design") |
| **Task Description** | A brief explanation of the work required |
| **Assignee Avatars** | The specific developers writing the code |
| **Due Date** | The deadline for the specific task |
| **Metrics Row** | Comment count and attachment count |
| **Task Progress Bar** | Reflects the completion of sub-checklists (e.g., "Design Header," "Design Sidebar") |

### C. Data Isolation Enforcement
Crucially, the cards visible on the Apps Development Kanban board are entirely invisible to the CRM Development team, and vice versa. The system relies on the `team_id` tag on every task to ensure the boards only populate with data relevant to the logged-in user's department.
