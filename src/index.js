
import dotenv from 'dotenv';
import connectDb from './db/dbConfig.js';
import { app } from "./app.js";




const port = process.env.PORT || 8000;


// Environment veriable setup 
dotenv.config({
    path: './env'
});




// Database connection and Server Listning
connectDb().then(() => {
    app.listen(port, () => console.log(`⚙️  Server  running  on Port : ${port}`))
}).catch(() => {
    console.log('MongoDb connection Failed')
});





