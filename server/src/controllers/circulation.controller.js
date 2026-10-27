import { Types } from 'mongoose';
import { Loan } from '../models/Loan.js';
import { Book } from '../models/Book.js';
import { User } from '../models/User.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { getSettings } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
export async function issueLoan(req, res, next) {
    try {
        const { memberId, bookId } = req.body;
        if (!memberId || !bookId) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'memberId and bookId are required');
        }
        const [member, book, settings] = await Promise.all([
            User.findOne({
                $or: [
                    { _id: Types.ObjectId.isValid(memberId) ? memberId : null },
                    { memberId: memberId.toUpperCase() },
                    { email: memberId.toLowerCase() }
                ],
                deletedAt: null
            }),
            Book.findOne({
                $or: [
                    { _id: Types.ObjectId.isValid(bookId) ? bookId : null },
                    { isbn: bookId }
                ],
                deletedAt: null
            }),
            getSettings()
        ]);
        if (!member) {
            throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Member not found');
        }
        if (!book) {
            throw new ApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
        }
        // 1. Check member status
        if (member.status === 'suspended') {
            throw new ApiError(403, 'MEMBER_SUSPENDED', 'Member account is suspended');
        }
        // 2. Check active loans limit
        const activeLoansCount = await Loan.countDocuments({
            member: member._id,
            status: { $in: ['active', 'overdue'] }
        });
        if (activeLoansCount >= settings.maxLoans) {
            throw new ApiError(400, 'LOAN_LIMIT_REACHED', `Member has already reached the maximum limit of ${settings.maxLoans} active loans.`);
        }
        // 3. Check for overdue loans
        const overdueLoansCount = await Loan.countDocuments({
            member: member._id,
            status: 'overdue'
        });
        if (overdueLoansCount > 0) {
            throw new ApiError(400, 'HAS_OVERDUE', `Member has ${overdueLoansCount} overdue book(s). Overdue books must be returned before borrowing new ones.`);
        }
        // 4. Check unpaid fines limit
        const unpaidFines = await Fine.aggregate([
            { $match: { member: member._id, status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const unpaidFinesTotal = unpaidFines.length > 0 ? unpaidFines[0].total : 0;
        if (unpaidFinesTotal > settings.fineLimit) {
            throw new ApiError(400, 'FINE_LIMIT_EXCEEDED', `Member has unpaid fines of ${settings.currency} ${unpaidFinesTotal}, exceeding the limit of ${settings.currency} ${settings.fineLimit}.`);
        }
        // 5. Check if member already has this book on loan
        const alreadyBorrowed = await Loan.findOne({
            member: member._id,
            book: book._id,
            status: { $in: ['active', 'overdue'] }
        });
        if (alreadyBorrowed) {
            throw new ApiError(400, 'ALREADY_BORROWED', 'Member already has an active loan for this book.');
        }
        // 6. Check copy availability or ready reservation
        const readyReservation = await Reservation.findOne({
            member: member._id,
            book: book._id,
            status: 'ready'
        });
        if (readyReservation) {
            // Member was holding this copy, so we fulfill the reservation
            readyReservation.status = 'fulfilled';
            await readyReservation.save();
            // availableCopies was already decremented when held, just increment timesBorrowed
            book.timesBorrowed += 1;
            await book.save();
        }
        else {
            // Normal checkout: decrement availableCopies atomically
            const updatedBook = await Book.findOneAndUpdate({ _id: book._id, availableCopies: { $gt: 0 }, deletedAt: null }, { $inc: { availableCopies: -1, timesBorrowed: 1 } }, { new: true });
            if (!updatedBook) {
                throw new ApiError(409, 'NO_COPIES', 'No available copies of this book remain.');
            }
        }
        // 7. Calculate due date
        const now = new Date();
        const dueAt = new Date(now);
        dueAt.setDate(dueAt.getDate() + settings.loanPeriod);
        dueAt.setHours(23, 59, 59, 999);
        const loan = await Loan.create({
            book: book._id,
            member: member._id,
            issuedBy: req.user._id,
            issuedAt: now,
            dueAt,
            renewals: 0,
            status: 'active'
        });
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_ISSUED',
            entity: 'Loan',
            entityId: loan._id,
            meta: {
                member: `${member.name} (${member.memberId})`,
                book: book.title,
                dueAt: dueAt.toISOString()
            }
        });
        const populatedLoan = await Loan.findById(loan._id)
            .populate('book', 'title isbn coverUrl shelfLocation')
            .populate('member', 'name email memberId phone')
            .populate('issuedBy', 'name email');
        res.status(201).json({
            success: true,
            data: populatedLoan?.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function returnLoan(req, res, next) {
    try {
        const { id } = req.params;
        const loan = await Loan.findById(id).populate('book').populate('member');
        if (!loan) {
            throw new ApiError(404, 'LOAN_NOT_FOUND', 'Loan not found');
        }
        if (loan.status === 'returned') {
            throw new ApiError(400, 'ALREADY_RETURNED', 'This loan has already been marked as returned');
        }
        const settings = await getSettings();
        const now = new Date();
        let fineDoc = null;
        // Calculate fine if late
        if (now > loan.dueAt) {
            const diffMs = now.getTime() - loan.dueAt.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const amount = Math.min(diffDays * settings.finePerDay, settings.maxFine);
            if (amount > 0) {
                fineDoc = await Fine.create({
                    loan: loan._id,
                    member: loan.member._id,
                    amount,
                    daysLate: diffDays,
                    status: 'unpaid'
                });
            }
        }
        // Check if there is a pending reservation waiting for this book
        const nextReservation = await Reservation.findOne({
            book: loan.book._id,
            status: 'pending'
        }).sort({ createdAt: 1 }).populate('member', 'name email memberId');
        let heldForReservation = null;
        if (nextReservation) {
            const expiresAt = new Date(now);
            expiresAt.setDate(expiresAt.getDate() + settings.holdDays);
            nextReservation.status = 'ready';
            nextReservation.readyAt = now;
            nextReservation.expiresAt = expiresAt;
            await nextReservation.save();
            heldForReservation = {
                reservationId: nextReservation._id,
                member: nextReservation.member,
                expiresAt
            };
            // Note: Copy is held for this reservation, so availableCopies is NOT incremented
        }
        else {
            // No reservation waiting: return copy to availableCopies pool
            await Book.findByIdAndUpdate(loan.book._id, { $inc: { availableCopies: 1 } });
        }
        loan.status = 'returned';
        loan.returnedAt = now;
        loan.returnedTo = req.user._id;
        await loan.save();
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_RETURNED',
            entity: 'Loan',
            entityId: loan._id,
            meta: {
                fineCreated: fineDoc ? fineDoc.amount : 0,
                heldForReservation: !!heldForReservation
            }
        });
        res.json({
            success: true,
            data: {
                loan: loan.toJSON(),
                fine: fineDoc ? fineDoc.toJSON() : null,
                nextReservation: heldForReservation
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function renewLoan(req, res, next) {
    try {
        const { id } = req.params;
        const loan = await Loan.findById(id).populate('book');
        if (!loan) {
            throw new ApiError(404, 'LOAN_NOT_FOUND', 'Loan not found');
        }
        if (loan.status === 'returned') {
            throw new ApiError(400, 'ALREADY_RETURNED', 'Cannot renew a returned loan');
        }
        // If member, check they own the loan
        if (req.user?.role === 'member' && loan.member.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'FORBIDDEN', 'You can only renew your own loans');
        }
        const settings = await getSettings();
        const now = new Date();
        // 1. Check not overdue
        if (now > loan.dueAt) {
            throw new ApiError(400, 'LOAN_OVERDUE', 'Overdue loans cannot be renewed. Please return the book to the desk.');
        }
        // 2. Check renewals limit
        if (loan.renewals >= settings.maxRenewals) {
            throw new ApiError(400, 'RENEWAL_LIMIT', `Maximum renewal limit reached (${loan.renewals}/${settings.maxRenewals} renewals used).`);
        }
        // 3. Check if someone is waiting in the reservation queue
        const waitingReservations = await Reservation.countDocuments({
            book: loan.book._id,
            status: 'pending'
        });
        if (waitingReservations > 0) {
            throw new ApiError(400, 'RENEWAL_BLOCKED_RESERVED', `Cannot renew: ${waitingReservations} other member(s) are waiting in line for this book.`);
        }
        const newDueAt = new Date(now);
        newDueAt.setDate(newDueAt.getDate() + settings.loanPeriod);
        newDueAt.setHours(23, 59, 59, 999);
        loan.dueAt = newDueAt;
        loan.renewals += 1;
        loan.status = 'active';
        await loan.save();
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_RENEWED',
            entity: 'Loan',
            entityId: loan._id,
            meta: { newDueAt: newDueAt.toISOString(), renewals: loan.renewals }
        });
        res.json({
            success: true,
            data: loan.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getLoans(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { status, member, book, dueSoon, q } = req.query;
        const filter = {};
        if (status && ['active', 'overdue', 'returned'].includes(status)) {
            filter.status = status;
        }
        if (dueSoon === 'true') {
            const now = new Date();
            const in3Days = new Date();
            in3Days.setDate(in3Days.getDate() + 3);
            filter.status = 'active';
            filter.dueAt = { $gte: now, $lte: in3Days };
        }
        if (member && Types.ObjectId.isValid(member)) {
            filter.member = member;
        }
        if (book && Types.ObjectId.isValid(book)) {
            filter.book = book;
        }
        let memberIds = [];
        let bookIds = [];
        if (q && typeof q === 'string' && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            const [matchedMembers, matchedBooks] = await Promise.all([
                User.find({ $or: [{ name: regex }, { memberId: regex }, { email: regex }] }).select('_id'),
                Book.find({ $or: [{ title: regex }, { isbn: regex }] }).select('_id')
            ]);
            memberIds = matchedMembers.map((m) => m._id);
            bookIds = matchedBooks.map((b) => b._id);
            filter.$or = [
                { member: { $in: memberIds } },
                { book: { $in: bookIds } }
            ];
        }
        const [loans, total] = await Promise.all([
            Loan.find(filter)
                .populate('book', 'title isbn coverUrl shelfLocation')
                .populate('member', 'name email memberId phone')
                .populate('issuedBy', 'name')
                .sort({ dueAt: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Loan.countDocuments(filter)
        ]);
        res.json({
            success: true,
            data: loans.map((l) => ({ ...l, id: l._id.toString() })),
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
export async function getMyLoans(req, res, next) {
    try {
        const loans = await Loan.find({ member: req.user._id })
            .populate('book', 'title authors isbn coverUrl shelfLocation')
            .sort({ status: 1, dueAt: 1 })
            .lean();
        res.json({
            success: true,
            data: loans.map((l) => ({ ...l, id: l._id.toString() }))
        });
    }
    catch (error) {
        next(error);
    }
}
