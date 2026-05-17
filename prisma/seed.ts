import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  await db.activity.deleteMany();
  await db.note.deleteMany();
  await db.comment.deleteMany();
  await db.fileAsset.deleteMany();
  await db.folder.deleteMany();
  await db.tag.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.campaignTag.deleteMany();
  await db.campaignLink.deleteMany();
  await db.campaign.deleteMany();
  await db.lead.deleteMany();
  await db.deal.deleteMany();
  await db.contact.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);
  const baseUser = { passwordHash: pw, mustResetPassword: false, accessDepartments: "all", isActive: true };

  const admin = await db.user.create({ data: { ...baseUser, email: "admin@innovat3.com", name: "Jason Brandt", role: "ADMIN", teamId: "GLOBAL", title: "Administrator", image: "https://i.pravatar.cc/80?img=12" } });
  const sales = await db.user.create({ data: { ...baseUser, email: "sales@innovat3.com", name: "Olivia Rhye", role: "SALES", teamId: "SALES", title: "Account Executive", image: "https://i.pravatar.cc/80?img=47", accessDepartments: "sales" } });
  const apps = await db.user.create({ data: { ...baseUser, email: "apps@innovat3.com", name: "Ethan James", role: "APPS_DEV", teamId: "APPS", title: "Senior iOS Engineer", image: "https://i.pravatar.cc/80?img=14", accessDepartments: "development" } });
  const crm = await db.user.create({ data: { ...baseUser, email: "crm@innovat3.com", name: "Liam Alexander Smith", role: "CRM_DEV", teamId: "CRM", title: "CRM Integrations Lead", image: "https://i.pravatar.cc/80?img=33", accessDepartments: "crm" } });
  const noah = await db.user.create({ data: { ...baseUser, email: "noah@innovat3.com", name: "Noah Benjamin", role: "APPS_DEV", teamId: "APPS", title: "Front-End Engineer", image: "https://i.pravatar.cc/80?img=52", accessDepartments: "development" } });
  const oliver = await db.user.create({ data: { ...baseUser, email: "oliver@innovat3.com", name: "Oliver Michael", role: "APPS_DEV", teamId: "APPS", title: "UX Designer", image: "https://i.pravatar.cc/80?img=13", accessDepartments: "development,crm" } });
  const lucas = await db.user.create({ data: { ...baseUser, email: "lucas@innovat3.com", name: "Lucas Daniel", role: "CRM_DEV", teamId: "CRM", title: "Automation Engineer", image: "https://i.pravatar.cc/80?img=7", accessDepartments: "crm" } });
  const mason = await db.user.create({ data: { ...baseUser, email: "mason@innovat3.com", name: "Mason Christopher", role: "APPS_DEV", teamId: "APPS", title: "Mobile Engineer", image: "https://i.pravatar.cc/80?img=15", accessDepartments: "development" } });

  const fillaDesign = await db.company.create({ data: { name: "Filla Design Agency", industry: "Business Development", website: "filla.co", phone: "+44 67 7345 4846", email: "hello@filla.co", address: "London, United Kingdom", headquarters: "London, United Kingdom", revenue: "$345.2K", employees: "50 - 100", logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Filla" } });
  const nurency = await db.company.create({ data: { name: "Nurency Digital", industry: "Business Development", website: "nurency.io", phone: "+1 555-0182", email: "contact@nurency.io", address: "New York, USA", logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Nurency" } });
  const tazkia = await db.company.create({ data: { name: "Tazkia Foundation", industry: "Non-profit", website: "tazkia.org", phone: "+1 555-0111", email: "info@tazkia.org", address: "Toronto, Canada", logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Tazkia" } });

  const mikeBanner = await db.contact.create({ data: { name: "Mike Banner", email: "mikebanner@crm.com", title: "Senior Product Manager at Filla Design", phone: "+094 8295263", avatarUrl: "https://i.pravatar.cc/80?img=60", isPrimary: true, companyId: fillaDesign.id } });
  const nasirUddin = await db.contact.create({ data: { name: "Nasir Uddin", email: "nasir@nurency.io", title: "Founder & CEO", phone: "+1 555-0123", avatarUrl: "https://i.pravatar.cc/80?img=56", isPrimary: true, companyId: nurency.id } });

  const mikeLead = await db.lead.create({ data: { name: "Mike Banner", email: "mikebanner@crm.com", phone: "+094 8295263", title: "Senior Product Manager", location: "London, United Kingdom", languages: "English, French", score: 89, status: "MEETING", source: "Website Contact Form", projectedValue: 50000, probability: 65, nextAction: new Date("2026-04-20"), summary: "On February 14, 2026, a call took place during their team's intro cupcake options, aiming to finalize flavors for the next week. An email sent on Feb 15, 2026, provided a full cost breakdown including cupcake offerings and initiated discussions about pricing. A meeting is scheduled for April 4, 2026, for a factory tour, and there's a task to follow up regarding different cupcake models on the following Tuesday.", companyId: fillaDesign.id, assignedTo: sales.id } });
  await db.lead.create({ data: { name: "Sarah Jenkins", email: "sarah@example.com", score: 92, status: "NEW", source: "Inbound", projectedValue: 75000, probability: 30, companyId: nurency.id, assignedTo: sales.id } });
  await db.lead.create({ data: { name: "Rafiqur Rahman", email: "rafiqur@agency.co", score: 74, status: "PROPOSAL", source: "Cold Outreach", projectedValue: 28000, probability: 55, companyId: tazkia.id, assignedTo: sales.id } });
  await db.lead.create({ data: { name: "Diana Chen", email: "diana@retailco.com", score: 66, status: "CONTACTED", source: "Referral", projectedValue: 18000, probability: 40, companyId: nurency.id, assignedTo: sales.id } });
  await db.lead.create({ data: { name: "Carlos Mendez", email: "carlos@logistics.io", score: 81, status: "READY_TO_CALL", source: "Inbound", projectedValue: 45000, probability: 80, companyId: fillaDesign.id, assignedTo: sales.id } });

  await db.note.create({ data: { leadId: mikeLead.id, pinned: true, body: "Qualification Call - Budget Confirmed. Confirmed allocated budget for external design support in Q2." } });
  await db.activity.createMany({ data: [
    { kind: "CALL", title: "Logged call with Filla Design Agency", body: "24m · Call outcome · Positive", teamId: "SALES", leadId: mikeLead.id, actorId: sales.id },
    { kind: "MEETING", title: "Meeting Scheduled with Mike Banner by Rafiqur Rahman", body: "Product Roadmap · Next stage planning", teamId: "SALES", leadId: mikeLead.id, actorId: sales.id },
    { kind: "TASK", title: "Task created with Filla Design", body: "Follow up with Mike Banner · Medium", teamId: "SALES", leadId: mikeLead.id, actorId: sales.id },
    { kind: "SYSTEM", title: "Added to contacts", body: null, teamId: "SALES", leadId: mikeLead.id, actorId: sales.id },
  ] });

  const p1 = await db.project.create({ data: { name: "Landing Page Revamp", description: "Revamp the landing page for higher conversions.", teamId: "APPS", stage: "APPS_DEV", priority: "MEDIUM", categoryTag: "Mobile", serviceType: "Website Build", onboarded: true, mrr: 0, progress: 40, dueDate: new Date("2026-03-28"), ownerId: oliver.id, companyId: fillaDesign.id } });
  const p2 = await db.project.create({ data: { name: "B2B Mobile App", description: "Mobile App for business clients and B2B.", teamId: "APPS", stage: "APPS_DEV", priority: "HIGH", categoryTag: "Mobile", serviceType: "Mobile App", onboarded: true, mrr: 2400, progress: 55, dueDate: new Date("2026-05-15"), ownerId: apps.id, companyId: nurency.id } });
  const p3 = await db.project.create({ data: { name: "About Us Page Revamp", description: "Restructure about page copy.", teamId: "APPS", stage: "QA", priority: "HIGH", categoryTag: "Web", serviceType: "Website Build", onboarded: true, mrr: 0, progress: 80, dueDate: new Date("2026-03-25"), ownerId: noah.id, companyId: fillaDesign.id } });
  const p4 = await db.project.create({ data: { name: "CRM Admin Dashboard", description: "Internal GHL sub-account dashboard with workflow metrics.", teamId: "CRM", stage: "CRM_DEV", priority: "LOW", categoryTag: "GHL", serviceType: "CRM Setup", onboarded: false, mrr: 500, progress: 20, dueDate: new Date("2026-05-04"), ownerId: crm.id, companyId: nurency.id } });
  const p5 = await db.project.create({ data: { name: "Booking Feature", description: "Booking feature for all services.", teamId: "APPS", stage: "APPS_DEV", priority: "MEDIUM", categoryTag: "Mobile", serviceType: "Mobile App", onboarded: false, mrr: 0, progress: 30, dueDate: new Date("2026-05-20"), ownerId: mason.id, companyId: fillaDesign.id } });
  const p6 = await db.project.create({ data: { name: "Portfolio Page", description: "Micro interaction for Portfolio Page.", teamId: "APPS", stage: "APPS_DEV", priority: "LOW", categoryTag: "Desktop", serviceType: "Website Build", onboarded: false, mrr: 0, progress: 18, dueDate: new Date("2026-04-11"), ownerId: oliver.id } });
  const p7 = await db.project.create({ data: { name: "Login & Register Page Redesign", description: "Redesign Login & Register Page.", teamId: "APPS", stage: "APPS_DEV", priority: "LOW", categoryTag: "Web", serviceType: "Website Build", onboarded: false, mrr: 0, progress: 25, dueDate: new Date("2026-04-30"), ownerId: noah.id } });
  const p8 = await db.project.create({ data: { name: "Tazkia Foundation Onboard Website Test", description: "Onboarding site launch.", teamId: "APPS", stage: "SALES", priority: "HIGH", categoryTag: "Web", serviceType: "Website Build", onboarded: false, mrr: 0, progress: 15, dueDate: new Date("2026-06-01"), ownerId: sales.id, companyId: tazkia.id } });
  const p9 = await db.project.create({ data: { name: "Filla GHL Setup + Form Integrations", description: "Build GoHighLevel CRM, connect landing page forms and paid funnel to GHL pipelines.", teamId: "CRM", stage: "CRM_DEV", priority: "HIGH", categoryTag: "GHL", serviceType: "GHL Automation", onboarded: true, mrr: 1200, progress: 62, dueDate: new Date("2026-04-28"), ownerId: lucas.id, companyId: fillaDesign.id } });
  const p10 = await db.project.create({ data: { name: "Nurency Outbound Voice AI Agent", description: "Voice AI agent inside GHL for outbound qualification calls with call transfer rules.", teamId: "CRM", stage: "QA", priority: "MEDIUM", categoryTag: "Voice AI", serviceType: "Voice AI Agent", onboarded: true, mrr: 1800, progress: 85, dueDate: new Date("2026-04-18"), ownerId: crm.id, companyId: nurency.id } });
  const p11 = await db.project.create({ data: { name: "Webflow CMS Design Kit", description: "Shared Webflow CMS templates.", teamId: "APPS", stage: "LIVE", priority: "LOW", categoryTag: "Web", serviceType: "Website Build", onboarded: true, mrr: 0, progress: 100, dueDate: new Date("2026-02-14"), ownerId: noah.id } });
  const p12 = await db.project.create({ data: { name: "Tazkia CRM Setup + Donor Automations", description: "Full GHL CRM stand-up for the Tazkia Foundation, including donor lifecycle automations and receipt emails.", teamId: "CRM", stage: "CRM_DEV", priority: "HIGH", categoryTag: "GHL", serviceType: "CRM Setup", onboarded: false, mrr: 950, progress: 30, dueDate: new Date("2026-05-02"), ownerId: lucas.id, companyId: tazkia.id } });
  const p13 = await db.project.create({ data: { name: "Filla Inbound Support Voice Agent", description: "Inbound GHL voice AI agent for first-line support, routes to humans on escalation keywords.", teamId: "CRM", stage: "CRM_DEV", priority: "MEDIUM", categoryTag: "Voice AI", serviceType: "Voice AI Agent", onboarded: false, mrr: 1500, progress: 45, dueDate: new Date("2026-05-12"), ownerId: crm.id, companyId: fillaDesign.id } });
  const p14 = await db.project.create({ data: { name: "Nurency Facebook Funnel → GHL Pipeline", description: "Wire Facebook lead ads and landing page funnel into GHL with instant SMS + email nurture.", teamId: "CRM", stage: "CRM_DEV", priority: "MEDIUM", categoryTag: "GHL", serviceType: "GHL Automation", onboarded: true, mrr: 650, progress: 55, dueDate: new Date("2026-04-22"), ownerId: lucas.id, companyId: nurency.id } });

  const projectsForTasks = [p1, p2, p3, p4, p5, p6, p7, p9, p10, p12, p13, p14];
  const statuses = ["BACKLOG", "RESEARCH", "IN_PROGRESS", "REVIEW", "DONE"];
  const platforms = ["Mobile", "Desktop", "iOS", "Web"];
  const priorities = ["LOW", "MEDIUM", "HIGH"];
  const appsPool = [apps, noah, oliver, mason, admin];
  const crmPool = [crm, lucas, admin];
  const appsTitles = ["Design header", "Implement flow", "Write tests", "Code review"];
  const crmTitles = ["Build GHL workflow", "Wire form webhook", "Voice AI prompt tuning", "QA call transfer rules"];
  let seed = 0;
  for (const proj of projectsForTasks) {
    const isCrm = proj.teamId === "CRM";
    const pool = isCrm ? crmPool : appsPool;
    const titles = isCrm ? crmTitles : appsTitles;
    for (let i = 0; i < 4; i++) {
      seed++;
      await db.task.create({ data: {
        title: `${proj.name} – ${titles[i]}`,
        description: isCrm ? "Automation spec and rollout plan per client requirements." : "Working spec per reference design.",
        status: statuses[(seed + i) % statuses.length],
        priority: priorities[(seed + i) % priorities.length],
        platformTag: isCrm ? ["GHL", "Voice AI", "Automation", "Webhook"][i] : platforms[(seed + i) % platforms.length],
        progress: (seed * 17) % 100,
        dueDate: new Date(Date.now() + (seed + i) * 86400000 * 2),
        teamId: proj.teamId,
        projectId: proj.id,
        assignedTo: pool[(seed + i) % pool.length].id,
      } });
    }
  }

  const folderColors = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981"];
  const folderNames = ["Proposals", "Contracts", "Design Assets", "Meeting Notes"];
  for (const proj of [p8, p1, p2]) {
    for (let i = 0; i < 4; i++) {
      const f = await db.folder.create({ data: { name: folderNames[i], color: folderColors[i], projectId: proj.id } });
      for (let k = 0; k < 6; k++) {
        await db.fileAsset.create({ data: { name: `Create Followup Call to ${proj.name}.pdf`, format: "PDF", url: "#", sizeBytes: 1_200_000 + k * 10000, folderId: f.id, projectId: proj.id, uploadedBy: sales.id } });
      }
    }
  }

  await db.activity.createMany({ data: [
    { kind: "NOTE", title: "Wow Rakibul organized the team outing and sent invites to everyone.", body: "👍 parlfillo 25s", teamId: "APPS", actorId: oliver.id, projectId: p2.id },
    { kind: "TASK", title: "MduFlow task completed", body: "Data sync pipeline now live.", teamId: "APPS", actorId: apps.id, projectId: p2.id },
    { kind: "SYSTEM", title: "GoHighLevel webhook sync restored", teamId: "CRM", actorId: crm.id, projectId: p9.id },
    { kind: "NOTE", title: "Sprint 4 Database Migrations completed", teamId: "APPS", actorId: apps.id, projectId: p1.id },
  ] });

  await db.tag.createMany({ data: [
    { label: "webdesign", color: "#7c3aed", projectId: p8.id },
    { label: "Design", color: "#3b82f6", projectId: p8.id },
    { label: "Aslam", color: "#f59e0b", projectId: p8.id },
  ] });

  // ---------------- Marketing campaigns ----------------
  const campaignSeeds = [
    { name: "Santa Monica Honda", entity: "Honda of Santa Monica", color: "#4318ff", funnel: "https://funnels.innovat3.com/honda-smh", site: "https://hondaofsm.example.com", desc: "Monthly trade-in + financing offer funnel targeting zip codes 90401–90405.", service: "Paid Ads", niche: "Auto Dealers" },
    { name: "Bayside Dental Group", entity: "Bayside Dental", color: "#06b6d4", funnel: "https://funnels.innovat3.com/bayside-dental", site: "https://baysidedental.example.com", desc: "New-patient cleaning + whitening offer, paid Meta + Google local.", service: "Paid Ads", niche: "Dental" },
    { name: "RiseUp Fitness", entity: "RiseUp Fitness Studio", color: "#ef4444", funnel: "https://funnels.innovat3.com/riseup-trial", site: "https://riseupfit.example.com", desc: "7-day trial funnel with SMS nurture via GHL.", service: "GHL Automation", niche: "Fitness" },
    { name: "Ocean Breeze Realty", entity: "Ocean Breeze Realty", color: "#10b981", funnel: "https://funnels.innovat3.com/ocean-seller-report", site: "https://oceanbreezere.example.com", desc: "Free home-valuation report funnel for coastal sellers.", service: "Website Build", niche: "Real Estate" },
    { name: "Cedar & Oak Law", entity: "Cedar & Oak Injury Law", color: "#f59e0b", funnel: "https://funnels.innovat3.com/cedaroak-consult", site: "https://cedaroaklaw.example.com", desc: "Free injury consultation funnel with call-tracking.", service: "Voice AI", niche: "Legal" },
    { name: "GreenLeaf HVAC", entity: "GreenLeaf Heating & Air", color: "#a855f7", funnel: "https://funnels.innovat3.com/greenleaf-tuneup", site: "https://greenleafhvac.example.com", desc: "$89 seasonal tune-up offer, weather-trigger ads.", service: "Paid Ads", niche: "HVAC" },
    { name: "Pine Ridge Roofing", entity: "Pine Ridge Roofing Co.", color: "#ec4899", funnel: "https://funnels.innovat3.com/pineridge-inspection", site: "https://pineridgeroof.example.com", desc: "Free storm-damage roof inspection funnel.", service: "Email Marketing", niche: "Roofing" },
    { name: "TruNorth Auto Group", entity: "TruNorth Auto", color: "#3b82f6", funnel: "https://funnels.innovat3.com/trunorth-appraisal", site: "https://trunorthauto.example.com", desc: "Instant vehicle appraisal funnel routed to in-store appointment setters.", service: "GHL Automation", niche: "Auto Dealers" },
    { name: "SmileCraft Orthodontics", entity: "SmileCraft", color: "#0ea5e9", funnel: "https://funnels.innovat3.com/smilecraft-consult", site: "https://smilecraft.example.com", desc: "Free Invisalign consult booking with automated reminders.", service: "Voice AI", niche: "Dental" },
    { name: "IronGate Gym", entity: "IronGate Gym", color: "#7c3aed", funnel: "https://funnels.innovat3.com/irongate-14day", site: "https://irongategym.example.com", desc: "14-day no-commitment pass with SMS follow-ups.", service: "Paid Ads", niche: "Fitness" },
  ];

  const createdCampaigns: { id: string; name: string; coverColor: string }[] = [];
  for (const c of campaignSeeds) {
    const campaign = await db.campaign.create({ data: {
      name: c.name, entityName: c.entity, description: c.desc, funnelUrl: c.funnel, websiteUrl: c.site, coverColor: c.color, service: c.service, niche: c.niche, ownerId: admin.id,
    } });
    await db.campaignLink.createMany({ data: [
      { campaignId: campaign.id, label: "Primary Funnel", url: c.funnel, kind: "FUNNEL" },
      { campaignId: campaign.id, label: "Landing Page", url: c.site, kind: "LANDING" },
      { campaignId: campaign.id, label: "Meta Ad Account", url: "https://facebook.com/ads/manager/account/", kind: "AD" },
    ] });
    // 3 tags per campaign representing phases/audiences
    const tagLabels = ["Cold Traffic", "Booked Consult", "Converted"];
    const tagColors = [c.color, "#3b82f6", "#10b981"];
    const tagIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const t = await db.campaignTag.create({ data: { label: tagLabels[i], color: tagColors[i], campaignId: campaign.id } });
      tagIds.push(t.id);
    }
    createdCampaigns.push({ id: campaign.id, name: c.name, coverColor: c.color });

    // Seed contacts tagged into each campaign with varied statuses
    const contactCount = 6 + (campaignSeeds.indexOf(c) % 4);
    for (let i = 0; i < contactCount; i++) {
      const status = i < 2 ? "CLIENT" : i < 4 ? "PROSPECT" : "LEAD";
      const tagIdx = status === "CLIENT" ? 2 : status === "PROSPECT" ? 1 : 0;
      await db.contact.create({ data: {
        name: `${c.entity.split(" ")[0]} Contact ${i + 1}`,
        email: `contact${i + 1}@${c.name.toLowerCase().replace(/\s+/g, "")}.example.com`,
        status,
        campaignTags: { connect: [{ id: tagIds[tagIdx] }] },
      } });
    }
  }

  console.log("Seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
