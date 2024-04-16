import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDb() {
    try {
        const connectionInstance = await mongoose.connect(

            `${process.env.MONGO_URI}/${DB_NAME}`
        );

        console.log(
            `\n🛢 MongoDb Connected DB Host || ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log("Db connection Failed :", error);
    }
}

export default connectDb;
