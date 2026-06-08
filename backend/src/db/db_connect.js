import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // First attempt (SRV) failed – try a plain connection if a fallback URI is provided
        if (error && error.code === 'EREFUSED' && process.env.MONGODB_URI_FALLBACK) {
            console.warn('\n⚠️ SRV lookup failed, attempting fallback URI...');
            try {
                const fallbackInstance = await mongoose.connect(`${process.env.MONGODB_URI_FALLBACK}/${process.env.DB_NAME}`);
                console.log(`\n✅ Fallback MongoDB connected !! DB Host: ${fallbackInstance.connection.host}`);
                return; // success – exit the function
            } catch (fallbackError) {
                console.error('Fallback MongoDB connection FAILED ', fallbackError);
            }
        }
        // Original error handling (including detailed SRV guidance)
        if (error && error.code === 'EREFUSED') {
            console.error('\n❌ MongoDB SRV lookup failed.');
            console.error('Possible causes:');
            console.error('- Your network blocks DNS SRV queries.');
            console.error('- Atlas IP whitelist does not include this machine.');
            console.error('- Use a standard (mongodb://) connection string in .env or whitelist your IP.');
        }
        console.log('MONGODB connection FAILED ', error);
        process.exit(1);
    }
}

export default connectDB;
