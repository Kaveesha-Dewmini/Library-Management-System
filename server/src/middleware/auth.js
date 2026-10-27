import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
export async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'UNAUTHORIZED', 'Authentication token missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'shelfwise_super_secret_jwt_access_key_2026_xyz';
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new ApiError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
            }
            throw new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token');
        }
        const user = await User.findOne({ _id: decoded.id, deletedAt: null });
        if (!user) {
            throw new ApiError(401, 'USER_NOT_FOUND', 'User account not found or has been deactivated');
        }
        if (user.status === 'suspended') {
            throw new ApiError(403, 'MEMBER_SUSPENDED', 'Your account has been suspended. Please contact the library.');
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
export function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'FORBIDDEN', `Forbidden: Requires one of [${roles.join(', ')}] role`));
        }
        next();
    };
}
