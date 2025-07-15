import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadonCloudniary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { access } from "fs"
import { response } from "express"
const generateAccessTokenAndRefreshTokens=async(userId)=>{
    try{
   const user =  await User.findById(userId)
   const refreshToken=user.generateRefreshToken()
   const accesesToken= user.generateAccessToken()
   user.refreshToken=refreshToken
   await user.save({validateBeforeSave:false})
   return {accesesToken, refreshToken}
    }
    catch(error)
    {
        throw new ApiError(500, "SOmething  went wrong while generating refresh and acceses token")
    }
}
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

const loginUser =asyncHandler(async(req,res)=>{
    // get the data from body parser
    // check the data if presesnt or not 
    //if data is present tell the db to check for it 
    const{email, username, password}=req.body
 if(!username ||!email)
  {
    throw new ApiError(400, "username or password is required");

  }
  const user=await User.findOne({$or:[{email},{username}]})
  if(!user){
    throw new ApiError(400, "Invalid username or password");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid username or password");
        }
 const {accesesToken,refreshToken}=await generateAccessTokenAndRefreshTokens(user._id);
const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
const options={
    httpOnly:true,
    secure:true 
}

return res.status(200).cookie("accesesToken",accesesToken, options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,{
    user:loggedInUser,accesesToken,refreshToken
}
    ,"User logged in successfully"))

})

const logoutUser=async(async(req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:  {
                    refreshToken: undefined
                },
            
        },{
                new:true
            }
     )
     const options={
    httpOnly:true,
    secure:true 
} 
return res.status(200).clearCookie("accesesToken",Option)
.clearCookie("refreshToken",Option)
.json(new ApiResponse(200,{},"User logged out successfully"))


})
export {registerUser,loginUser,logoutUser}