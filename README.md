# Lumina

Lumina is a Vite + React learning-path application with Gemini chat and a local MongoDB authentication API.

## Local MongoDB connection

1. Start the MongoDB service.
2. Open MongoDB Compass and connect to:

   ```text
   mongodb://127.0.0.1:27017
   ```

3. Copy `.env.example` to `.env` and set the server-only `GEMINI_API_KEY`.
4. Install and run the app:

   ```bash
   npm install
   npm run dev
   ```

5. Open the app and create an account. This creates the `lumina` database and `users` collection. After sign-in, profiles, roadmaps, study records, chat history, notes, and custom courses are synchronized to the `workspaces` collection. The database status can be checked at `/api/db/status` while the Vite server is running.

The `.env` file is ignored by Git and must never be committed. For deployment, use a hosted MongoDB connection string such as MongoDB Atlas in the deployment provider's environment variables.

