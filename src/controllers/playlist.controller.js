
import mongoose, {isValidObjectId} from "mongoose"
import {playlist as Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
     //TODO: create playlist
    const {name, description} = req.body
    if(!name || name.trim() === "")
    {
        throw new ApiError(400, "Name is required to create a playlist");
    }
    const createdPlaylist = await playlist.create({
        name: name,
        description: description,
        videos:[],
        owner: req.user._id
    });
    if(!createdPlaylist)
        {
            throw new ApiError(500, "Failed to create playlist");
        }

    return res
        .status(201)
        .json(new ApiResponse(200, createdPlaylist, "Playlist created successfully"));
})

    

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id");
    }
     const user =await user.findById(userId)
     if(!user){
    throw new ApiError(404, "User not found");
     }
     const playlists= await Playlist.aggregate([
        {
            $match:{
                owner:userId
            },
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },

        
     ])
     if(!playlists || playlists.length === 0){
        throw new ApiError(404, "No playlists found for this user");
     }
     return res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }
    
    const playlist =await Playlist.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(playlistId)
                },
        }, {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
                }
        }
    ])
    console.log(playlistId);
    console.log(playlist);
    if(!playlist || playlist.length === 0){
        throw new ApiError(400, "Playlist not found");
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
     if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if(playlist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to add videos to this playlist");
    }
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    //TODO: add video to playlist
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already exists in the playlist");
    }
    playlist.videos.push(videoId);
    await playlist.save();
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if(playlist.owner!== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to remove videos from this playlist");
    }
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }
    const videoExists = playlist.videos.includes(videoId);
    if(!videoExists){
        throw new ApiError(404, "Video not found in the playlist");
    }
    const result = await Playlist.updateOne(
        {
            _id: playlistId 
        },
        {
            $pull: {videos: videoId}    
        }
    )
    if(result.modifiedCount === 0){
        throw new ApiError(400, "Failed to remove video from playlist");
    }
    return res.status(200).json(new ApiResponse(200, {}, "Video removed from playlist successfully"));

    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }
    await playlist.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlistToBeUpdated = await Playlist.findById(playlistId);
    if(!playlistToBeUpdated){
        throw new ApiError(404, "Playlist not found");
    }
    //TODO: update playlist fields
    playlistToBeUpdated.name = name;
    playlistToBeUpdated.description = description;
    const updatedPlaylist = await playlistToBeUpdated.save();
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
