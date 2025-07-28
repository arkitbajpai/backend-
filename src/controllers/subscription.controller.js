import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }
     if(channelId === req.user._id.toString()){
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    });
    if(existingSubscription){
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    }
    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });
    if(!newSubscription){
        throw new ApiError(400, "Failed to subscribe to channel");
    }   
    return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel not found");
    }
    const subscribers=await Subscription.aggregate([{
        $match:{
            channel: new mongoose.Types.ObjectId(channelId)
        },

    }, {
        $lookup:{
            from:"users",
            localField:"suscriber",
            foreignField:"_id",
            as:"subscriberDetails"
        }
    },{
        $unwind:"$subscriberDetails"
    },{
        $project:{
            _id:0,
            subscriberId:"$subscriberDetails._id",
            subscriberName:"$subscriberDetails.name"
        }
    }
    ]);
    if(!subscribers || subscribers.length === 0){
        throw new ApiError(404, "No subscribers found for this channel");
    }
    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber ID");
    }
    const user = await User.findById(subscriberId)
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },{
            $lookup:{
                from:"users",
                localFiled:"channel",
                foreignField:"_id",
                as:"channelDetails"
            }
        },
        {
            $unwind:"$channelDetails"
        },
        {
            $project:{
                _id:0,
                channelId:"$channelDetails._id",
                channelName:"$channelDetails.name",
            }
        }
    ])
    if(!subscribedChannels || subscribedChannels.length === 0){
        throw new ApiError(404, "No subscribed channels found for this user");
    }
    return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}