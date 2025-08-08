import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadonCloudniary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pipeline = []
    if (query) {
        pipeline.push({
            $match: {
                $serch: {
                    index:"serch-videos",
                    text: {
                        query: query,
                        path: ["title", "description"]
                    }
                }

            }
        })
    }
   pipeline.push({ $match: { isPublished: true } }) 

    
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );
  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos Fetched Successfully"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(isValidObjectId(req.user._id) === false){
        throw new ApiError(400, "Invalid user ID")
    }
    // TODO: get video, upload to cloudinary, create video
    if([title,description].some((field)=>field?.trim()===""))
    {
        throw new ApiError(400, "Title and description is required")
    }
    const videoLocalPath= req.files?.videoFile[0]?.path;
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
    const videoFile = await uploadonCloudniary(videoLocalPath);

    const thumbnailFile = await uploadonCloudniary(thumbnailLocalPath);
      
  const video= await Video.create({
    title:title,
    description:description,
    videoFile:videoFile.url,
    thumbnail:thumbnailFile.url,
    owner: req.user?._id,
    duration: videoFile?.duration,
    isPublished:false,
  });
  if(!video)
  {
    throw new ApiError(400,"The video is not upladed on mongo DB")
  }

  return res.status(200).json( new ApiResponse(200,video, "The video file is uploded succesfully"))



})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    if(!video)
        {
            throw new ApiError(404, "Video not found")
         }
            return res.status(200).json(new ApiResponse(200, video, "Video found"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
     const videoToBeUpdated = await Video.findById(videoId)
    if(!videoToBeUpdated) {
        throw new ApiError(404, "Video not found")
    }
    if(videoToBeUpdated.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }
      const { title, description,thumbnail} = req.body
    if([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and description are required")
    }
    if(thumbnail){
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path
        if(!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail file path is not found")
        }
        const thumbnailFile = await uploadonCloudniary(thumbnailLocalPath)
        videoToBeUpdated.thumbnail = thumbnailFile.url
    }
    videoToBeUpdated.title = title
    videoToBeUpdated.description = description
    const updatedVideo = await videoToBeUpdated.save()
    if(!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }   
    
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const videoToBeDeleted = await Video.findById(videoId)
    if(!videoToBeDeleted) {
        throw new ApiError(404, "Video not found")
    }
    if(videoToBeDeleted.owner.toString()!== req.user._id.toString()) {
        throw new ApiError(400, "You are not authorized to delete this video")
    }
      const result = await videoToBeDeleted.deleteOne()
    if(!result) {
        throw new ApiError(500, "Failed to delete video")
    }
    return res.status(200).json(new ApiResponse(200,{}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized")
    }
    const video =await Video.findOne({_id: videoId, owner: req.user._id})
    if(!video) {
        throw new ApiError(404, "Video not found or you are not authorized to update this video")
    }
    video.isPublished = !video.isPublished
    const updatedVideo = await video.save()
    if(!updatedVideo) {
        throw new ApiError(500, "Failed to update video publish status")
    }
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video publish status toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}