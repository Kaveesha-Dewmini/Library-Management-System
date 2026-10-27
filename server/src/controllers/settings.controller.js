import { getSettings } from '../models/Setting.js';
import { logAudit } from '../models/AuditLog.js';
export async function fetchSettings(_req, res, next) {
    try {
        const settings = await getSettings();
        res.json({
            success: true,
            data: settings.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateSettings(req, res, next) {
    try {
        const { libraryName, loanPeriod, maxLoans, maxRenewals, finePerDay, maxFine, fineLimit, holdDays, currency } = req.body;
        const settings = await getSettings();
        if (libraryName !== undefined)
            settings.libraryName = libraryName;
        if (loanPeriod !== undefined)
            settings.loanPeriod = Number(loanPeriod);
        if (maxLoans !== undefined)
            settings.maxLoans = Number(maxLoans);
        if (maxRenewals !== undefined)
            settings.maxRenewals = Number(maxRenewals);
        if (finePerDay !== undefined)
            settings.finePerDay = Number(finePerDay);
        if (maxFine !== undefined)
            settings.maxFine = Number(maxFine);
        if (fineLimit !== undefined)
            settings.fineLimit = Number(fineLimit);
        if (holdDays !== undefined)
            settings.holdDays = Number(holdDays);
        if (currency !== undefined)
            settings.currency = currency;
        await settings.save();
        await logAudit({
            actor: req.user?._id,
            action: 'SETTINGS_UPDATED',
            entity: 'Setting',
            entityId: settings._id,
            meta: req.body
        });
        res.json({
            success: true,
            data: settings.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
}
