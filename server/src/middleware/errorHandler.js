import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
    // Zod validation error
    if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Input validation failed. Please check your data.',
                details
            }
        });
        return;
    }
    // Custom ApiError
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details || []
            }
        });
        return;
    }
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_KEY',
                message: `An entry with this ${field} ("${value}") already exists.`,
                details: [{ field, message: `${field} must be unique` }]
            }
        });
        return;
    }
    // Mongoose CastError (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: `Invalid format for identifier: ${err.value}`,
                details: []
            }
        });
        return;
    }
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred on the server.',
            details: []
        }
    });
}
