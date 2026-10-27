import { Schema, model } from 'mongoose';
const loanSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    returnedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now, required: true },
    dueAt: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    renewals: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'overdue', 'returned'], default: 'active' }
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
loanSchema.index({ member: 1, status: 1 });
loanSchema.index({ book: 1, status: 1 });
loanSchema.index({ dueAt: 1, status: 1 });
loanSchema.index({ createdAt: -1 });
export const Loan = model('Loan', loanSchema);
