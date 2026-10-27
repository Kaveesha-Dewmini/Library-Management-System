import { Schema, model } from 'mongoose';
const fineSchema = new Schema({
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    daysLate: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'other'], default: null },
    paidAt: { type: Date, default: null },
    waiveReason: { type: String, default: '' },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
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
fineSchema.index({ member: 1, status: 1 });
fineSchema.index({ loan: 1 });
export const Fine = model('Fine', fineSchema);
