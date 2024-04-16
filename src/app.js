import express from "express";
import dotenv from 'dotenv';
import  connectDb  from "../src/db/dbConfig.js";



const app = express();
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




