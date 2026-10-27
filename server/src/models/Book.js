import { Schema, model } from 'mongoose';
const bookSchema = new Schema({
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    authors: [{ type: String, required: true, trim: true }],
    isbn: { type: String, unique: true, sparse: true, trim: true },
    publisher: { type: String, trim: true, default: '' },
    publishedYear: { type: Number },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    language: { type: String, default: 'English', trim: true },
    pages: { type: Number, default: 0 },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    shelfLocation: { type: String, required: true, trim: true, default: 'General' },
    totalCopies: { type: Number, required: true, min: 0, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    timesBorrowed: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});
bookSchema.index({ title: 'text', authors: 'text', isbn: 'text', publisher: 'text' }, { weights: { title: 10, isbn: 10, authors: 5, publisher: 1 }, name: 'BookTextIndex' });
bookSchema.index({ categories: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ timesBorrowed: -1 });
bookSchema.index({ availableCopies: 1 });
bookSchema.index({ deletedAt: 1 });
export const Book = model('Book', bookSchema);
