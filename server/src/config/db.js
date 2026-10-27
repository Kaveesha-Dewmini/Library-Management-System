import mongoose from 'mongoose';
export async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfwise';
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${uri}`);
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        console.log('💡 Note: Ensure MongoDB is running locally (e.g., mongod or MongoDB Community Server), or provide a MONGODB_URI in server/.env');
        // Don't kill process immediately in dev so app can log meaningful hints
    }
}
