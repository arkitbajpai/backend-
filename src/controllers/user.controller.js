import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadonCloudniary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

import mongoose from "mongoose"

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
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files&& Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
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
 if(!username && !email)
  {
    throw new ApiError(400, "username or password is required");

  }
  const user=await User.findOne({$or:[{email},{username}]})
console.log(email)
console.log(password)
  if(!user){
    throw new ApiError(400, "Invalid username");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid cred");
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

const logoutUser=asyncHandler(async(req,res)=>{
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
return res.status(200).clearCookie("accesesToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out successfully"))


})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookie.refreshToken||req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"unauthorized rerquest")
    }try{

   const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user = await User.findById(decodedToken?._id)
   if(!user)
   {
    throw new ApiError(401,"invalid refresh token")
    }
    if(incomingRefreshToken!== user?.refreshToken){
        throw new ApiError(401,"Refresh Toen is expired or used")
    }
    const options={
        httpOnly:true,
        secure:true
    }
     const {newaccessToken,newrefreshToken}=await generateAccessTokenAndRefreshTokens(user._id)

    return res.status(200).cookie("accesToken",newaccessToken,options).
    cookie("refreshToken",newrefreshToken,options).json(new ApiResponse(200,{newaccessToken,newrefreshToken},"Access token refreshed"))
}catch(error){
    throw new ApiError(401, error?.message||"invalid refresh token")
}


})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user = await User.findById(req.user?._id)
    user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password=newPassword
   await user.save({validateBeforeSave:false})
   return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})
const getCurrentUsers= asyncHandler(async(req,res)=>{
    return res.status(200).json(200, req.user,"current user fetched successfully")
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body
    if(!fullName||!email)
    {
        throw ApiError(400,"All feilds are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
    $set:{
        fullName:fullName,
        email:email
    }
     }
    ,{new: true}
    ).select("-password")
   return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadonCloudniary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Avatar upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new :true}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const CoverLocalPath=req.file?.path
    if(!CoverLocalPath)
    {
        throw new ApiError(400,"COver Image file is missing")
    }

    const coverImage=await uploadonCloudniary(CoverLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Cover Image  upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage: coverImage
        }
    },{new :true}).select("-password")

     return res.status(200)
    .json(new ApiResponse(200,user,"CoverImage updated successfully"))
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }

   const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"

            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                    isSubscribed:{
                        $cond:{
                            if: {$in: [req. user?._id, "$subscribers. subscriber" ]},
                                then: true,
                                else: false
                        }
                    }
                }

            },
            {
                $project:{
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1

                }
            }
        
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }
    return res.status(200).json(
        new ApiResponse(200,channel[0],"User Channel fetched successfully")
    )
    })

    const getWatchHistory= asyncHandler(async(req,res)=>{
        const user=await User.aggregate([
         {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
         },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]

                    }
            },{
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            }]

            }
         }
        ])
        return res.status(200).json( new ApiResponse(
            200,
            user[0].watchHistory,"watch history successfully"
        ))
    })

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword, getCurrentUsers,updateAccountDetails,
    updateUserAvatar,updateUserCoverImage,getWatchHistory, getUserChannelProfile }