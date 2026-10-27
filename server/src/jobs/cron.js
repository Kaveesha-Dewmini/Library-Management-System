import cron from 'node-cron';
import { Loan } from '../models/Loan.js';
import { Reservation } from '../models/Reservation.js';
import { Book } from '../models/Book.js';
import { getSettings } from '../models/Setting.js';
export async function processOverdueLoans() {
    try {
        const now = new Date();
        const result = await Loan.updateMany({ status: 'active', dueAt: { $lt: now } }, { $set: { status: 'overdue' } });
        if (result.modifiedCount > 0) {
            console.log(`⏰ Cron: Updated ${result.modifiedCount} loans to "overdue" status.`);
        }
    }
    catch (err) {
        console.error('Error in processOverdueLoans job:', err);
    }
}
export async function processExpiredReservations() {
    try {
        const now = new Date();
        const settings = await getSettings();
        const expired = await Reservation.find({
            status: 'ready',
            expiresAt: { $lt: now }
        });
        for (const res of expired) {
            res.status = 'expired';
            res.cancelReason = 'Hold duration expired';
            await res.save();
            // Check if another person is waiting in queue
            const nextPending = await Reservation.findOne({
                book: res.book,
                status: 'pending'
            }).sort({ createdAt: 1 });
            if (nextPending) {
                const expiresAt = new Date(now);
                expiresAt.setDate(expiresAt.getDate() + settings.holdDays);
                nextPending.status = 'ready';
                nextPending.readyAt = now;
                nextPending.expiresAt = expiresAt;
                await nextPending.save();
                console.log(`⏰ Cron: Promoted reservation ${nextPending._id} to ready.`);
            }
            else {
                // Return copy to available pool
                await Book.findByIdAndUpdate(res.book, { $inc: { availableCopies: 1 } });
                console.log(`⏰ Cron: Returned held copy for book ${res.book} back to shelf.`);
            }
        }
    }
    catch (err) {
        console.error('Error in processExpiredReservations job:', err);
    }
}
export function initScheduledJobs() {
    // Run on startup
    processOverdueLoans();
    processExpiredReservations();
    // Run every hour: '0 * * * *'
    cron.schedule('0 * * * *', async () => {
        await processOverdueLoans();
        await processExpiredReservations();
    });
    console.log('⏰ Scheduled jobs initialized (Overdue & Reservation Expiry).');
}
