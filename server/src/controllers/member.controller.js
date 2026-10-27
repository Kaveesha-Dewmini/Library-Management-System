import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { getSettings } from '../models/Setting.js';
import { getNextSequence } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
const memberCreateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    password: z.string().min(6).optional()
});
export async function getMembers(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { q, status } = req.query;
        const filter = { role: 'member', deletedAt: null };
        if (status && ['active', 'suspended'].includes(status)) {
            filter.status = status;
        }
        if (q && typeof q === 'string' && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { name: regex },
                { email: regex },
                { memberId: regex },
                { phone: regex }
            ];
        }
        const [members, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter)
        ]);
        // Attach active loans count and unpaid fines total for each member
        const memberIds = members.map((m) => m._id);
        const [loansCounts, finesTotals] = await Promise.all([
            Loan.aggregate([
                { $match: { member: { $in: memberIds }, status: { $in: ['active', 'overdue'] } } },
                { $group: { _id: '$member', count: { $sum: 1 } } }
            ]),
            Fine.aggregate([
                { $match: { member: { $in: memberIds }, status: 'unpaid' } },
                { $group: { _id: '$member', total: { $sum: '$amount' } } }
            ])
        ]);
        const loanMap = new Map();
        loansCounts.forEach((lc) => loanMap.set(lc._id.toString(), lc.count));
        const fineMap = new Map();
        finesTotals.forEach((ft) => fineMap.set(ft._id.toString(), ft.total));
        const enriched = members.map((m) => ({
            ...m,
            id: m._id.toString(),
            activeLoansCount: loanMap.get(m._id.toString()) || 0,
            unpaidFinesTotal: fineMap.get(m._id.toString()) || 0
        }));
        res.json({
            success: true,
            data: enriched,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMemberById(req, res, next) {
    try {
        const { id } = req.params;
        const member = await User.findOne({ _id: id, role: 'member', deletedAt: null });
        if (!member) {
            throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Member not found');
        }
        const [activeLoans, loansHistory, reservations, fines] = await Promise.all([
            Loan.find({ member: id, status: { $in: ['active', 'overdue'] } })
                .populate('book', 'title coverUrl isbn shelfLocation')
                .sort({ dueAt: 1 })
                .lean(),
            Loan.find({ member: id, status: 'returned' })
                .populate('book', 'title coverUrl isbn')
                .sort({ returnedAt: -1 })
                .limit(20)
                .lean(),
            Reservation.find({ member: id })
                .populate('book', 'title coverUrl isbn availableCopies')
                .sort({ createdAt: -1 })
                .lean(),
            Fine.find({ member: id })
                .populate('loan')
                .sort({ createdAt: -1 })
                .lean()
        ]);
        const unpaidFinesTotal = fines
            .filter((f) => f.status === 'unpaid')
            .reduce((acc, curr) => acc + curr.amount, 0);
        res.json({
            success: true,
            data: {
                ...member.toJSON(),
                activeLoans: activeLoans.map((l) => ({ ...l, id: l._id.toString() })),
                loansHistory: loansHistory.map((l) => ({ ...l, id: l._id.toString() })),
                reservations: reservations.map((r) => ({ ...r, id: r._id.toString() })),
                fines: fines.map((f) => ({ ...f, id: f._id.toString() })),
                unpaidFinesTotal
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function checkEligibility(req, res, next) {
    try {
        const { id } = req.params;
        const member = await User.findOne({ _id: id, role: 'member', deletedAt: null });
        if (!member) {
            throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Member not found');
        }
        const settings = await getSettings();
        const [activeLoansCount, overdueLoansCount, unpaidFines] = await Promise.all([
            Loan.countDocuments({ member: id, status: { $in: ['active', 'overdue'] } }),
            Loan.countDocuments({ member: id, status: 'overdue' }),
            Fine.aggregate([
                { $match: { member: member._id, status: 'unpaid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);
        const unpaidFinesTotal = unpaidFines.length > 0 ? unpaidFines[0].total : 0;
        const reasons = [];
        if (member.status === 'suspended') {
            reasons.push('Member account is suspended');
        }
        if (activeLoansCount >= settings.maxLoans) {
            reasons.push(`Reached maximum allowed active loans (${activeLoansCount}/${settings.maxLoans})`);
        }
        if (overdueLoansCount > 0) {
            reasons.push(`Member has ${overdueLoansCount} overdue book(s)`);
        }
        if (unpaidFinesTotal > settings.fineLimit) {
            reasons.push(`Unpaid fines (${settings.currency} ${unpaidFinesTotal}) exceed the borrowing threshold of ${settings.currency} ${settings.fineLimit}`);
        }
        res.json({
            success: true,
            data: {
                canBorrow: reasons.length === 0,
                reasons,
                stats: {
                    activeLoansCount,
                    maxLoans: settings.maxLoans,
                    overdueLoansCount,
                    unpaidFinesTotal,
                    fineLimit: settings.fineLimit,
                    currency: settings.currency
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function createMember(req, res, next) {
    try {
        const data = memberCreateSchema.parse(req.body);
        const existing = await User.findOne({ email: data.email.toLowerCase() });
        if (existing) {
            throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
        }
        const seq = await getNextSequence('memberId');
        const memberId = `LIB-${String(seq).padStart(5, '0')}`;
        const defaultPassword = data.password || 'Member@123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);
        const member = await User.create({
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash,
            role: 'member',
            memberId,
            phone: data.phone || '',
            address: data.address || '',
            status: 'active'
        });
        await logAudit({
            actor: req.user?._id,
            action: 'MEMBER_CREATED',
            entity: 'User',
            entityId: member._id,
            meta: { memberId: member.memberId, name: member.name }
        });
        res.status(201).json({
            success: true,
            data: {
                ...member.toJSON(),
                temporaryPassword: defaultPassword
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateMember(req, res, next) {
    try {
        const { id } = req.params;
        const { name, phone, address, status } = req.body;
        const member = await User.findOne({ _id: id, role: 'member', deletedAt: null });
        if (!member) {
            throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Member not found');
        }
        if (name)
            member.name = name.trim();
        if (phone !== undefined)
            member.phone = phone.trim();
        if (address !== undefined)
            member.address = address.trim();
        if (status && ['active', 'suspended'].includes(status)) {
            member.status = status;
        }
        await member.save();
        await logAudit({
            actor: req.user?._id,
            action: 'MEMBER_UPDATED',
            entity: 'User',
            entityId: member._id,
            meta: { status: member.status }
        });
        res.json({
            success: true,
            data: member.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteMember(req, res, next) {
    try {
        const { id } = req.params;
        const member = await User.findOne({ _id: id, role: 'member', deletedAt: null });
        if (!member) {
            throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Member not found');
        }
        const activeLoans = await Loan.countDocuments({
            member: id,
            status: { $in: ['active', 'overdue'] }
        });
        if (activeLoans > 0) {
            throw new ApiError(400, 'HAS_ACTIVE_LOANS', `Cannot delete member: member currently has ${activeLoans} active loan(s).`);
        }
        const unpaidFines = await Fine.countDocuments({
            member: id,
            status: 'unpaid'
        });
        if (unpaidFines > 0) {
            throw new ApiError(400, 'HAS_UNPAID_FINES', `Cannot delete member: member has ${unpaidFines} unpaid fine(s).`);
        }
        member.deletedAt = new Date();
        await member.save();
        await logAudit({
            actor: req.user?._id,
            action: 'MEMBER_DELETED',
            entity: 'User',
            entityId: member._id,
            meta: { name: member.name, memberId: member.memberId }
        });
        res.json({
            success: true,
            data: { message: `Member ${member.name} (${member.memberId}) deleted successfully` }
        });
    }
    catch (error) {
        next(error);
    }
}
