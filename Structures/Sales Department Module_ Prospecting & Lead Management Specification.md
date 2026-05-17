# Sales Department Module: Prospecting & Lead Management Specification

This document outlines the architecture, data model, and tool suite for the Sales Department facet of the custom CMS. It is designed to provide the sales team with a dedicated, isolated environment for prospecting, enriched by AI, and seamlessly integrated with High Level CRM for execution.

## 1. The Contact/Lead Profile View (The "Single Source of Truth")
When a sales representative navigates to a specific lead, the interface must present a comprehensive, three-column layout designed for rapid context acquisition and action.

### Left Column: Core Identity & Quick Actions
This section anchors the profile with the lead's static identity data and immediate action buttons.
*   **Header:** Lead Name, Job Title, and Company Name.
*   **Quick Actions Row:** Buttons for Note, Email, Task, Meeting, and More.
*   **Contact Details:** Work Email, Phone Number, Location (City, Country), Languages spoken, Local Time, and First Interaction Date.
*   **Communication Preferences:** Subscription management links.

### Center Column: Activity & Engagement
This is the dynamic heart of the profile, tracking the entire history of engagement.
*   **Tabbed Navigation:** Overview, Activity, Intelligence, Deals, Notes, Emails.
*   **Profile Overview:** A brief "About" summary, Lead Source (e.g., Website Contact Form), Associated Company link, Company Phone, Company Revenue, and Contact Owner assignment.
*   **Active Sequences:** Display of current automated outreach campaigns the lead is enrolled in, showing current step and enrollment date.
*   **Activity Timeline:** A chronological feed of all interactions, including logged calls (with duration and outcome), scheduled meetings, created tasks (with priority and due dates), and system events (e.g., "added to contacts").
*   **Pinned Notes:** Highlighted qualification notes (e.g., "Budget Confirmed").

### Right Column: AI Insights & Company Context
This section leverages AI to synthesize information and provides broader company context.
*   **AI Contact Summary:** An auto-generated, narrative summary of the relationship history, extracting key points from past calls, emails, and meetings to bring the rep up to speed instantly.
*   **AI "Ask a Question" Prompt:** An interactive input allowing the rep to query the AI about the lead (e.g., "What was their main objection last time?").
*   **Company Data (Firmographics):** Primary company link, Industry, Employee Count range, Annual Revenue, Corporate Phone, Headquarters location, and active Deals associated with the company.

## 2. The Sales Tool Suite
To support the lifecycle leading up to the "Ready to Call" status, the CMS must include the following built-in tools for the sales team:

### A. AI-Powered Lead Scoring & Prioritization
Instead of manually sifting through lists, the system uses an AI model to analyze incoming leads based on firmographics (revenue, employee count), engagement (email opens, website visits), and source. The dashboard presents a "Hot Leads" widget, prioritizing those most likely to convert.

### B. Automated Data Enrichment
When a new lead enters the system (e.g., just an email and name), the system automatically queries external data providers (via API) to populate the missing firmographic data (Company Revenue, Industry, Location) shown in the right-hand column, saving the rep manual research time.

### C. Sequence Builder (Drip Campaigns)
A visual tool allowing sales managers to build multi-step outreach sequences (Email -> Wait 2 days -> LinkedIn Task -> Wait 3 days -> Call Task). Reps can enroll leads into these sequences directly from the profile view.

### D. AI Email Drafter & Contextual Reply
Integrated directly into the "Email" quick action, the AI uses the Contact Summary and recent Activity Timeline to draft highly personalized initial outreach or follow-up emails. The rep reviews, edits, and sends.

### E. The "Ready to Call" Workflow Trigger
The pivotal tool in the system. A prominent status toggle on the profile allows the rep to mark a lead as "Ready to Call" once qualification criteria are met.
*   **Action:** Triggering this status locks the lead record in the CMS and initiates an immediate API webhook to High Level CRM.
*   **Payload:** It pushes the Core Identity, Company Data, and the AI Contact Summary into High Level.
*   **Execution:** The rep switches to High Level to dial, ensuring all telephony and call recording remain natively within the CRM.

## 3. The Sales Dashboard Experience
When a sales rep logs in, they do not see development tasks or overarching project architecture. They see a dashboard optimized for pipeline velocity.

*   **KPI Widgets:** "New Leads Today," "Leads Ready to Call," "Meetings Booked This Week," and "Sequence Conversion Rate."
*   **Task Queue:** A prioritized list of tasks due today (e.g., "Follow up with Mike Banner - Overdue").
*   **Recent Activity Feed:** A real-time stream of engagement (e.g., "Mike Banner opened your email").
*   **Pipeline Visualization:** A Kanban-style board showing leads moving from "New" -> "Enriched" -> "In Sequence" -> "Qualified" -> "Ready to Call (High Level)."
