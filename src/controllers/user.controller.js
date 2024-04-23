import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { options } from "../constants.js"
import mongoose from "mongoose"


// generate Access-token and Referesh-tooken
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // get refresh token  
        user.refreshToken = refreshToken
        //  console.log( ' saved refresh token',refreshToken)

        // save generated refresh token into db 
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }



    } catch (error) {
        throw new ApiError(500, 'something went wrong while generating refresh ans acces')
    }


}



const registerUser = asyncHandler(async (req, res) => {
    // get user details from client (frontend).
    // validation - not empty
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary , avatar
    // create user object - create entry in db.
    // remove password and refresh token field from reponse 
    // check for user creation 
    // return res..


    const { username, email, fullName, password } = req.body
    if (
        [username, email, fullName, password].some((field) => field?.trim() === '')

    ) {
        throw new ApiError(400, 'All fields are required')
    }

    const userExist = await User.findOne(
        {
            $or: [{ email }, { username }]
        }
    )

    if (userExist) {
        throw new ApiError(409, 'User with email or username is  Already exists')
    }

    // console.log("avatar" ,req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path

    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required')
    }
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''
    })


    const createdUser = await User.findById(user._id).select(
        '-password'
    )


    if (!createdUser) {
        throw new ApiError(500, 'Somthing went wrong while registering User')
    }

    const userObject = createdUser.toObject()

    return res.status(201).json(
        new ApiResponse(200, userObject, 'User registered Successfully')

    )


})


const loginUser = asyncHandler(async (req, res) => {

    // get username or email and password from client 
    // check  username or email  password is Empty 
    // check if username or email and matches the db's username or email 
    // check password
    // access token and refresh token
    // send Cookie

    const { email, password, username } = req.body

    if (!username && !email) {
        throw new ApiError(400, 'username or email is required');
    }

    const isUserExist = await User.findOne({

        $or: [{ email }, { username }]
    })



    if (!isUserExist) {
        throw new ApiError(404, 'user does not  Exist')
    }


    const isPasswordValid = await isUserExist.isPasswordCorrect(password)
    console.log('login pass', isPasswordValid)
    if (!isPasswordValid) {

        throw new ApiError(401, 'Invalid User Credentials')

    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(isUserExist._id)

    const loggedinUser = await User.findById(isUserExist._id).select("-password -refreshToken")


 return res.
        status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {

                "user": loggedinUser,
                accessToken, refreshToken
            },
                'User Logged In Successfully'

            )

        )

})

// Logout
const logOutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(

        req.authorizedUser._id,

        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged Out'));

})


const refreshAccessToken = asyncHandler(async (req, res) => {
try{
    //store jwt in a header cookies in a refreshToken key
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {

        throw new ApiError(401, 'unauthorized request');

    }


    
        const decodedRefreshToken =  jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedRefreshToken)
        console.log('user id ', user)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used')

        }


        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refresh: newRefreshToken }, "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error || 'invalid refresh token')
    }
})


// Change Corrent Password 
const changeCorrentPassword = asyncHandler(async (req, res) => {

    const { newPassword, oldPassword } = req.body

    if (!newPassword || !oldPassword) {
        throw new ApiError(401, 'field should not be blank')
    }

    const user = await User.findById(req.authorizedUser?._id)
    console.log('user', req.authorizedUser?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    console.log('old password', oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid old password')
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, 'password changed successfully')
    )
})


const getCurrentUser = asyncHandler(async (req, res) => {
    const userDetails = req.authorizedUser
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            userDetails,
            "current user details"
        ))
})



const updateAccountDetails = asyncHandler(async (req, res) => {

    const {  email,fullName } = req.body
    if ( !fullName) {
        
        throw new ApiError(401,'please fill the required field.')
    }

    const user = await User.findByIdAndUpdate(req.authorizedUser?._id,

        {
            $set: {
              
                email: email,
                fullName: fullName
            }
        },
        { new: true }

    ).select('-password')

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {

        throw new ApiError(400, 'Avatar file is missing')
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, 'Error while uploading avatar');
    }

    const user = await User.findByIdAndUpdate(req.authorizedUser?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }

    ).select('-password')

    return res.status(201)
        .json(new ApiResponse(200, user, 'Account profile avatar updated'))

})


const getUserChennelProfile = asyncHandler(async (req, res) => {

    const { username } = req.query

    if (!username) {
        throw new ApiError(400, 'username is missing')

    }
    const channel = await User.aggregate([


        {
            $match: {

                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        }, {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        }, {

            $addFields: {

                subscribersCount: {
                    $size: '$subscribers'
                },
                channelsSubscribedToCount: {
                    $size: '$subscribedTo'
                },

                isSubscribed: {

                    $cond: {


                        if: { $in: [req.authorizedUser?._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false
                    }
                }

            }
        }, {


            $project: {

                fullName: 1,
                username: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }


    ])
    console.log('value of channel :', channel)
    if (!channel?.length) {

        throw new ApiError(404, 'channel does not exists')
    }
   

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], 'User chennel fetched successfully'))


})


const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {

            $match: {
                //     _id: req.authorizedUser
                // ?._id not works in aggregate
                _id: new mongoose.Types.ObjectId(req.authorizedUser.
                    _id)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as:'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'User',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar:1
                                   }
                               }

                           ]
                    }    
                    }, {
                        $addFields: {
                            owner: {
                              $first:'$owner'
                          }
                      }
                    }
                ]

            }
        },

    ])
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0].watchHistory,
            'watch history fetched'
    ))


})



export {

    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCorrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserChennelProfile,
    getWatchHistory
}