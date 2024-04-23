import { Router } from 'express'
import {
    changeCorrentPassword,
    getUserChennelProfile,
    getWatchHistory,
    logOutUser,
    loginUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar
} from '../controllers/user.controller.js';


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
userRouter.route('/refresh-token').post(verifyJwtToken,refreshAccessToken)

// Secured Routes
userRouter.route('/logout').post(verifyJwtToken, logOutUser)
userRouter.route('/change-password').patch(verifyJwtToken,changeCorrentPassword)
userRouter.route('/update-account-detail').patch(verifyJwtToken, updateAccountDetails)
userRouter.route('/update-profile-avatar').patch(verifyJwtToken, upload.single(('avatar')), updateUserAvatar)

userRouter.route('/channel').get(verifyJwtToken, getUserChennelProfile)
userRouter.route('/watch-history').get(verifyJwtToken, getWatchHistory)


export default userRouter