import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'librarian', 'member'], default: 'member' },
    memberId: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash;
            return ret;
        }
    }
});
userSchema.index({ role: 1, status: 1 });
export const User = model('User', userSchema);
