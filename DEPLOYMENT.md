# Deployment Guide

This guide covers deployment for the Alessence monorepo (Next.js frontend + NestJS backend).

## 📋 Prerequisites

- Node.js >= 18
- pnpm 9.0.0
- PostgreSQL database
- Environment variables configured

## 📝 Environment Variables Template

Create a `.env` file in the root directory with these variables (see `.env.example` if available):

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/alessence?schema=public"

# JWT Authentication (use a strong secret, min 32 characters)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Backend API Configuration
PORT=3001
ORIGIN_URL="http://localhost:3000"

# Frontend Configuration
FETCH_BASE_URL="http://localhost:3001"

# Gemini AI API Key
GEMINI_API_KEY="your-gemini-api-key-here"
```

## 🔐 Required Environment Variables

### Backend (NestJS API) - `apps/api`
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# CORS
ORIGIN_URL="https://your-frontend-domain.com"

# Gemini AI API
GEMINI_API_KEY="your-gemini-api-key"

# Server Port (optional, defaults to 3001)
PORT=3001
```

### Frontend (Next.js) - `apps/web`
```env
# Backend API URL
FETCH_BASE_URL="https://your-backend-api.com"

# JWT Secret (must match backend)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
```

## 🗄️ Database Setup

### 1. Run Prisma Migrations
```bash
# Generate Prisma Client
pnpm --filter @repo/db db:generate

# Run migrations
pnpm --filter @repo/db db:migrate

# Or deploy migrations (production)
pnpm --filter @repo/db db:deploy
```

### 2. Verify Database Connection
Ensure your `DATABASE_URL` is correctly formatted and accessible from your deployment environment.

## 🏗️ Build Process

### Local Build Test
```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm run build
```

### Build Order (handled by Turbo)
1. `@repo/db` - Generate Prisma Client
2. `@repo/types` - Build type definitions
3. `@repo/utils` - Build utilities
4. `apps/api` - Build NestJS backend
5. `apps/web` - Build Next.js frontend

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set root directory to `apps/web`
3. Configure build settings:
   - **Build Command**: `cd ../.. && pnpm install && pnpm run build --filter=web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `pnpm install`
4. Add environment variables:
   - `FETCH_BASE_URL`
   - `JWT_SECRET`
5. Deploy!

#### Backend (Railway/Render)
1. Connect repository
2. Set root directory to `apps/api`
3. Configure:
   - **Build Command**: `pnpm install && pnpm build` (the prebuild script will handle dependencies)
   - **Start Command**: `pnpm start:prod`
4. Add all backend environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `ORIGIN_URL` (your frontend URL)
   - `PORT` (optional, defaults to 3001)
5. Run database migrations (if not auto-run):
   ```bash
   pnpm --filter @repo/db db:deploy
   ```

**Note for Render:** The `prebuild` script in `apps/api/package.json` will automatically:
- Generate Prisma Client (`@repo/db`)
- Build `@repo/db` package
- Build `@repo/types` package  
- Build `@repo/utils` package (if exists)
- Then build the NestJS API

### Option 2: Docker (Full Stack)

Create `Dockerfile` in root:
```dockerfile
# Multi-stage build for monorepo
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Backend
FROM node:22-alpine AS api
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]

# Frontend
FROM node:22-alpine AS web
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["pnpm", "start"]
```

### Option 3: Manual Server Deployment

1. **Build on server:**
   ```bash
   git clone <your-repo>
   cd Alessence
   pnpm install
   pnpm run build
   ```

2. **Run backend:**
   ```bash
   cd apps/api
   pnpm start:prod
   # Or use PM2: pm2 start dist/main.js --name api
   ```

3. **Run frontend:**
   ```bash
   cd apps/web
   pnpm start
   # Or use PM2: pm2 start "pnpm start" --name web
   ```

4. **Setup reverse proxy (Nginx):**
   ```nginx
   # Frontend
   server {
     listen 80;
     server_name your-domain.com;
     location / {
       proxy_pass http://localhost:3000;
     }
   }

   # Backend API
   server {
     listen 80;
     server_name api.your-domain.com;
     location / {
       proxy_pass http://localhost:3001;
     }
   }
   ```

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All `any` types replaced with explicit types ✅ (Done!)
- [ ] No linter errors: `pnpm run lint`
- [ ] Type checking passes: `pnpm run check-types`
- [ ] All tests pass (if you have tests)

### Environment
- [ ] All environment variables set in deployment platform
- [ ] Database migrations run successfully
- [ ] Database connection tested
- [ ] CORS configured correctly (`ORIGIN_URL` matches frontend domain)

### Security
- [ ] `JWT_SECRET` is strong and unique (min 32 characters)
- [ ] `DATABASE_URL` uses SSL in production
- [ ] API keys stored securely (not in code)
- [ ] CORS properly configured
- [ ] HTTPS enabled in production

### Performance
- [ ] Next.js images optimized
- [ ] Database indexes created (if needed)
- [ ] API rate limiting considered
- [ ] Error logging configured

## 🔍 Post-Deployment Verification

1. **Health Checks:**
   - Frontend loads: `https://your-domain.com`
   - Backend API health check: `https://api.your-domain.com/health` ✅ (Available!)
   - Database connection works (health endpoint tests this)

2. **Functionality Tests:**
   - User registration/login
   - Task creation/management
   - Exam creation/taking
   - File uploads

3. **Monitor:**
   - Application logs
   - Error rates
   - Response times
   - Database performance

## 🐛 Troubleshooting

### Build Fails
- Check all environment variables are set
- Verify `DATABASE_URL` is accessible
- Ensure Prisma Client is generated: `pnpm --filter @repo/db db:generate`

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database firewall/network access
- Ensure SSL is configured if required

### CORS Errors
- Verify `ORIGIN_URL` matches frontend domain exactly
- Check backend CORS configuration in `apps/api/src/main.ts`

### Type Errors
- Run `pnpm run check-types` locally first
- Ensure all workspace packages are built

## 📝 Platform-Specific Notes

### Vercel
- Automatic deployments on push to main
- Serverless functions for API routes (if using Next.js API routes)
- Edge functions supported
- Environment variables in dashboard

### Railway
- Automatic deployments
- PostgreSQL addon available
- Environment variables in dashboard
- Can run migrations automatically

### Render
- Automatic deployments
- PostgreSQL addon available
- Background workers supported
- Health checks configurable

## 🔄 CI/CD Integration

Your existing GitHub Actions workflow (`.github/workflows/ci.yaml`) can be extended:

```yaml
# Add deployment step
- name: Deploy
  run: |
    # Your deployment commands
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    # ... other secrets
```

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Deployment](https://docs.nestjs.com/recipes/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Turbo Deployment](https://turbo.build/repo/docs/deploy)

---

**Need help?** Check logs, verify environment variables, and ensure all dependencies are installed correctly.

