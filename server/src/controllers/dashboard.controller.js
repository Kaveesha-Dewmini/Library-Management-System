import { Book } from '../models/Book.js';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { AuditLog } from '../models/AuditLog.js';
import { getSettings } from '../models/Setting.js';
export async function getDashboardStats(_req, res, next) {
    try {
        const settings = await getSettings();
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const [bookStats, activeMembersCount, activeLoansCount, overdueLoansCount, unpaidFines, dueTodayLoans, mostOverdueLoans, recentActivity, categoryDistribution, last30DaysLoans, last30DaysReturns] = await Promise.all([
            // Book totals
            Book.aggregate([
                { $match: { deletedAt: null } },
                {
                    $group: {
                        _id: null,
                        totalTitles: { $sum: 1 },
                        totalCopies: { $sum: '$totalCopies' },
                        availableCopies: { $sum: '$availableCopies' }
                    }
                }
            ]),
            // Active members
            User.countDocuments({ role: 'member', status: 'active', deletedAt: null }),
            // Active loans
            Loan.countDocuments({ status: { $in: ['active', 'overdue'] } }),
            // Overdue loans
            Loan.countDocuments({ status: 'overdue' }),
            // Unpaid fines total
            Fine.aggregate([
                { $match: { status: 'unpaid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // Due today loans
            Loan.find({
                status: 'active',
                dueAt: { $gte: startOfToday, $lte: endOfToday }
            })
                .populate('book', 'title coverUrl isbn')
                .populate('member', 'name email memberId')
                .limit(6)
                .lean(),
            // Most overdue loans
            Loan.find({ status: 'overdue' })
                .populate('book', 'title coverUrl isbn')
                .populate('member', 'name email memberId phone')
                .sort({ dueAt: 1 })
                .limit(6)
                .lean(),
            // Recent activity
            AuditLog.find()
                .populate('actor', 'name role')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
            // Loans by category
            Loan.aggregate([
                {
                    $lookup: {
                        from: 'books',
                        localField: 'book',
                        foreignField: '_id',
                        as: 'bookDoc'
                    }
                },
                { $unwind: '$bookDoc' },
                { $unwind: '$bookDoc.categories' },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'bookDoc.categories',
                        foreignField: '_id',
                        as: 'catDoc'
                    }
                },
                { $unwind: '$catDoc' },
                {
                    $group: {
                        _id: '$catDoc.name',
                        color: { $first: '$catDoc.color' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 6 }
            ]),
            // 30 days loans
            Loan.aggregate([
                { $match: { issuedAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // 30 days returns
            Loan.aggregate([
                { $match: { returnedAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$returnedAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);
        // Merge loans & returns for 30-day chart
        const dateMap = new Map();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dateMap.set(dateStr, { date: dateStr, loans: 0, returns: 0 });
        }
        last30DaysLoans.forEach((item) => {
            if (dateMap.has(item._id)) {
                dateMap.get(item._id).loans = item.count;
            }
        });
        last30DaysReturns.forEach((item) => {
            if (dateMap.has(item._id)) {
                dateMap.get(item._id).returns = item.count;
            }
        });
        const loansTrend = Array.from(dateMap.values());
        res.json({
            success: true,
            data: {
                stats: {
                    totalTitles: bookStats[0]?.totalTitles || 0,
                    totalCopies: bookStats[0]?.totalCopies || 0,
                    availableCopies: bookStats[0]?.availableCopies || 0,
                    activeMembers: activeMembersCount,
                    booksOnLoan: activeLoansCount,
                    overdueLoans: overdueLoansCount,
                    unpaidFines: unpaidFines[0]?.total || 0,
                    currency: settings.currency
                },
                loansTrend,
                categoryDistribution: categoryDistribution.map((cd) => ({
                    name: cd._id,
                    count: cd.count,
                    color: cd.color || '#3B82F6'
                })),
                dueToday: dueTodayLoans.map((l) => ({ ...l, id: l._id.toString() })),
                mostOverdue: mostOverdueLoans.map((l) => ({
                    ...l,
                    id: l._id.toString(),
                    daysOverdue: Math.ceil((now.getTime() - new Date(l.dueAt).getTime()) / (1000 * 60 * 60 * 24))
                })),
                recentActivity: recentActivity.map((a) => ({ ...a, id: a._id.toString() }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMemberDashboard(req, res, next) {
    try {
        const memberId = req.user._id;
        const settings = await getSettings();
        const [currentLoans, reservations, unpaidFines, newArrivals] = await Promise.all([
            Loan.find({ member: memberId, status: { $in: ['active', 'overdue'] } })
                .populate('book', 'title authors isbn coverUrl shelfLocation')
                .sort({ dueAt: 1 })
                .lean(),
            Reservation.find({ member: memberId, status: { $in: ['pending', 'ready'] } })
                .populate('book', 'title authors isbn coverUrl availableCopies')
                .sort({ createdAt: -1 })
                .lean(),
            Fine.aggregate([
                { $match: { member: memberId, status: 'unpaid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Book.find({ deletedAt: null })
                .populate('categories', 'name slug color')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean()
        ]);
        const enrichedReservations = await Promise.all(reservations.map(async (r) => {
            let queuePosition = null;
            if (r.status === 'pending') {
                const ahead = await Reservation.countDocuments({
                    book: r.book._id,
                    status: 'pending',
                    createdAt: { $lt: r.createdAt }
                });
                queuePosition = ahead + 1;
            }
            return {
                ...r,
                id: r._id.toString(),
                queuePosition
            };
        }));
        res.json({
            success: true,
            data: {
                currentLoans: currentLoans.map((l) => ({ ...l, id: l._id.toString() })),
                reservations: enrichedReservations,
                unpaidFinesTotal: unpaidFines[0]?.total || 0,
                currency: settings.currency,
                newArrivals: newArrivals.map((b) => ({ ...b, id: b._id.toString() }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}
