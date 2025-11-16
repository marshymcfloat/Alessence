# Alessence

> Your accountancy study buddy

Alessence is a comprehensive study management platform designed specifically for accountancy students. It combines task management, AI-powered exam generation, and file organization to help you stay on top of your studies.

## ✨ Features

### 📋 Task Management

- **Kanban Board**: Visual task management with drag-and-drop functionality
- **Task Organization**: Organize tasks by subject with color-coded visual indicators
- **Deadline Tracking**: Visual urgency indicators (overdue, urgent, upcoming)
- **Task Status**: Track tasks through stages (Planned, In Progress, Done)

### 🤖 AI-Powered Exam Generation

- **Smart Exam Creation**: Generate exams from uploaded study materials using Google Gemini AI
- **Multiple Question Types**: Support for multiple choice, identification, and true/false questions
- **Exam Attempts**: Take exams multiple times and track your progress
- **Performance Tracking**: View scores and review answers

### 📁 File Management

- **File Upload**: Upload PDF, DOCX, and text files
- **Subject Organization**: Organize files by subject
- **Content Extraction**: Automatic text extraction from uploaded documents
- **Vector Embeddings**: AI-powered content understanding for exam generation

### 📚 Subject Management

- **Subject Organization**: Create and manage subjects by semester
- **Enrollment Tracking**: Track which subjects you're enrolled in
- **Subject-based Organization**: Group tasks, files, and exams by subject

### 🔐 Authentication

- **Secure Login**: JWT-based authentication
- **User Accounts**: Personal study spaces for each user

## 🏗️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Redux Toolkit** - State management
- **TanStack Query** - Data fetching and caching
- **dnd-kit** - Drag and drop functionality
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Relational database
- **Passport.js** - Authentication strategies
- **JWT** - JSON Web Tokens
- **Google Gemini AI** - AI-powered exam generation
- **Vercel Blob** - File storage

### Infrastructure

- **Turborepo** - Monorepo build system
- **pnpm** - Fast, disk space efficient package manager
- **Prisma** - Database toolkit and ORM

## 📁 Project Structure

```
Alessence/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # Next.js frontend application
├── packages/
│   ├── db/           # Prisma schema and database client
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   ├── eslint-config/    # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** 9.0.0
- **PostgreSQL** database
- **Google Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd Alessence
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

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

4. **Set up the database**

   ```bash
   # Generate Prisma Client
   pnpm --filter @repo/db db:generate

   # Run migrations
   pnpm --filter @repo/db db:migrate
   ```

5. **Start the development servers**

   ```bash
   # Start both frontend and backend
   pnpm dev

   # Or start individually:
   # Frontend only (port 3000)
   pnpm --filter web dev

   # Backend only (port 3001)
   pnpm --filter api dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📝 Available Scripts

### Root Level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all apps and packages
- `pnpm format` - Format code with Prettier
- `pnpm check-types` - Type check all apps and packages
- `pnpm clean` - Clean all build artifacts

### Individual Apps

- `pnpm --filter web dev` - Start Next.js frontend
- `pnpm --filter api dev` - Start NestJS backend
- `pnpm --filter @repo/db db:generate` - Generate Prisma Client
- `pnpm --filter @repo/db db:migrate` - Run database migrations

## 🔧 Development

### Database Commands

```bash
# Generate Prisma Client (after schema changes)
pnpm --filter @repo/db db:generate

# Create a new migration
pnpm --filter @repo/db db:migrate dev --name migration_name

# Apply migrations (production)
pnpm --filter @repo/db db:deploy

# Open Prisma Studio (database GUI)
pnpm --filter @repo/db db:studio
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check all code
pnpm check-types
```

## 🌐 API Endpoints

The backend API provides the following main endpoints:

- **Authentication**: `/auth/login`, `/auth/register`
- **Subjects**: `/subject` (CRUD operations)
- **Tasks**: `/task` (CRUD operations)
- **Files**: `/file` (upload, list, delete)
- **Exams**: `/exam` (create, list, generate)
- **Health**: `/health` (health check)

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User** - User accounts and authentication
- **Subject** - Academic subjects organized by semester
- **Task** - Study tasks with deadlines and status
- **File** - Uploaded study materials with embeddings
- **Exam** - AI-generated exams
- **Question** - Exam questions with multiple types
- **ExamAttempt** - User exam attempts and scores

See `packages/db/prisma/schema.prisma` for the complete schema.

## 🚢 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deployment options:

- **Vercel** (Frontend) + **Railway/Render** (Backend)
- **Docker** (Full stack)
- **Manual server deployment**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and unlicensed.

## 🙏 Acknowledgments

- Built with [Turborepo](https://turbo.build/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI powered by [Google Gemini](https://ai.google.dev/)

---

**Made with ❤️ for accountancy students**
