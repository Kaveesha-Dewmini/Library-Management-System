import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
const staffSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'librarian']),
    phone: z.string().optional()
});
export async function getStaffList(_req, res, next) {
    try {
        const staff = await User.find({
            role: { $in: ['admin', 'librarian'] },
            deletedAt: null
        })
            .sort({ createdAt: -1 })
            .lean();
        res.json({
            success: true,
            data: staff.map((s) => ({ ...s, id: s._id.toString() }))
        });
    }
    catch (error) {
        next(error);
    }
}
export async function createStaff(req, res, next) {
    try {
        const data = staffSchema.parse(req.body);
        const existing = await User.findOne({ email: data.email.toLowerCase() });
        if (existing) {
            throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        const staff = await User.create({
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: data.role,
            phone: data.phone || '',
            status: 'active'
        });
        await logAudit({
            actor: req.user?._id,
            action: 'STAFF_CREATED',
            entity: 'User',
            entityId: staff._id,
            meta: { email: staff.email, role: staff.role }
        });
        res.status(201).json({
            success: true,
            data: staff.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateStaff(req, res, next) {
    try {
        const { id } = req.params;
        const { name, role, status, phone } = req.body;
        const staff = await User.findOne({
            _id: id,
            role: { $in: ['admin', 'librarian'] },
            deletedAt: null
        });
        if (!staff) {
            throw new ApiError(404, 'STAFF_NOT_FOUND', 'Staff member not found');
        }
        if (name)
            staff.name = name.trim();
        if (role && ['admin', 'librarian'].includes(role))
            staff.role = role;
        if (status && ['active', 'suspended'].includes(status))
            staff.status = status;
        if (phone !== undefined)
            staff.phone = phone.trim();
        await staff.save();
        await logAudit({
            actor: req.user?._id,
            action: 'STAFF_UPDATED',
            entity: 'User',
            entityId: staff._id,
            meta: { role: staff.role, status: staff.status }
        });
        res.json({
            success: true,
            data: staff.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
