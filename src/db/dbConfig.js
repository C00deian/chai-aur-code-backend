import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDb() {

    const port = process.env.PORT;
    try {
        const connectionInstance = await mongoose.connect(

            `${process.env.MONGO_URI}/${DB_NAME}`
        );

        console.log(
            `\n 🛢 MongoDb Connected DB Host || ${connectionInstance.connection.host}:${port}`
        );
    } catch (error) {
        console.log("DB connection Failed :", error);
    }
}

export default connectDb;

// Default Export: Typically used when a module only needs to export a single function, class, or object.