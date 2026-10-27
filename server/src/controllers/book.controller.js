import { z } from 'zod';
import { Book } from '../models/Book.js';
import { Loan } from '../models/Loan.js';
import { Reservation } from '../models/Reservation.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
const bookSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().nullable().optional().default(''),
    authors: z.array(z.string()).min(1, 'At least one author is required'),
    isbn: z.string().min(1, 'ISBN is required'),
    publisher: z.string().nullable().optional().default(''),
    publishedYear: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().int().optional()),
    categories: z.preprocess((val) => {
        if (!val) return [];
        if (Array.isArray(val)) {
            return val.map((c) => (typeof c === 'object' && c !== null ? (c.id || c._id?.toString() || c._id) : String(c))).filter(Boolean);
        }
        return [String(val)];
    }, z.array(z.string()).optional()),
    language: z.string().default('English'),
    pages: z.preprocess((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)), z.number().int().optional()),
    description: z.string().nullable().optional().default(''),
    coverUrl: z.string().nullable().optional().default(''),
    shelfLocation: z.string().min(1, 'Shelf location is required'),
    totalCopies: z.preprocess((val) => Number(val), z.number().int().min(1, 'Total copies must be at least 1'))
});
export async function getBooks(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { q, category, language, available, sort } = req.query;
        const filter = { deletedAt: null };
        if (category) {
            filter.categories = category;
        }
        if (language) {
            filter.language = language;
        }
        if (available === 'true') {
            filter.availableCopies = { $gt: 0 };
        }
        if (q && typeof q === 'string' && q.trim()) {
            const trimmed = q.trim();
            const regex = new RegExp(trimmed, 'i');
            filter.$or = [
                { title: regex },
                { subtitle: regex },
                { authors: { $elemMatch: { $regex: regex } } },
                { isbn: regex },
                { publisher: regex }
            ];
        }
        let sortOption = { createdAt: -1 };
        if (sort === 'title')
            sortOption = { title: 1 };
        else if (sort === '-title')
            sortOption = { title: -1 };
        else if (sort === 'newest' || sort === '-createdAt')
            sortOption = { createdAt: -1 };
        else if (sort === 'oldest' || sort === 'createdAt')
            sortOption = { createdAt: 1 };
        else if (sort === 'most-borrowed' || sort === '-timesBorrowed')
            sortOption = { timesBorrowed: -1 };
        const [books, total] = await Promise.all([
            Book.find(filter)
                .populate('categories', 'name slug color')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(filter)
        ]);
        res.json({
            success: true,
            data: books.map((b) => ({ ...b, id: b._id.toString() })),
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
export async function getNewArrivals(_req, res, next) {
    try {
        const books = await Book.find({ deletedAt: null })
            .populate('categories', 'name slug color')
            .sort({ createdAt: -1 })
            .limit(12)
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
export async function getBookById(req, res, next) {
    try {
        const { id } = req.params;
        const book = await Book.findOne({ _id: id, deletedAt: null }).populate('categories', 'name slug color');
        if (!book) {
            throw new ApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
        }
        const pendingReservationsCount = await Reservation.countDocuments({
            book: id,
            status: { $in: ['pending', 'ready'] }
        });
        let recentLoans = [];
        if (req.user && ['admin', 'librarian'].includes(req.user.role)) {
            recentLoans = await Loan.find({ book: id })
                .populate('member', 'name email memberId')
                .sort({ issuedAt: -1 })
                .limit(10)
                .lean();
        }
        res.json({
            success: true,
            data: {
                ...book.toJSON(),
                pendingReservationsCount,
                recentLoans: recentLoans.map((l) => ({ ...l, id: l._id.toString() }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}
export async function isbnLookup(req, res, next) {
    try {
        const { isbn } = req.params;
        const cleanIsbn = isbn.replace(/[-\s]/g, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        try {
            const response = await fetch(`https://openlibrary.org/isbn/${cleanIsbn}.json`, {
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new ApiError(404, 'ISBN_NOT_FOUND', `No book details found on Open Library for ISBN: ${isbn}`);
            }
            const data = await response.json();
            let authorNames = [];
            if (Array.isArray(data.authors) && data.authors.length > 0) {
                const authorPromises = data.authors.slice(0, 3).map(async (a) => {
                    if (a.key) {
                        try {
                            const aRes = await fetch(`https://openlibrary.org${a.key}.json`);
                            if (aRes.ok) {
                                const aData = await aRes.json();
                                return aData.name || '';
                            }
                        }
                        catch {
                            // ignore author detail error
                        }
                    }
                    return '';
                });
                const resolved = await Promise.all(authorPromises);
                authorNames = resolved.filter(Boolean);
            }
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
            res.json({
                success: true,
                data: {
                    title: data.title || '',
                    subtitle: data.subtitle || '',
                    authors: authorNames.length > 0 ? authorNames : ['Unknown Author'],
                    publisher: Array.isArray(data.publishers) ? data.publishers[0] : '',
                    publishedYear: data.publish_date ? parseInt(data.publish_date.match(/\d{4}/)?.[0] || '0') : undefined,
                    pages: data.number_of_pages || 0,
                    description: typeof data.description === 'string' ? data.description : data.description?.value || '',
                    coverUrl,
                    isbn: cleanIsbn
                }
            });
        }
        catch (fetchErr) {
            clearTimeout(timeout);
            if (fetchErr instanceof ApiError)
                throw fetchErr;
            throw new ApiError(502, 'OPEN_LIBRARY_ERROR', 'Failed to connect to Open Library API');
        }
    }
    catch (error) {
        next(error);
    }
}
export async function createBook(req, res, next) {
    try {
        const data = bookSchema.parse(req.body);
        const existing = await Book.findOne({ isbn: data.isbn, deletedAt: null });
        if (existing) {
            throw new ApiError(409, 'ISBN_EXISTS', `A book with ISBN ${data.isbn} already exists`);
        }
        const book = await Book.create({
            ...data,
            availableCopies: data.totalCopies,
            timesBorrowed: 0
        });
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_CREATED',
            entity: 'Book',
            entityId: book._id,
            meta: { title: book.title, isbn: book.isbn, copies: book.totalCopies }
        });
        res.status(201).json({
            success: true,
            data: book.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateBook(req, res, next) {
    try {
        const { id } = req.params;
        const data = bookSchema.partial().parse(req.body);
        const book = await Book.findOne({ _id: id, deletedAt: null });
        if (!book) {
            throw new ApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
        }
        if (data.totalCopies !== undefined) {
            const copiesOnLoanOrHeld = book.totalCopies - book.availableCopies;
            if (data.totalCopies < copiesOnLoanOrHeld) {
                throw new ApiError(400, 'COPIES_BELOW_ON_LOAN', `Cannot reduce total copies below ${copiesOnLoanOrHeld} (copies currently on loan or held for reservations)`);
            }
            const copyDiff = data.totalCopies - book.totalCopies;
            book.totalCopies = data.totalCopies;
            book.availableCopies = Math.max(0, book.availableCopies + copyDiff);
        }
        if (data.title !== undefined)
            book.title = data.title;
        if (data.subtitle !== undefined)
            book.subtitle = data.subtitle;
        if (data.authors !== undefined)
            book.authors = data.authors;
        if (data.publisher !== undefined)
            book.publisher = data.publisher;
        if (data.publishedYear !== undefined)
            book.publishedYear = data.publishedYear;
        if (data.categories !== undefined)
            book.categories = data.categories;
        if (data.language !== undefined)
            book.language = data.language;
        if (data.pages !== undefined)
            book.pages = data.pages;
        if (data.description !== undefined)
            book.description = data.description;
        if (data.coverUrl !== undefined)
            book.coverUrl = data.coverUrl;
        if (data.shelfLocation !== undefined)
            book.shelfLocation = data.shelfLocation;
        await book.save();
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_UPDATED',
            entity: 'Book',
            entityId: book._id,
            meta: { title: book.title }
        });
        res.json({
            success: true,
            data: book.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteBook(req, res, next) {
    try {
        const { id } = req.params;
        const book = await Book.findOne({ _id: id, deletedAt: null });
        if (!book) {
            throw new ApiError(404, 'BOOK_NOT_FOUND', 'Book not found');
        }
        const activeLoans = await Loan.countDocuments({
            book: id,
            status: { $in: ['active', 'overdue'] }
        });
        if (activeLoans > 0) {
            throw new ApiError(400, 'HAS_ACTIVE_LOANS', `Cannot delete book: there are ${activeLoans} active or overdue loans for this book.`);
        }
        book.deletedAt = new Date();
        await book.save();
        await logAudit({
            actor: req.user?._id,
            action: 'BOOK_DELETED',
            entity: 'Book',
            entityId: book._id,
            meta: { title: book.title, isbn: book.isbn }
        });
        res.json({
            success: true,
            data: { message: `Book "${book.title}" was removed successfully.` }
        });
    }
    catch (error) {
        next(error);
    }
}
