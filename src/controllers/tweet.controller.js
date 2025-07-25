import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { isNativeError } from "node:util/types"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // Validate content
    // Check if content is provided
    const{content}= req.body;
    if(!content || content.trim() === "")
    {
        throw new ApiError(400, "Content is required to create a tweet");
    }
    // Create a new tweet
    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    });
    if(!tweet)
    {
        throw new ApiError(500, "Failed to create tweet");
    }
    // Return success response
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}= req.params;
    if(!isValidObjectId(userId))
    {
        throw new ApiError(400, "Invalid user ID");
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const tweets= await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),

            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweetToBeUpdated = await Tweet.findById(tweetId);
    if(!tweetToBeUpdated){
        throw new ApiError(404, "Tweet not found");
    }
    if(tweetToBeUpdated.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet");
    }
    const {content} = req.body;
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required to update a tweet");
    }
    tweetToBeUpdated.content = content;
    const updatedTweet = await tweetToBeUpdated.save();
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweetToBeDeleted = await Tweet.findById(tweetId);
    if(!tweetToBeDeleted){
        throw new ApiError(404, "Tweet not found");
    }
    if(tweetToBeDeleted.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }
    const deletedTweet = await tweetToBeDeleted.deleteOne();
    return res.status(200).json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));

})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}