## 2024-05-23 - [Prisma N+1 Payload Optimization]
**Learning:** Prisma `include` fetches all related records, which can lead to massive data transfer and memory usage when only counts are needed. This effectively behaves like a "payload N+1" where we fetch N records just to count them.
**Action:** Use `prisma.groupBy` or `_count` aggregation to fetch summary statistics directly from the database, reducing payload size from O(N) to O(1) per group.

## 2024-05-23 - [Database Schema Optimization]
**Learning:** Core tables (`StudySession`, `Note`, `Task`, `Exam`) were missing indexes on `userId` and `subjectId`, which are the primary filtering keys for almost all dashboard queries. In PostgreSQL, foreign keys are not automatically indexed, leading to sequential scans on these high-growth tables.
**Action:** Always audit `schema.prisma` for missing foreign key indexes, especially for `userId` on high-volume tables like activity logs, notes, or tasks. Explicitly add `@@index([foreignKeyId])`.

## 2025-02-18 - [Linting Side Effects]
**Learning:** `pnpm lint` in `apps/api` runs `eslint --fix`, which can introduce breaking changes (e.g., removing non-null assertions `!`) that cause build failures. It also formats many files, creating noise.
**Action:** Be cautious running `pnpm lint` in `apps/api`. If run, verify it didn't break functionality or readability. Use `git restore` to revert unintended formatting if necessary.

## 2025-02-23 - [Optimizing Aggregation Queries]
**Learning:** `getDeckStatistics` was performing 5 separate database queries (4 counts + 1 select) to gather stats for a single deck. This increased latency and DB load significantly for frequent dashboard views.
**Action:** Replace multiple `count` queries with a single `findMany` query selecting only necessary fields (`repetitions`, `interval`, `easeFactor`, `nextReviewAt`), then aggregate metrics in-memory. This reduces DB roundtrips from 5 to 1.
