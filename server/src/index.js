import dotenv from 'dotenv';
dotenv.config();
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';
import { initScheduledJobs } from './jobs/cron.js';
const PORT = process.env.PORT || 4000;
async function bootstrap() {
    await connectDB();
    await seedDatabase(false);
    initScheduledJobs();
    app.listen(PORT, () => {
        console.log(`
====================================================
  Shelfwise Server running on http://localhost:${PORT}
  Health Check:  http://localhost:${PORT}/api/v1/health
  Base API URL:  http://localhost:${PORT}/api/v1
====================================================
    `);
    });
}
bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
