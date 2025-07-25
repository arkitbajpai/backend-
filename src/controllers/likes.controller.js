import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
   }
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });
    if((existingLike)){
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
    }
    const newLike =await Like.create({
        video: videoId,
        likedBy: req.user._id
    });
    if(!newLike){
        throw new ApiError(500, "Failed to like video");
    }
    return res.status(201).json(new ApiResponse(201, newLike, "Video liked successfully"));

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID");
    }
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });
    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
    }
    const commentLike= await Like.create({
        comment:commentId,
        likedBy: req.user._id
    })
    if(!commentLike){
        throw new ApiError(500, "Failed to like comment");
    }
    return res.status(201).json(new ApiResponse(201, commentLike, "Comment liked successfully"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}