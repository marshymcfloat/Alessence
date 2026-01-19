## 2025-05-15 - Missing Indexes on Foreign Keys
**Learning:** The Prisma schema has many foreign keys without corresponding indexes (e.g., `Flashcard.deckId`, `FlashcardReview.cardId`). This can lead to severe performance degradation on filtering, joins, and cascade deletes (causing sequential scans). Prisma does not add these automatically for Postgres.
**Action:** When adding relations in Prisma, always explicitly add `@@index([foreignKeyId])` unless there's a unique constraint covering it.
