import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field)=>field?.trim()===""))
    {
        throw new ApiError(400, "Title and description is required")
    }
    const videoLocalPath= req.files?.videoFiles[0]?.path;
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;

    if(!videoLocalPath)
    {
        throw new ApiError(400,"video file path is not found")

    }

    if(!thumbnailLocalPath)
    {
        throw new ApiError(400,"thumbnail file path is not found")
    }
    // TODO: upload video and thumbnail to cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath);

    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
      
  const video= await Video.create({
    title:title,
    description:description,
    video:videoFile.url,
    thumbnail:thumbnailFile.url,
    userId: req.user?._id,
    duration: videoFile?.duration,
    isPublished:false,
  });
  if(!video)
  {
    throw new ApiError(400,"The video is not upladed on mongo DB")
  }

  return res.status.json( new ApiResponse(200,video, "The video file is uploded succesfully"))



})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId).populate("userId")
    if(!video)
        {
            throw new ApiError(404, "Video not found")
         }
            return res.status(200).json(new ApiResponse(200, video, "Video found"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}