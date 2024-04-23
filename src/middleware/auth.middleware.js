import {User} from '../models/user.model.js'
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

// to check if user exist or not 

const verifyJwtToken = asyncHandler(async(req, 
    _, next) => {

  try {
    //stored jwt in cookies at accessToken key
     const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', "");
 
     if (!token) {
         throw new ApiError(401, 'Unauthorized request');
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       // console.log('decodedToken', decodedToken)
 
     const user = await User.findById(decodedToken?.id).select("-password -refreshToken");
    // console.log( "user Id " , user.id)
       if (!user) {
         
         throw new ApiError(401, 'Invalid Access Token');
      }
      
      // Authorize user to access the resources
     // console.log(user)
      req.authorizedUser = user
   
      //  req.user = user;
       next();
       
   } catch (error) {
       throw new ApiError(401, error?.message || 'Invalid Access Token');
   }

})

export { verifyJwtToken }