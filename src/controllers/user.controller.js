import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"



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

  return  { accessToken, refreshToken }



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
        '-password -refreshToken'
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


    // check password 

    const isPasswordValid = isUserExist.isPasswordCorrect(password)
    if (!isPasswordValid) {

        throw new ApiError(401, 'Invalid User Credentials')

    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(isUserExist._id)

    const loggedinUser = await User.findById(isUserExist._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true
    }
    res.
        status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {

                user: loggedinUser,
                accessToken, refreshToken
            },
                'User Logged In Successfully'

            )

        )

})

// Logout
const logOutUser = asyncHandler(async (req, res) => {

  await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged Out'));

})




export {
    registerUser,
    loginUser,
    logOutUser

}