import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Book } from '../models/Book.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../models/AuditLog.js';
const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().min(1, 'Slug is required'),
    color: z.string().optional()
});
export async function getCategories(_req, res, next) {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        const bookCounts = await Book.aggregate([
            { $match: { deletedAt: null } },
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } }
        ]);
        const countMap = new Map();
        bookCounts.forEach((bc) => {
            countMap.set(bc._id.toString(), bc.count);
        });
        const enriched = categories.map((c) => ({
            ...c,
            id: c._id.toString(),
            bookCount: countMap.get(c._id.toString()) || 0
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
export async function createCategory(req, res, next) {
    try {
        const data = categorySchema.parse(req.body);
        const existing = await Category.findOne({
            $or: [{ name: data.name }, { slug: data.slug.toLowerCase() }]
        });
        if (existing) {
            throw new ApiError(409, 'CATEGORY_EXISTS', 'A category with this name or slug already exists');
        }
        const category = await Category.create({
            name: data.name,
            slug: data.slug.toLowerCase(),
            color: data.color || '#3B82F6'
        });
        await logAudit({
            actor: req.user?._id,
            action: 'CATEGORY_CREATED',
            entity: 'Category',
            entityId: category._id,
            meta: { name: category.name }
        });
        res.status(201).json({
            success: true,
            data: category.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateCategory(req, res, next) {
    try {
        const { id } = req.params;
        const { name, color, slug } = req.body;
        const category = await Category.findById(id);
        if (!category) {
            throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }
        if (name)
            category.name = name.trim();
        if (slug)
            category.slug = slug.toLowerCase().trim();
        if (color)
            category.color = color.trim();
        await category.save();
        res.json({
            success: true,
            data: category.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteCategory(req, res, next) {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }
        const bookCount = await Book.countDocuments({
            categories: id,
            deletedAt: null
        });
        if (bookCount > 0) {
            throw new ApiError(400, 'CATEGORY_IN_USE', `Cannot delete category: it is assigned to ${bookCount} book(s). Reassign those books first.`);
        }
        await Category.findByIdAndDelete(id);
        await logAudit({
            actor: req.user?._id,
            action: 'CATEGORY_DELETED',
            entity: 'Category',
            entityId: category._id,
            meta: { name: category.name }
        });
        res.json({
            success: true,
            data: { message: `Category "${category.name}" removed successfully.` }
        });
    }
    catch (error) {
        next(error);
    }
}
