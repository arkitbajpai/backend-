import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadonCloudniary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async(req, res)=>{
    const {fullName, email, username, password}=req.body
    // if(fullName==="")
    // {
    //     throw new ApiError(400, "Fullname is required");
    // }
    if(
        [fullName,email, username,password].some((feild)=>feild?.trim()==="")
    )
    {
        throw new ApiError(400, "All fields are required");
    }
   const existedUser= await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser)
    {
        throw new ApiError(409, "Username or Email already exists");
    }
    const avatarLocalPath=req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if(req.files&& Array.isArray(req.files.coverImage)&& registerUser.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar is required")
    }
    

   const avatar =await uploadonCloudniary(avatarLocalPath)
   const coverImage= await uploadonCloudniary(coverImageLocalPath)
   
if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
  const user= await User.create({
    fullName, 
    avatar:avatar.url,
    coverImage:coverImage.url,
    email,
    password,
    username:username.toLowerCase()
   })
   const createdUserAwait= await User.findById(user._id).select(
    "-password -refreshToken"
   ).lean();
   if(!createdUserAwait){
    throw new ApiError(500, "User not found while checking");
     
   }
   return res.status(201).json(
    new ApiResponse(200, createdUserAwait,"User created suscussfully")
   )

})
export {registerUser}