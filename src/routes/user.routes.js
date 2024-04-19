import { Router } from 'express'
import { logOutUser, loginUser, refreshAccessToken, registerUser } from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.js'
import { verifyJwtToken } from '../middleware/auth.middleware.js';
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

userRouter.route('/login').post(loginUser)


// Secured Routes
userRouter.route('/logout').post(verifyJwtToken, logOutUser)
userRouter.route('/refresh-token').post(refreshAccessToken)



export default userRouter