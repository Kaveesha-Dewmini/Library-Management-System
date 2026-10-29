import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Book } from './models/Book.js';
import { Category } from './models/Category.js';
import { Loan } from './models/Loan.js';
import { Reservation } from './models/Reservation.js';
import { Fine } from './models/Fine.js';
import { Setting } from './models/Setting.js';
import { AuditLog } from './models/AuditLog.js';
import { Counter } from './models/Counter.js';
dotenv.config();
export async function seedDatabase(force = false) {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfwise';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
        }
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0 && !force) {
            console.log(' Database already contains data. Skipping auto-seed.');
            return;
        }
        console.log(' Seeding database with realistic Shelfwise demo data...');
        // Clear existing collections
        await Promise.all([
            User.deleteMany({}),
            Book.deleteMany({}),
            Category.deleteMany({}),
            Loan.deleteMany({}),
            Reservation.deleteMany({}),
            Fine.deleteMany({}),
            Setting.deleteMany({}),
            AuditLog.deleteMany({}),
            Counter.deleteMany({})
        ]);
        // 1. Settings
        const settings = await Setting.create({
            libraryName: 'Shelfwise City Library',
            loanPeriod: 14,
            maxLoans: 5,
            maxRenewals: 2,
            finePerDay: 10,
            maxFine: 500,
            fineLimit: 200,
            holdDays: 3,
            currency: 'LKR'
        });
        // 2. Passwords
        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('Admin@123', salt);
        const libPass = await bcrypt.hash('Librarian@123', salt);
        const memberPass = await bcrypt.hash('Member@123', salt);
        // 3. Counter for memberId
        let memberSeq = 1;
        const nextMemberId = () => `LIB-${String(memberSeq++).padStart(5, '0')}`;
        // 4. Create Staff & Demo Accounts
        const admin = await User.create({
            name: 'System Administrator',
            email: 'admin@shelfwise.test',
            passwordHash: adminPass,
            role: 'admin',
            phone: '077 100 0001',
            status: 'active'
        });
        const librarian = await User.create({
            name: 'Nimal Perera',
            email: 'librarian@shelfwise.test',
            passwordHash: libPass,
            role: 'librarian',
            phone: '077 200 0002',
            status: 'active'
        });
        const librarian2 = await User.create({
            name: 'Kavindi Silva',
            email: 'kavindi@shelfwise.test',
            passwordHash: libPass,
            role: 'librarian',
            phone: '071 200 0003',
            status: 'active'
        });
        // Demo Member
        const demoMember = await User.create({
            name: 'Kasun Fernando',
            email: 'member@shelfwise.test',
            passwordHash: memberPass,
            role: 'member',
            memberId: nextMemberId(),
            phone: '077 345 6789',
            address: 'No 45, Galle Road, Colombo 03',
            status: 'active'
        });
        // Realistic Members
        const memberProfiles = [
            { name: 'Shalini Jayasinghe', email: 'shalini.j@example.com', phone: '071 456 7890', address: 'Kandy Road, Kiribathgoda' },
            { name: 'Dinesh Wickramasinghe', email: 'dinesh.w@example.com', phone: '076 567 8901', address: 'Ward Place, Colombo 07' },
            { name: 'Anuki De Silva', email: 'anuki.desilva@example.com', phone: '077 678 9012', address: 'Peradeniya Road, Kandy' },
            { name: 'Buddhika Senanayake', email: 'buddhika.s@example.com', phone: '072 789 0123', address: 'Main Street, Negombo' },
            { name: 'Dilani Samarawickrama', email: 'dilani.s@example.com', phone: '075 890 1234', address: 'Beach Road, Mount Lavinia' },
            { name: 'Roshan Gunathilake', email: 'roshan.g@example.com', phone: '077 901 2345', address: 'High Level Road, Nugegoda' },
            { name: 'Tharushi Weerakkody', email: 'tharushi.w@example.com', phone: '071 012 3456', address: 'Dharmapala Mawatha, Galle' },
            { name: 'Mahesh Alwis', email: 'mahesh.a@example.com', phone: '077 123 7890', address: 'Havelock Road, Colombo 05' },
            { name: 'Chathurika Mendis', email: 'chathurika.m@example.com', phone: '078 234 8901', address: 'Station Road, Moratuwa' },
            { name: 'Sanjaya Jayawardena', email: 'sanjaya.j@example.com', phone: '070 345 9012', address: 'Kurunegala Road, Katunayake', status: 'suspended' }
        ];
        const createdMembers = [demoMember];
        for (const p of memberProfiles) {
            const m = await User.create({
                name: p.name,
                email: p.email,
                passwordHash: memberPass,
                role: 'member',
                memberId: nextMemberId(),
                phone: p.phone,
                address: p.address,
                status: p.status || 'active'
            });
            createdMembers.push(m);
        }
        // Save Counter
        await Counter.create({ _id: 'memberId', seq: memberSeq - 1 });
        // 5. Categories
        const categoriesData = [
            { name: 'Fiction', slug: 'fiction', color: '#3B82F6' },
            { name: 'Science', slug: 'science', color: '#10B981' },
            { name: 'History', slug: 'history', color: '#F59E0B' },
            { name: 'Biography', slug: 'biography', color: '#8B5CF6' },
            { name: 'Children', slug: 'children', color: '#EC4899' },
            { name: 'Technology', slug: 'technology', color: '#06B6D4' },
            { name: 'Business', slug: 'business', color: '#EAB308' },
            { name: 'Self-help', slug: 'self-help', color: '#F97316' },
            { name: 'Sri Lankan Literature', slug: 'sri-lankan-lit', color: '#EF4444' },
            { name: 'Poetry', slug: 'poetry', color: '#6366F1' }
        ];
        const categoryMap = new Map();
        for (const cat of categoriesData) {
            const created = await Category.create(cat);
            categoryMap.set(cat.slug, created);
        }
        // 6. Books (Real titles, authors, ISBNs for Open Library covers)
        const booksData = [
            {
                title: 'Sapiens: A Brief History of Humankind',
                authors: ['Yuval Noah Harari'],
                isbn: '9780062316097',
                publisher: 'Harper',
                publishedYear: 2015,
                categories: [categoryMap.get('history')._id, categoryMap.get('science')._id],
                language: 'English',
                pages: 464,
                shelfLocation: 'H-01',
                totalCopies: 4,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
                description: 'From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution.'
            },
            {
                title: 'Atomic Habits',
                subtitle: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
                authors: ['James Clear'],
                isbn: '9780735211292',
                publisher: 'Avery',
                publishedYear: 2018,
                categories: [categoryMap.get('self-help')._id, categoryMap.get('business')._id],
                language: 'English',
                pages: 320,
                shelfLocation: 'S-04',
                totalCopies: 5,
                availableCopies: 3,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
                description: 'A supremely practical guide on how small changes can produce revolutionary results.'
            },
            {
                title: 'Dune',
                authors: ['Frank Herbert'],
                isbn: '9780441172719',
                publisher: 'Ace Books',
                publishedYear: 1965,
                categories: [categoryMap.get('fiction')._id],
                language: 'English',
                pages: 896,
                shelfLocation: 'F-12',
                totalCopies: 3,
                availableCopies: 0, // All checked out to test reservations
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
                description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family.'
            },
            {
                title: 'The Midnight Library',
                authors: ['Matt Haig'],
                isbn: '9780525559474',
                publisher: 'Viking',
                publishedYear: 2020,
                categories: [categoryMap.get('fiction')._id],
                language: 'English',
                pages: 304,
                shelfLocation: 'F-08',
                totalCopies: 4,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
                description: 'Between life and death there is a library, and within that library, the shelves go on forever.'
            },
            {
                title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
                authors: ['Robert C. Martin'],
                isbn: '9780132350884',
                publisher: 'Prentice Hall',
                publishedYear: 2008,
                categories: [categoryMap.get('technology')._id],
                language: 'English',
                pages: 464,
                shelfLocation: 'T-02',
                totalCopies: 3,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
                description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.'
            },
            {
                title: 'The Seven Moons of Maali Almeida',
                authors: ['Shehan Karunatilaka'],
                isbn: '9781788166683',
                publisher: 'Sort of Books',
                publishedYear: 2022,
                categories: [categoryMap.get('sri-lankan-lit')._id, categoryMap.get('fiction')._id],
                language: 'English',
                pages: 386,
                shelfLocation: 'SL-01',
                totalCopies: 4,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9781788166683-L.jpg',
                description: 'Winner of the Booker Prize 2022. Colombo, 1990. Maali Almeida, war photographer and gambler, has woken up dead.'
            },
            {
                title: 'Anil’s Ghost',
                authors: ['Michael Ondaatje'],
                isbn: '9780375713439',
                publisher: 'Vintage',
                publishedYear: 2000,
                categories: [categoryMap.get('sri-lankan-lit')._id, categoryMap.get('fiction')._id],
                language: 'English',
                pages: 320,
                shelfLocation: 'SL-02',
                totalCopies: 3,
                availableCopies: 3,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780375713439-L.jpg',
                description: 'Set in Sri Lanka during its civil war, a forensic anthropologist investigates a murder with sweeping historical consequences.'
            },
            {
                title: 'Thinking, Fast and Slow',
                authors: ['Daniel Kahneman'],
                isbn: '9780374533557',
                publisher: 'Farrar, Straus and Giroux',
                publishedYear: 2011,
                categories: [categoryMap.get('science')._id, categoryMap.get('self-help')._id],
                language: 'English',
                pages: 499,
                shelfLocation: 'S-01',
                totalCopies: 3,
                availableCopies: 1,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg',
                description: 'The monumental bestseller that explains the two systems that drive the way we think.'
            },
            {
                title: 'The Psychology of Money',
                subtitle: 'Timeless lessons on wealth, greed, and happiness',
                authors: ['Morgan Housel'],
                isbn: '9780857197689',
                publisher: 'Harriman House',
                publishedYear: 2020,
                categories: [categoryMap.get('business')._id],
                language: 'English',
                pages: 256,
                shelfLocation: 'B-03',
                totalCopies: 4,
                availableCopies: 3,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
                description: 'Doing well with money isn’t necessarily about what you know. It’s about how you behave.'
            },
            {
                title: 'The Hobbit',
                authors: ['J.R.R. Tolkien'],
                isbn: '9780547928227',
                publisher: 'Houghton Mifflin Harcourt',
                publishedYear: 1937,
                categories: [categoryMap.get('fiction')._id, categoryMap.get('children')._id],
                language: 'English',
                pages: 320,
                shelfLocation: 'F-03',
                totalCopies: 3,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg',
                description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, until Gandalf arrives.'
            },
            {
                title: 'Deep Work: Rules for Focused Success in a Distracted World',
                authors: ['Cal Newport'],
                isbn: '9781455586691',
                publisher: 'Grand Central Publishing',
                publishedYear: 2016,
                categories: [categoryMap.get('business')._id, categoryMap.get('technology')._id],
                language: 'English',
                pages: 304,
                shelfLocation: 'B-05',
                totalCopies: 3,
                availableCopies: 2,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
                description: 'One of the most valuable skills in our economy is becoming increasingly rare: Deep Work.'
            },
            {
                title: 'Milk and Honey',
                authors: ['Rupi Kaur'],
                isbn: '9781449474256',
                publisher: 'Andrews McMeel Publishing',
                publishedYear: 2015,
                categories: [categoryMap.get('poetry')._id],
                language: 'English',
                pages: 208,
                shelfLocation: 'P-01',
                totalCopies: 2,
                availableCopies: 1,
                coverUrl: 'https://covers.openlibrary.org/b/isbn/9781449474256-L.jpg',
                description: 'A collection of poetry and prose about survival, the experience of violence, abuse, love, and loss.'
            }
        ];
        const createdBooks = [];
        for (const b of booksData) {
            const book = await Book.create({
                ...b,
                timesBorrowed: Math.floor(Math.random() * 20) + 5
            });
            createdBooks.push(book);
        }
        // 7. Loans (Active, Due Soon, Overdue, Returned)
        const now = new Date();
        // Active loan 1 for demoMember (due in 5 days)
        const dueIn5Days = new Date(now);
        dueIn5Days.setDate(dueIn5Days.getDate() + 5);
        const loan1 = await Loan.create({
            book: createdBooks[0]._id, // Sapiens
            member: demoMember._id,
            issuedBy: librarian._id,
            issuedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
            dueAt: dueIn5Days,
            renewals: 0,
            status: 'active'
        });
        // Active loan 2 for demoMember (due tomorrow)
        const dueTomorrow = new Date(now);
        dueTomorrow.setDate(dueTomorrow.getDate() + 1);
        const loan2 = await Loan.create({
            book: createdBooks[1]._id, // Atomic Habits
            member: demoMember._id,
            issuedBy: librarian._id,
            issuedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
            dueAt: dueTomorrow,
            renewals: 0,
            status: 'active'
        });
        // Overdue loan for createdMembers[1] (Overdue by 4 days)
        const overdueDue = new Date(now);
        overdueDue.setDate(overdueDue.getDate() - 4);
        const overdueLoan1 = await Loan.create({
            book: createdBooks[4]._id, // Clean Code
            member: createdMembers[1]._id,
            issuedBy: librarian._id,
            issuedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
            dueAt: overdueDue,
            renewals: 0,
            status: 'overdue'
        });
        // Overdue loan for createdMembers[2] (Overdue by 12 days)
        const overdueDue2 = new Date(now);
        overdueDue2.setDate(overdueDue2.getDate() - 12);
        const overdueLoan2 = await Loan.create({
            book: createdBooks[7]._id, // Thinking Fast and Slow
            member: createdMembers[2]._id,
            issuedBy: librarian._id,
            issuedAt: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000),
            dueAt: overdueDue2,
            renewals: 1,
            status: 'overdue'
        });
        // Returned loan with paid fine
        const returnedLoan = await Loan.create({
            book: createdBooks[3]._id,
            member: demoMember._id,
            issuedBy: librarian._id,
            returnedTo: librarian._id,
            issuedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            dueAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
            returnedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 4 days late
            renewals: 0,
            status: 'returned'
        });
        // Fine for returned loan (Paid)
        await Fine.create({
            loan: returnedLoan._id,
            member: demoMember._id,
            amount: 40,
            daysLate: 4,
            status: 'paid',
            paymentMethod: 'cash',
            paidAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
            handledBy: librarian._id
        });
        // Fine for overdueLoan2 (Unpaid)
        await Fine.create({
            loan: overdueLoan2._id,
            member: createdMembers[2]._id,
            amount: 120,
            daysLate: 12,
            status: 'unpaid'
        });
        // 8. Reservations (Dune has 0 copies available)
        const dune = createdBooks[2];
        // Reservation 1 for createdMembers[3]: Ready for pickup
        const holdExpires = new Date(now);
        holdExpires.setDate(holdExpires.getDate() + 2);
        await Reservation.create({
            book: dune._id,
            member: createdMembers[3]._id,
            status: 'ready',
            readyAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            expiresAt: holdExpires
        });
        // Reservation 2 for demoMember: Pending (position #1 in queue)
        await Reservation.create({
            book: dune._id,
            member: demoMember._id,
            status: 'pending',
            createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
        });
        // Reservation 3 for createdMembers[4]: Pending (position #2 in queue)
        await Reservation.create({
            book: dune._id,
            member: createdMembers[4]._id,
            status: 'pending',
            createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
        });
        // 9. Initial Audit Logs
        await AuditLog.create([
            {
                actor: admin._id,
                action: 'SYSTEM_INITIALIZED',
                entity: 'Setting',
                entityId: settings._id,
                meta: { name: settings.libraryName },
                createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                actor: librarian._id,
                action: 'BOOK_ISSUED',
                entity: 'Loan',
                entityId: loan1._id,
                meta: { book: 'Sapiens', member: demoMember.name },
                createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)
            },
            {
                actor: librarian._id,
                action: 'BOOK_ISSUED',
                entity: 'Loan',
                entityId: loan2._id,
                meta: { book: 'Atomic Habits', member: demoMember.name },
                createdAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                actor: librarian._id,
                action: 'FINE_PAID',
                entity: 'Fine',
                meta: { amount: 40, method: 'cash', member: demoMember.name },
                createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)
            }
        ]);
        console.log(' Shelfwise seed complete!');
        console.log('----------------------------------------------------');
        console.log('Demo Accounts:');
        console.log(' Admin:     admin@shelfwise.test     / Admin@123');
        console.log(' Librarian: librarian@shelfwise.test / Librarian@123');
        console.log(' Member:    member@shelfwise.test    / Member@123');
        console.log('----------------------------------------------------');
    }
    catch (error) {
        console.error(' Error during seeding:', error);
    }
}
// If run directly via command line
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
    seedDatabase(true).then(() => {
        mongoose.disconnect();
        process.exit(0);
    });
}
