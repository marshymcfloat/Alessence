## 2024-05-23 - [Prisma N+1 Payload Optimization]
**Learning:** Prisma `include` fetches all related records, which can lead to massive data transfer and memory usage when only counts are needed. This effectively behaves like a "payload N+1" where we fetch N records just to count them.
**Action:** Use `prisma.groupBy` or `_count` aggregation to fetch summary statistics directly from the database, reducing payload size from O(N) to O(1) per group.
