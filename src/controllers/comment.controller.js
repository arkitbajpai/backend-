import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.find({videoId})
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
        }  
    },{
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
        }
    } ,{
        $unwind: "$ownerDetails"
    },{
        $project: {
            content: 1,
            createdAt: 1,
            "ownerDetails.username": 1,
            "ownerDetails.avatar": 1
        }
    },{
        $sort: {createdAt: -1}
    },{
        $skip: (page - 1) * limit
    },{
        $limit: parseInt(limit)
    }
    ])
    if(!comments || comments.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No comments found for this video"));
    }
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    const comment=await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });
    if(!comment){
        throw new ApiError(500, "Failed to add comment");
    }
    return res.status(200).json(new ApiResponse(201, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body  
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID");
    }
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required");
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    comment.content = content;
    const updatedComment = await comment.save();
    if(!updatedComment){
        throw new ApiError(500, "Failed to update comment");
    }
    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404, "You are not authorized to delete this comment");
    }
    const deletedComment = await comment.deleteOne();
    if(!deletedComment){
        throw new ApiError(500, "Failed to delete comment");
    }
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));  

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }