# RouteMind

RouteMind is a personalized learning and career-readiness platform built with Vite, React, TypeScript, Tailwind CSS, Gemini, and MongoDB.

## Features

- Personalized learning paths generated from a signup goal, target role, skill level, interests, and weekly study capacity.
- Interactive roadmap with milestone dependencies and subtopic progress tracking.
- Profile page containing registration details, mastery scores, skill gaps, completed projects, and portfolio links.
- Career Hub with Learning Tools, assessment, mock interviews, study rooms, jobs, and bookmarks.
- Certification-style assessments with topic-based questions and assessment-driven revision priorities.
- Gemini-powered RouteMind Mentor with dynamic explanations, quizzes, and roadmap guidance.
- Live job recommendations with search, skill-match scores, remote/location details, and fallback listings.
- MongoDB-backed authentication, workspace persistence, and study room data.
- Responsive desktop and mobile navigation.

## Requirements

- Node.js 18 or newer
- MongoDB for local development, or MongoDB Atlas for deployment
- Gemini API key for AI responses

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB_NAME=lumina
   ```

3. Start MongoDB locally.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://127.0.0.1:3000/.

## Commands

```bash
npm run dev       # Start Vite development server
npm run build     # Type-check and create production build
npm run lint      # Run the TypeScript check
npm test          # Run Vitest tests
npm run preview   # Preview the production build
```

## Backend and data

During local development, API middleware in `vite.config.ts` supports authentication, workspace sync, AI chat, and study rooms. The same routes are available as Vercel Functions under `api/` for production deployment.

The application uses MongoDB collections for users, workspaces, and study rooms. Browser local storage is used for local UI preferences and selected profile-level convenience data.

## Vercel deployment

1. Push this repository to GitHub and import it into Vercel.
2. Use these build settings:

   ```text
   Framework preset: Vite
   Build command: npm run build
   Output directory: dist
   Install command: npm install
   ```

3. Add these environment variables in Vercel for Production, Preview, and Development:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net
   MONGODB_DB_NAME=lumina
   ```

4. Create a MongoDB Atlas database user and allow Vercel connections in Atlas Network Access.
5. Deploy or redeploy the project.

Do not use `mongodb://127.0.0.1:27017` in Vercel because it points to the deployment container, not your local computer. Never commit `.env` or API keys; `.env` files are ignored by Git.

## Production API routes

```text
/api/auth/signin
/api/auth/signup
/api/workspace
/api/ai/chat
/api/study-rooms
```

The Gemini key is read only by the server-side AI function and is never bundled into the browser application.

## Repository

https://github.com/DaraBalaji/lumina-ai-recommender

