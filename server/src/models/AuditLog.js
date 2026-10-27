import { Schema, model } from 'mongoose';
const auditLogSchema = new Schema({
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: { createdAt: true, updatedAt: false },
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
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
export const AuditLog = model('AuditLog', auditLogSchema);
export async function logAudit(params) {
    try {
        await AuditLog.create(params);
    }
    catch (err) {
        console.error('AuditLog Error:', err);
    }
}
