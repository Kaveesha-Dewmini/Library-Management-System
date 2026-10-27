import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { getNextSequence } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
import { Loan } from '../models/Loan.js';
import { Fine } from '../models/Fine.js';
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    address: z.string().optional()
});
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});
function generateToken(user) {
    const secret = process.env.JWT_SECRET || 'shelfwise_super_secret_jwt_access_key_2026_xyz';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ id: user._id.toString(), role: user.role, email: user.email, name: user.name }, secret, { expiresIn });
}
export async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const existingUser = await User.findOne({ email: data.email.toLowerCase() });
        if (existingUser) {
            throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        const seq = await getNextSequence('memberId');
        const memberId = `LIB-${String(seq).padStart(5, '0')}`;
        const user = await User.create({
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: 'member',
            memberId,
            phone: data.phone || '',
            address: data.address || '',
            status: 'active'
        });
        const token = generateToken(user);
        await logAudit({
            actor: user._id,
            action: 'USER_REGISTERED',
            entity: 'User',
            entityId: user._id,
            meta: { email: user.email, memberId: user.memberId }
        });
        res.status(201).json({
            success: true,
            data: {
                token,
                user: user.toJSON()
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const user = await User.findOne({ email: data.email.toLowerCase(), deletedAt: null });
        if (!user) {
            throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        if (user.status === 'suspended') {
            throw new ApiError(403, 'MEMBER_SUSPENDED', 'Your account has been suspended. Please contact the library.');
        }
        const isMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const token = generateToken(user);
        await logAudit({
            actor: user._id,
            action: 'USER_LOGIN',
            entity: 'User',
            entityId: user._id,
            meta: { email: user.email, role: user.role }
        });
        res.json({
            success: true,
            data: {
                token,
                user: user.toJSON()
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMe(req, res, next) {
    try {
        const user = req.user;
        const activeLoansCount = await Loan.countDocuments({ member: user._id, status: { $in: ['active', 'overdue'] } });
        const overdueLoansCount = await Loan.countDocuments({ member: user._id, status: 'overdue' });
        const unpaidFines = await Fine.aggregate([
            { $match: { member: user._id, status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const unpaidFinesTotal = unpaidFines.length > 0 ? unpaidFines[0].total : 0;
        res.json({
            success: true,
            data: {
                ...user.toJSON(),
                activeLoansCount,
                overdueLoansCount,
                unpaidFinesTotal
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateMe(req, res, next) {
    try {
        const { name, phone, address } = req.body;
        const user = req.user;
        if (name)
            user.name = name.trim();
        if (phone !== undefined)
            user.phone = phone.trim();
        if (address !== undefined)
            user.address = address.trim();
        await user.save();
        res.json({
            success: true,
            data: user.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Both current and new password are required');
        }
        if (newPassword.length < 6) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'New password must be at least 6 characters');
        }
        const user = req.user;
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new ApiError(400, 'INCORRECT_PASSWORD', 'Current password does not match');
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();
        await logAudit({
            actor: user._id,
            action: 'PASSWORD_CHANGED',
            entity: 'User',
            entityId: user._id
        });
        res.json({
            success: true,
            data: { message: 'Password updated successfully' }
        });
    }
    catch (error) {
        next(error);
    }
}
