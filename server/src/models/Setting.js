import { Schema, model } from 'mongoose';
const settingSchema = new Schema({
    libraryName: { type: String, default: 'Shelfwise City Library' },
    loanPeriod: { type: Number, default: 14 },
    maxLoans: { type: Number, default: 5 },
    maxRenewals: { type: Number, default: 2 },
    finePerDay: { type: Number, default: 10 },
    maxFine: { type: Number, default: 500 },
    fineLimit: { type: Number, default: 200 },
    holdDays: { type: Number, default: 3 },
    currency: { type: String, default: 'LKR' }
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
export const Setting = model('Setting', settingSchema);
export async function getSettings() {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = await Setting.create({});
    }
    return settings;
}
