import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"

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

    const userExist = User.findOne(
        {
            $or: [{ email }, { username }]
        }
    )

    if (userExist) {
        throw new ApiError(409, 'User with email or username already exist')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required')
    }
    const user = await User.create({
        username: username.toLowercase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = User.findById(user._id).select(
        '-password -refreshToken'
    )

    if (!createdUser) {
        throw new ApiError(500, 'Somthing went wrong while registering User')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered Successfully')

    )


})




export {
    registerUser

}