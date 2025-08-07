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
    if(isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });
    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully"));
    }
    const tweetLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });
    if(!tweetLike){
        throw new ApiError(500, "Failed to like tweet");
    }
    return res.status(200).json(new ApiResponse(201, tweetLike, "Tweet liked successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
     // Should be an ObjectId
     
     const userId = req.user._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID");
    }
     const LikedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);


   
    if(!LikedVideos || LikedVideos.length === 0){
        throw new ApiError(400, "No liked videos found");
    }
    return res.status(200).json(new ApiResponse(200, LikedVideos, "Liked videos fetched successfully"));


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}