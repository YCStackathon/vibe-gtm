# PRD: VibeGTM

**Created**: 2026-01-31

## 1. Introduction & Overview

VibeGTM is a lead enrichment tool that automates the "human touch" in outbound sales. Instead of helping users find more leads, it helps them deeply understand the leads they already have by identifying two critical dimensions of fit:

1. **Technical Fit** - Does this prospect use tools/technologies relevant to what I'm selling?
2. **Personal Fit** - Do we share hobbies, interests, or experiences that could spark a genuine connection?

The tool was born from real GTM validation with experts from Turing, SkyEngine AI, and YCombinator founders who all emphasized: "Don't find more leads. Enrich the ones you have."

## 2. Problem Statement

**The Problem**: Cold outreach fails because it lacks personalization. Founders and sales teams either:
- Blast generic emails that get ignored
- Hire expensive Virtual Assistants to manually research prospects (slow, costly, inconsistent)
- Give up on personalization entirely due to time constraints

**Who Experiences This**:
- Startup founders doing their own GTM
- Sales teams at early-stage companies
- Anyone who values quality over quantity in outreach

**The Insight**: The difference between a ignored cold email and a meeting booked is often one personal detail - a shared hobby, a mutual connection, or proof that you actually understand their tech stack.

## 3. Goals

### User Goals

- Quickly understand what they have in common with each prospect
- Find genuine conversation starters backed by real sources
- Reduce time spent on manual LinkedIn/social media research
- Increase response rates on cold outreach

### Business Goals

- Demonstrate product value during Hack the Stackathon
- Showcase effective use of Firecrawl and Reducto APIs
- Build a tool the team can use for their own Paradigm GTM efforts
- Create a foundation for a potential product in the lead enrichment space

## 4. Target Audience

### Primary Users

**Startup Founders (Series A and earlier)**
- Doing their own sales and outreach
- Have a target list but limited time to research each prospect
- Value authentic connections over spray-and-pray tactics
- Example: The VibeGTM team themselves, building GTM for Paradigm

### Secondary Users

**Sales Development Representatives (SDRs)**
- Need to personalize outreach at moderate scale
- Currently spend hours on LinkedIn research
- Measured on response rates and meetings booked

## 5. Core Features

### P0 - Must Have (MVP)

**Identity Injection (Your Profile)**
- Upload PDFs (CVs, company docs) - processed via Reducto
- Provide social URLs (LinkedIn, Instagram, X.com) - crawled via Firecrawl
- System auto-extracts: interests, hobbies, tech stack preferences, company focus
- Output: JSON profile of "who you are" for matching purposes

**Lead List Upload**
- Upload CSV with prospect names and basic info (company, role, LinkedIn URL)
- Support for 1-10 leads per batch (MVP scope)
- Store leads in MongoDB for processing

**Lead Enrichment Engine**
- For each lead, crawl available sources via Firecrawl:
  - LinkedIn profile/posts
  - Company website (especially /jobs, /about, /blog)
  - Personal blogs or social media if available
- Extract: tech stack signals, personal interests, recent activity
- Process company docs/PDFs via Reducto if provided

**Match Analysis**
- Compare enriched lead data against user's identity profile
- Identify Technical Fit: matching technologies, tools, methodologies
- Identify Personal Fit: shared hobbies, experiences, interests
- Generate match results with:
  - Source links (e.g., link to the Instagram post, LinkedIn article, blog)
  - Short reasoning explaining why it's a match

**Results Dashboard**
- Display enrichment results after processing completes (not real-time)
- Show all leads in a session with match scores/highlights
- Sessions visible to all users (collaborative workspace for hackathon simplicity)
- Sessions selectable in left sidebar (chat-app style navigation)

### P1 - Should Have

**Email Draft Generation**
- For high-match leads, generate a personalized email draft
- Include the discovered personal/technical hooks
- Template: casual, founder-to-founder tone

**Resend Notification**
- Send email notification when enrichment batch completes
- Useful when processing larger lists that take time

### P2 - Nice to Have

**Batch Size Scaling (10-50 leads)**
- Optimize processing for medium-sized lists
- Add progress indicators for longer-running jobs

**Suggested Actions**
- Beyond email drafts, suggest: "Connect on LinkedIn mentioning X"
- Propose specific activities: "Invite to go motorcycling" based on shared interests

## 6. Technical Requirements

### Stack

- **Backend**: FastAPI (Python 3.11+) with uv package manager
- **Frontend**: React 19 + TypeScript + Vite
- **Database**: MongoDB with motor async driver
- **Deployment**: Render (Blueprint in render.yaml)
  - Frontend: gtm.useparadigm.app
  - Backend: api.gtm.useparadigm.app

### Integrations

- **Firecrawl**: Web scraping for LinkedIn, company sites, social profiles
- **Reducto**: PDF parsing for CVs, company documents, hackathon materials
- **Resend** (P1): Email notifications and potentially sending drafted emails

### Key Technical Decisions

- **Async Processing**: Enrichment runs asynchronously; results displayed after completion
- **Shared Sessions**: All users see all sessions (hackathon simplicity, no auth complexity)
- **JSON Storage**: Match results stored as JSON in MongoDB for flexible querying

## 7. Constraints

### Scope Limitations

**Explicitly Out of Scope for Hackathon:**
- Lead finding/prospecting (we only enrich existing leads)
- CRM integrations
- Multi-channel operations (LinkedIn automation, voicemail drops, etc.)
- User authentication and private workspaces
- Real-time streaming of enrichment results
- Large batch processing (200+ leads)

### Technical Constraints

- **Firecrawl Rate Limits**: May need to throttle requests for larger batches
- **Firecrawl Accuracy**: Known issue with hallucination/bias (e.g., incorrectly attributing hobbies)
  - Mitigation: Always show source links so users can verify
- **Processing Time**: Deep enrichment takes time; users must wait for batch completion
- **API Costs**: Firecrawl and Reducto usage costs scale with lead volume

### Tradeoffs Made

| Decision                         | Tradeoff               | Rationale                                            |
|----------------------------------|------------------------|------------------------------------------------------|
| Batch processing (not real-time) | Users wait for results | Simpler architecture, more reliable                  |
| 1-10 leads MVP                   | Limited scale          | Focus on quality of enrichment over quantity         |
| Shared sessions                  | No privacy             | Hackathon demo simplicity                            |
| Show sources for every match     | More UI complexity     | Builds trust, mitigates Firecrawl hallucination risk |

## 8. Future Considerations

**Post-Hackathon / V2 Ideas:**

- **Lead Scoring Algorithm**: Weighted scoring combining technical + personal fit
- **CRM Sync**: Push enriched data to HubSpot, Salesforce, etc.
- **Scheduled Re-enrichment**: Periodically refresh lead data to catch new signals
- **Team Workspaces**: Private sessions, user accounts, collaboration features
- **Custom Matching Rules**: Let users define what "technical fit" means for their product
- **Browser Extension**: Enrich leads directly from LinkedIn pages
- **Outreach Sequences**: Beyond single emails, create multi-touch campaigns
- **Analytics**: Track which hooks led to responses, learn what works

**Known Issues to Address:**
- Firecrawl hallucination mitigation (confidence scores, multiple source verification)
- Handling rate limits gracefully with queuing
- Better error handling when sources are unavailable
