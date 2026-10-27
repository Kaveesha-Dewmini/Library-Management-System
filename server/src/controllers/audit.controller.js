import { AuditLog } from '../models/AuditLog.js';
export async function getAuditLogs(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const { action, entity } = req.query;
        const filter = {};
        if (action)
            filter.action = action;
        if (entity)
            filter.entity = entity;
        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate('actor', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter)
        ]);
        res.json({
            success: true,
            data: logs.map((l) => ({ ...l, id: l._id.toString() })),
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
