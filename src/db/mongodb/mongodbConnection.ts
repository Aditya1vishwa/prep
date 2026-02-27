import mongoose from "mongoose";

const mongodbConnection = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI environment variable is not defined");
        }
        const connectionInstance = await mongoose.connect(uri);
        console.log(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

export default mongodbConnection;
