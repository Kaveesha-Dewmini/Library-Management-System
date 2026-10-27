import { Schema, model } from 'mongoose';
const reservationSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'ready', 'fulfilled', 'cancelled', 'expired'],
        default: 'pending'
    },
    readyAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' }
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
reservationSchema.index({ book: 1, status: 1, createdAt: 1 });
reservationSchema.index({ member: 1, status: 1 });
export const Reservation = model('Reservation', reservationSchema);
