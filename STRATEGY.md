# Alessence Strategic Roadmap

## 🎯 Core Identity

**"The Intelligent Review Companion for Philippine Accountancy & Law"**
We are shifting from a generic study tool to a specialized professional ecosystem. Unlike ChatGPT, which answers isolated queries, Alessence builds a persistent **Knowledge Graph** of your mastery over the years of preparation.

---

## 1. 🎨 UI/UX Strategy (Professional Engagement)

_Goal: Move from "Gamified App" to "Professional Workspace"._

We want engagement, but not "childish" features. The dopamine hit should come from **visualizing competence**, not arbitrary points.

### A. The "Flow" Aesthetic

- [x] **Focus Mode UI:** Minimalist, distraction-free interfaces during study sessions (pomodoro style).
- [x] **Heatmaps > Leaderboards:** Display progress like GitHub contribution graphs (consistency) rather than competitive leaderboards.
- [x] **Mastery Radars:** Visual charts showing proficiency in specific subjects (e.g., "Taxation: 80%", "Civil Law: 45%").

### B. Progression System (Career-Aligned)

Instead of "XP" and "Levels", use professional milestones that mimic the actual career path.

- [x] **Rankings:** _Undergraduate_ → _Reviewee_ → _Candidate_ → _Practitioner_.
- [x] **Badges (Competency Markers):** "Civil Law Mastery", "Taxation Specialist" (earned by scoring >90% consistently in that topic).
- [x] **Streaks:** Reframed as "Discipline Streak" or "Daily Grind"—emphasizing professional habit-building.

---

## 2. 🧠 The "Second Brain" (Why not just ChatGPT?)

_Goal: Systemic value that generic LLMs cannot replicate._

### A. Persistent Knowledge Context

ChatGPT forgets context between chats. Alessence remembers **everything**.

- [x] **Cross-Document Linking:** If you upload a new ruling on "Tax Amnesty," the system links it to your previous notes on "Tax Code."
- [x] **Weakness Tracking:** The system knows you failed "Obligations and Contracts" questions 3 times last week and forces those topics to reappear (Spaced Repetition).
- [x] **Syllabus Mapping:** Content isn't random; it's mapped to the actual **CPALE** or **Bar Exam** syllabus.

### B. Active Learning > Passive Generation

Don't just "summarize this file." Force the user to think.

- [x] **"Fill-in-the-Blank" Summaries:** The AI generates a summary but leaves keywords blank for the user to answer.
- [x] **Socratic Tutor Mode:** Instead of giving the answer, the AI asks leading questions to guide the user to the conclusion.
- [x] **Citation Verification:** The user must cite the specific Article/Section before the AI confirms the answer.

---

## 3. 🚀 Specialized Features (Accountancy & Law)

### A. Philippine Law Engine

- [x] **Smart Citation:** AI answers must cite specific **Republic Acts (R.A.)**, **Articles**, or **Jurisprudence**.
- [x] **Case Digest Generator:** Input full text → Output structured digest (Facts, Issue, Ruling).
- [x] **Codal Flashcards:** "Paste Article 1156" → Auto-generate "Elements" cards.

### B. Accounting Problem Solver

- [x] **Variable Drilling:** AI generates a problem structure (e.g., Cash Flow Indirect Method) but randomizes numbers so you learn the _process_, not the answer.
- [x] **Step-by-Step Audit:** Explanations show the computation trace, mimicking a professor's whiteboard solution.

---

## 📅 Revised Implementation Phases

### Phase 1: "The Workspace" (Structure) ✅

_Focus: Building the Professional Environment_

1. [x] Implement "Syllabus Map" (Topic Hierarchy).
2. [x] Build "Study Session" (Pomodoro + Focus UI).
3. [x] Refactor Gamification Service to "Progress Service" (Rename XP/Badges).

### Phase 2: "The Brain" (Context & AI) ✅

_Focus: Knowledge Graph_

1. [x] Implement "Weakness Tracking" logic (Spaced Repetition).
2. [x] Build "Variable Math Problem" generator.
3. [x] Tune AI to reference previous user mistakes.

### Phase 3: "The Drill" (Active Recall) ✅

_Focus: Retention_

1. [x] Build "Socratic Mode" chat.
2. [x] Implement "Fill-in-the-Blank" summary generation.
3. [x] Add "Mock Board Exam" simulation (Timed & Graded).

---

## 🎉 All Core Features Complete!

The Alessence platform now includes:

### Backend APIs:

- `POST /law/case-digest` - Generate structured case digests
- `POST /law/codal-flashcards` - Generate flashcards from legal provisions
- `POST /drill/math` - Variable math problems with randomized numbers
- `POST /drill/audit` - Step-by-step audit problems with computation trace
- `GET /file/:id/links` - Get cross-document links for a file

### AI Chat Modes:

- **STANDARD** - Regular AI assistance with smart citations
- **SOCRATIC** - Guided learning through questioning
- **CITATION_VERIFICATION** - User must cite sources before AI confirms

### Frontend Components:

- Study Activity Heatmap (GitHub-style contribution graph)
- Weak Areas Tracking with Spaced Repetition
- Professional Profile Widget with Ranks
