import { Book } from '../models/Book.js';
import { Loan } from '../models/Loan.js';
import { Fine } from '../models/Fine.js';
export async function getPopularBooks(req, res, next) {
    try {
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const books = await Book.find({ deletedAt: null })
            .populate('categories', 'name')
            .sort({ timesBorrowed: -1 })
            .limit(limit)
            .lean();
        res.json({
            success: true,
            data: books.map((b) => ({ ...b, id: b._id.toString() }))
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getActiveMembers(req, res, next) {
    try {
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const activeMembers = await Loan.aggregate([
            { $group: { _id: '$member', totalLoans: { $sum: 1 } } },
            { $sort: { totalLoans: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    id: '$user._id',
                    name: '$user.name',
                    email: '$user.email',
                    memberId: '$user.memberId',
                    totalLoans: 1
                }
            }
        ]);
        res.json({
            success: true,
            data: activeMembers
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getOverdueReport(_req, res, next) {
    try {
        const overdueLoans = await Loan.find({ status: 'overdue' })
            .populate('book', 'title isbn shelfLocation')
            .populate('member', 'name email memberId phone')
            .sort({ dueAt: 1 })
            .lean();
        const now = new Date();
        const enriched = overdueLoans.map((l) => ({
            ...l,
            id: l._id.toString(),
            daysOverdue: Math.ceil((now.getTime() - new Date(l.dueAt).getTime()) / (1000 * 60 * 60 * 24))
        }));
        res.json({
            success: true,
            data: enriched
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getFinesByMonth(req, res, next) {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        const monthlyData = await Fine.aggregate([
            { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, status: '$status' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const result = months.map((m, idx) => {
            const monthNum = idx + 1;
            const paid = monthlyData.find((d) => d._id.month === monthNum && d._id.status === 'paid');
            const unpaid = monthlyData.find((d) => d._id.month === monthNum && d._id.status === 'unpaid');
            const waived = monthlyData.find((d) => d._id.month === monthNum && d._id.status === 'waived');
            return {
                month: m,
                paid: paid ? paid.totalAmount : 0,
                unpaid: unpaid ? unpaid.totalAmount : 0,
                waived: waived ? waived.totalAmount : 0
            };
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}
export async function exportCsv(req, res, next) {
    try {
        const { name } = req.params;
        let csv = '';
        if (name === 'popular-books') {
            const books = await Book.find({ deletedAt: null }).sort({ timesBorrowed: -1 }).limit(100).lean();
            csv = 'Title,ISBN,Times Borrowed,Available Copies,Total Copies,Shelf Location\n' +
                books.map((b) => `"${b.title}","${b.isbn}",${b.timesBorrowed},${b.availableCopies},${b.totalCopies},"${b.shelfLocation}"`).join('\n');
        }
        else if (name === 'overdue') {
            const loans = await Loan.find({ status: 'overdue' }).populate('book', 'title isbn').populate('member', 'name memberId email phone').lean();
            const now = new Date();
            csv = 'Book Title,ISBN,Member Name,Member ID,Member Email,Phone,Due Date,Days Overdue\n' +
                loans.map((l) => {
                    const days = Math.ceil((now.getTime() - new Date(l.dueAt).getTime()) / (1000 * 60 * 60 * 24));
                    return `"${l.book?.title}","${l.book?.isbn}","${l.member?.name}","${l.member?.memberId}","${l.member?.email}","${l.member?.phone || ''}","${new Date(l.dueAt).toISOString().split('T')[0]}",${days}`;
                }).join('\n');
        }
        else {
            csv = 'Report,Status\nUnknown,Not Found\n';
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="shelfwise-${name}-${Date.now()}.csv"`);
        res.send(csv);
    }
    catch (error) {
        next(error);
    }
}
