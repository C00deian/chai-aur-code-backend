import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js';
//const userRouter = Router();
// or
// import express from 'express';
// const userRouter = express.Router()


const userRouter = Router();

userRouter.route('/register').post(registerUser)



export default userRouter