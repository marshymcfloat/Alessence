# Phase 2 Roadmap: Deepening Learning & Engagement

This roadmap focuses on transforming Alessence from a "Study Tool" into an "Intelligent Learning Platform" by implementing cognitive science principles (Spaced Repetition) and enhancing user engagement (Interactive UI, Social).

## 1. Advanced Flashcard System (Priority)

Currently, we generate flashcards but lack a robust system to review them effectively.

### A. UI/UX Enhancements (The "Flip" Experience)
- [ ] **Interactive Flip Cards:**
    - Refactor `LawTools.tsx` and flashcard displays to use a 3D transform flip animation.
    - **Front:** Question/Concept with clean typography.
    - **Back:** Answer/Explanation with Markdown support.
    - **Animation:** Smooth CSS `perspective` and `rotateY` transitions on click.
- [ ] **Study Mode Interface:**
    - A dedicated "Review Session" view (separate from the list view).
    - Large, centered card focus.
    - Keyboard shortcuts (Space to flip, 1-4 for rating difficulty).

### B. Spaced Repetition System (SRS) Backend
- [ ] **Database Schema Updates:**
    - Add `FlashcardReview` model to track review history.
    - Fields: `lastReviewedAt`, `nextReviewAt`, `interval` (days), `easeFactor` (multiplier), `repetitionCount`.
- [ ] **SM-2 Algorithm Implementation:**
    - Implement the SuperMemo-2 algorithm in `LawService` (or a new `FlashcardService`).
    - Logic:
        - User rates card: Again (Fail), Hard, Good, Easy.
        - Calculate next interval based on rating and current ease factor.
        - `nextReviewAt` date is updated.
- [ ] **"Due Today" Logic:**
    - API endpoint to fetch only cards where `nextReviewAt <= now`.

## 2. Social & Community Features (Engagement)

Leverage the existing `Friendship` models to build a community.

- [ ] **Leaderboards:**
    - Weekly/Monthly XP rankings among friends.
    - "Study Streak" comparison.
- [ ] **Shared Decks:**
    - Ability to share generated Codal/Case flashcards with friends.
    - "Forking" a deck (copying it to your library).

## 3. Mobile Optimization (PWA)

- [ ] **Responsive Refactor:**
    - Ensure Heatmap and complex tables scroll horizontally on mobile.
    - Optimize touch targets for the new Flashcard UI.
- [ ] **PWA Manifest:**
    - Add `manifest.json` for "Add to Home Screen" capability.

---

## Technical Strategy for Flashcards

### The SM-2 Algorithm (Simplified for Implementation)
```typescript
// Review Grade (q): 0-5 (we can simplify to 1: Again, 2: Hard, 3: Good, 4: Easy)
// EF: Ease Factor (start at 2.5)
// I: Interval (days)
// n: Repetition number

function calculateNextReview(grade: number, previousState: CardState) {
  let { interval, repetition, easeFactor } = previousState;

  if (grade >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition++;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { interval, repetition, easeFactor };
}
```

