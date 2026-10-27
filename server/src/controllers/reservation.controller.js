import { Reservation } from '../models/Reservation.js';
import { Book } from '../models/Book.js';
import { Loan } from '../models/Loan.js';
import { getSettings } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
export async function createReservation(req, res, next) {
    try {
        const { bookId, memberId } = req.body;
        const targetMemberId = req.user?.role === 'member' ? req.user._id : memberId || req.user?._id;
        if (!bookId) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'bookId is required');
        }
        const book = await Book.findOne({ _id: bookId, deletedAt: null });
        if (!book) {
            throw new ApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
        }
        // Rule: reservations only allowed when availableCopies === 0
        if (book.availableCopies > 0) {
            throw new ApiError(400, 'BOOK_AVAILABLE_NO_RESERVE', 'This book currently has copies available on the shelf. You can borrow it directly without reserving.');
        }
        // Rule: member cannot reserve if they already have an active loan of this book
        const activeLoan = await Loan.findOne({
            book: bookId,
            member: targetMemberId,
            status: { $in: ['active', 'overdue'] }
        });
        if (activeLoan) {
            throw new ApiError(400, 'ALREADY_BORROWED', 'You already have an active loan for this book.');
        }
        // Rule: one active reservation per member per book
        const existingReservation = await Reservation.findOne({
            book: bookId,
            member: targetMemberId,
            status: { $in: ['pending', 'ready'] }
        });
        if (existingReservation) {
            throw new ApiError(400, 'ALREADY_RESERVED', 'You already have an active reservation for this book.');
        }
        const reservation = await Reservation.create({
            book: bookId,
            member: targetMemberId,
            status: 'pending'
        });
        await logAudit({
            actor: req.user?._id,
            action: 'RESERVATION_CREATED',
            entity: 'Reservation',
            entityId: reservation._id,
            meta: { book: book.title }
        });
        const populated = await Reservation.findById(reservation._id)
            .populate('book', 'title isbn coverUrl')
            .populate('member', 'name email memberId');
        res.status(201).json({
            success: true,
            data: populated?.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getReservations(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { status, book, member } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (book)
            filter.book = book;
        if (member)
            filter.member = member;
        const [reservations, total] = await Promise.all([
            Reservation.find(filter)
                .populate('book', 'title isbn coverUrl availableCopies totalCopies')
                .populate('member', 'name email memberId phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Reservation.countDocuments(filter)
        ]);
        res.json({
            success: true,
            data: reservations.map((r) => ({ ...r, id: r._id.toString() })),
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
export async function getMyReservations(req, res, next) {
    try {
        const reservations = await Reservation.find({ member: req.user._id })
            .populate('book', 'title authors isbn coverUrl availableCopies')
            .sort({ createdAt: -1 })
            .lean();
        // Calculate queue position for pending reservations
        const enriched = await Promise.all(reservations.map(async (r) => {
            let queuePosition = null;
            if (r.status === 'pending') {
                const aheadCount = await Reservation.countDocuments({
                    book: r.book._id,
                    status: 'pending',
                    createdAt: { $lt: r.createdAt }
                });
                queuePosition = aheadCount + 1;
            }
            return {
                ...r,
                id: r._id.toString(),
                queuePosition
            };
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
export async function cancelReservation(req, res, next) {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id).populate('book');
        if (!reservation) {
            throw new ApiError(404, 'RESERVATION_NOT_FOUND', 'Reservation not found');
        }
        if (req.user?.role === 'member' &&
            reservation.member.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'FORBIDDEN', 'You can only cancel your own reservations');
        }
        const wasReady = reservation.status === 'ready';
        reservation.status = 'cancelled';
        reservation.cancelReason = req.body.reason || 'Cancelled by user/staff';
        await reservation.save();
        // If it was ready, we need to release the held copy to next or pool
        if (wasReady) {
            const settings = await getSettings();
            const nextPending = await Reservation.findOne({
                book: reservation.book._id,
                status: 'pending'
            }).sort({ createdAt: 1 });
            if (nextPending) {
                const now = new Date();
                const expiresAt = new Date(now);
                expiresAt.setDate(expiresAt.getDate() + settings.holdDays);
                nextPending.status = 'ready';
                nextPending.readyAt = now;
                nextPending.expiresAt = expiresAt;
                await nextPending.save();
            }
            else {
                // Return to shelf
                await Book.findByIdAndUpdate(reservation.book._id, { $inc: { availableCopies: 1 } });
            }
        }
        await logAudit({
            actor: req.user?._id,
            action: 'RESERVATION_CANCELLED',
            entity: 'Reservation',
            entityId: reservation._id
        });
        res.json({
            success: true,
            data: reservation.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
