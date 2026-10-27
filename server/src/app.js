import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/book.routes.js';
import categoryRoutes from './routes/category.routes.js';
import memberRoutes from './routes/member.routes.js';
import circulationRoutes from './routes/circulation.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import fineRoutes from './routes/fine.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';
import staffRoutes from './routes/staff.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
export const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}
// Health Check
app.get('/api/v1/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'Shelfwise Library Management API',
        version: '1.0.0',
        uptime: process.uptime()
    });
});
// Mount Routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/loans', circulationRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/fines', fineRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/staff', staffRoutes);
// 404 Handler
app.use((req, _res, next) => {
    next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
});
// Centralized Error Handler
app.use(errorHandler);
