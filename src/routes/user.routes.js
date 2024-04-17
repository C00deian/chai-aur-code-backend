import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.js'
//const userRouter = Router();
// or
// import express from 'express';
// const userRouter = express.Router()


const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)



export default userRouter