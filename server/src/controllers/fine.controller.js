import { Fine } from '../models/Fine.js';
import { Loan } from '../models/Loan.js';
import { getSettings } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
export async function getFines(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { status, member } = req.query;
        const filter = {};
        if (status && ['unpaid', 'paid', 'waived'].includes(status)) {
            filter.status = status;
        }
        if (member) {
            filter.member = member;
        }
        const [fines, total, unpaidSum, paidSum] = await Promise.all([
            Fine.find(filter)
                .populate('member', 'name email memberId phone')
                .populate({
                path: 'loan',
                populate: { path: 'book', select: 'title isbn coverUrl' }
            })
                .populate('handledBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Fine.countDocuments(filter),
            Fine.aggregate([
                { $match: { status: 'unpaid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Fine.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);
        res.json({
            success: true,
            data: fines.map((f) => ({ ...f, id: f._id.toString() })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                totalUnpaidAmount: unpaidSum.length > 0 ? unpaidSum[0].total : 0,
                totalPaidAmount: paidSum.length > 0 ? paidSum[0].total : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMyFines(req, res, next) {
    try {
        const memberId = req.user._id;
        const settings = await getSettings();
        const [fines, overdueLoans] = await Promise.all([
            Fine.find({ member: memberId })
                .populate({
                path: 'loan',
                populate: { path: 'book', select: 'title isbn coverUrl' }
            })
                .sort({ createdAt: -1 })
                .lean(),
            Loan.find({
                member: memberId,
                status: 'overdue'
            }).populate('book', 'title isbn coverUrl').lean()
        ]);
        const now = new Date();
        const liveEstimates = overdueLoans.map((ol) => {
            const diffMs = now.getTime() - new Date(ol.dueAt).getTime();
            const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            const estimatedFine = Math.min(diffDays * settings.finePerDay, settings.maxFine);
            return {
                loanId: ol._id.toString(),
                book: ol.book,
                dueAt: ol.dueAt,
                daysLate: diffDays,
                estimatedFine
            };
        });
        const unpaidFinesTotal = fines
            .filter((f) => f.status === 'unpaid')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const totalEstimatedFines = liveEstimates.reduce((acc, curr) => acc + curr.estimatedFine, 0);
        res.json({
            success: true,
            data: {
                fines: fines.map((f) => ({ ...f, id: f._id.toString() })),
                liveEstimates,
                summary: {
                    unpaidRecordedFines: unpaidFinesTotal,
                    estimatedOverdueFines: totalEstimatedFines,
                    totalDue: unpaidFinesTotal + totalEstimatedFines,
                    currency: settings.currency
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function payFine(req, res, next) {
    try {
        const { id } = req.params;
        const { method } = req.body;
        const fine = await Fine.findById(id).populate('member', 'name memberId');
        if (!fine) {
            throw new ApiError(404, 'FINE_NOT_FOUND', 'Fine record not found');
        }
        if (fine.status === 'paid') {
            throw new ApiError(400, 'ALREADY_PAID', 'This fine has already been marked as paid');
        }
        if (fine.status === 'waived') {
            throw new ApiError(400, 'ALREADY_WAIVED', 'This fine has been waived and cannot be paid');
        }
        fine.status = 'paid';
        fine.paymentMethod = ['cash', 'card', 'other'].includes(method) ? method : 'cash';
        fine.paidAt = new Date();
        fine.handledBy = req.user._id;
        await fine.save();
        await logAudit({
            actor: req.user?._id,
            action: 'FINE_PAID',
            entity: 'Fine',
            entityId: fine._id,
            meta: {
                amount: fine.amount,
                method: fine.paymentMethod,
                member: fine.member?.name
            }
        });
        res.json({
            success: true,
            data: fine.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function waiveFine(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'A reason is required to waive a fine');
        }
        const fine = await Fine.findById(id).populate('member', 'name memberId');
        if (!fine) {
            throw new ApiError(404, 'FINE_NOT_FOUND', 'Fine record not found');
        }
        if (fine.status === 'paid') {
            throw new ApiError(400, 'ALREADY_PAID', 'Cannot waive an already paid fine');
        }
        fine.status = 'waived';
        fine.waiveReason = reason.trim();
        fine.handledBy = req.user._id;
        await fine.save();
        await logAudit({
            actor: req.user?._id,
            action: 'FINE_WAIVED',
            entity: 'Fine',
            entityId: fine._id,
            meta: {
                amount: fine.amount,
                reason: fine.waiveReason,
                member: fine.member?.name
            }
        });
        res.json({
            success: true,
            data: fine.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
