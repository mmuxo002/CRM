# File & Document Management Module: Universal Specification

This document defines the architecture, layout, and behavior of the File and Document Management system embedded throughout the CMS. This module is not standalone — it is a **contextual layer** that appears inside any record in the system, including Projects, Client profiles, Deals, Proposals, Agreements, and Packages. The same UI pattern and data model applies universally across all of these contexts.

---

## 1. Contextual Header (Record Identity)
At the top of every file view, the system must display the identity of the parent record to anchor the user's context. This prevents disorientation when navigating deeply into a file tree.

| Field | Description |
|---|---|
| **Record Name** | The name of the parent entity (e.g., "Tazkia Foundation Onboard Website Test") |
| **Owner / Assignee** | Avatar and name of the primary owner of the record |
| **Organization** | The associated company or team (e.g., "Nurency Digital") |
| **Status Badge** | A color-coded, editable status tag (e.g., "HOT," "Qualified," "In Progress") |
| **Probability** | For deal-type records, a visual progress bar showing close probability percentage |
| **Projected Value** | Monetary value associated with the record (e.g., "$50,000") |
| **Deal / Project Stage** | A dropdown selector for the current lifecycle stage |

---

## 2. Tabbed Navigation (The Context Switcher)
Every record in the system exposes a consistent tab bar across the top of its detail view. This allows users to switch between different facets of the same record without losing their place. The tabs must include:

**Task & Activity** — A log of all actions and tasks linked to this record. **Notes** — Free-form annotations by any assigned team member. **Proposal** — The formal proposal document associated with this record. **Agreements** — Signed or pending contracts and legal documents. **Files** — The primary file management view (detailed below). **Inbox** — A threaded communication log with a badge count for unread messages. **Packages** — Service or product packages tied to this record.

The active tab is highlighted with a distinct underline or color indicator. The "Inbox" tab must display a live unread badge count.

---

## 3. The Files Tab: Core Layout

### A. Toolbar (Top of Files View)
The toolbar provides the primary file management actions and view controls.

| Control | Function |
|---|---|
| **File / Link Toggle** | Switch between viewing uploaded files and externally linked resources (e.g., Google Docs, Figma URLs) |
| **Create Folder** | Generates a new named folder within the current record's file space |
| **Add Link** | Attaches an external URL as a named resource in the file list |
| **Upload Files** | Triggers a multi-file upload dialog with drag-and-drop support |
| **List / Grid View Toggle** | Switches the file list between a detailed row view and a visual card grid |
| **Search File** | A real-time search input that filters the file list by name |
| **Uploader Filter** | Dropdown to filter files by the team member who uploaded them |
| **File Type Filter** | Dropdown to filter by format (PDF, DOCX, PNG, MP4, etc.) |
| **Date Filter** | Dropdown to filter by upload month/year (e.g., "January 2024") |

### B. Folder Cards (Visual Organization)
The top section of the Files tab displays color-coded folder cards in a horizontal row. Each folder card shows:
- A distinct color (purple, blue, yellow, green, or custom) to allow quick visual identification.
- The folder name.
- A file count badge (e.g., "51 Files").
- A "Create Folder" placeholder card at the end of the row for quick addition.

Folders can represent any organizational category relevant to the record type. For a **Client** record, folders might be "Contracts," "Invoices," "Design Assets," and "Correspondence." For a **Project** record, folders might be "Specs," "Deliverables," "Meeting Notes," and "Source Files." For a **Proposal** record, folders might be "Drafts," "Approved," "Supporting Data," and "Signatures."

### C. File List (The Detail View)
Below the folder cards, the file list renders all files within the selected folder or the root level. Each row in the list displays the following metadata:

| Column | Description |
|---|---|
| **Checkbox** | Multi-select for bulk actions (delete, move, download) |
| **File Type Icon** | Color-coded icon representing the format (red for PDF, blue for DOCX, etc.) |
| **File Name** | The full document name, clickable to open a preview |
| **Upload Date** | Timestamp of when the file was added (e.g., "Uploaded Today, 20 Dec 2024") |
| **Uploader Avatar** | Profile picture of the team member who uploaded the file |
| **Format Label** | Plain-text format identifier (e.g., "PDF," "PNG," "XLSX") |
| **Actions Menu (⋮)** | Contextual menu for Download, Rename, Move to Folder, Share Link, and Delete |

The list must support **pagination**, displaying a page count and navigation arrows at the bottom (e.g., "Page 1 of 10").

---

## 4. The Right-Hand Context Panel (Deal / Record Info)
The right-hand panel is always visible alongside the file view and provides the full metadata of the parent record. It does not change when switching between tabs, ensuring the user always has record context at hand.

### A. Assignees
Displays all team members assigned to this record with their role designation (e.g., "Owner"). An "+ Assign" button allows managers to add collaborators.

### B. Industry
A single-line field for the industry classification of the associated company or project (e.g., "Business Development," "SaaS," "E-Commerce").

### C. Tags
A multi-tag field allowing free-form or predefined labels (e.g., "webdesign," "Design," "Aslam"). Tags are color-coded and removable inline. An "+ Add" button allows new tags to be appended at any time.

### D. Contact
One or more primary contacts linked to this record. Each contact entry displays:
- Profile avatar, full name, and role/title.
- Email address.
- A "Primary" badge on the main point of contact.
- An actions menu (⋮) for editing or removing the contact link.

### E. Company
The associated organization's full profile summary, including:
- Company name and logo.
- Phone number, email address, and physical address.
- Social and portfolio links (Dribbble, LinkedIn, website).

### F. Custom Fields
An extensible section allowing the Administrator to define additional metadata fields specific to a record type (e.g., "Contract Value," "Renewal Date," "Tech Stack"). An "+ Add" button allows new custom fields to be created inline.

---

## 5. Universal Application Across Record Types
The following table defines how this file module maps to each major record type in the CMS, ensuring a consistent experience regardless of context.

| Record Type | Typical Folder Structure | Key Tabs Shown |
|---|---|---|
| **Project** | Specs, Deliverables, Meeting Notes, Source Files | Tasks, Files, Notes, Inbox |
| **Client** | Contracts, Invoices, Design Assets, Correspondence | Notes, Files, Agreements, Inbox |
| **Proposal** | Drafts, Approved Versions, Supporting Data, Signatures | Proposal, Files, Notes, Agreements |
| **Deal** | Pitch Decks, Quotes, Legal, Communications | Tasks, Files, Proposal, Agreements, Packages |
| **Package** | Service Descriptions, Pricing Sheets, Templates | Files, Notes, Inbox |

---

## 6. Access Control Within the File Module
The file module must respect the same RBAC rules defined in the core CMS architecture. An Apps developer viewing a project record can only see files tagged to their `team_id`. A CRM developer cannot access files within an Apps project record. Sales team members can access files within Client, Deal, and Proposal records but cannot see files within development Project records unless explicitly shared by the Administrator.
