import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import {apiError} from '../utils/apiError.js'
import { video } from "../models/video.models.js";
import { user } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/fileupload.js";
import {subscription} from '../models/subcription.models.js'
import {notificationQueue} from '../queue/notificationQueue.js'
import {notificationWorker,publishNotification} from "../queue/notificationProcessor.js"

//get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

})

//get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const videoLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnailFile?.[0].path

    if(!videoLocalPath){
        throw new apiError(400,"Video is Required")
    }
    if(!thumbnailLocalPath){
        throw new apiError(400,"Thumbnail Photo is Required")
    }

    const videofile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!videofile) {
        throw new apiError(400, "Video file not found");
    }

    if (!thumbnail) {
        throw new apiError(400, "Thumbnail not found");
    }


    
    // console.log(Video)
    const PublishVideo = await video.create(
        {
            videofile:{
                url: videofile.url,
                public_id: videofile.public_id,
            },
            thumbnail:{
                url: thumbnail.url,
                public_id: thumbnail.public_id,
            },
            title:title,
            description,
            duration:videofile.duration,
            // views:0,
            isPublished:true,
            owner:req.user._id

        }
    )
    const contentCreator = req.user._id
    let emails = ["devanshchowdhury@gmail.com"]
    // try {
    //     const result = await subscription.aggregate([
    //       {
    //         $match: { channel: mongoose.Types.ObjectId(contentCreator) },
    //       },
    //       {
    //         $lookup: {
    //           from: "users", 
    //           localField: "subscriber",
    //           foreignField: "_id",
    //           as: "subscriberDetails",
    //         },
    //       },
          
    //       { $unwind: "$subscriberDetails" },
          
    //       {
    //         $project: {
    //           _id: 0,
    //           email: "$subscriberDetails.email",
    //         },
    //       },
    //     ]);
    //     console.log("Result",result)
    //     // Extract emails from the result array
    //     emails = result.map((doc) => doc.email);
    //   } catch (error) {
    //     console.error("Error fetching subscriber emails:", error);
    //     throw new apiError(400, "Subscriber Email Issue");;
    //   }

    try {
        // console.log("List of EMAILS",emails)
        for (const subscriberEmail of emails){
            await publishNotification('sendEmail', "New Video Uploaded", subscriberEmail)
        }
    } catch (error) {
        throw new apiError(400, "Failed to notify subscribers.",error);
    }



    return res.status(201).json(
        new apiResponse(200,PublishVideo,"Video Published Succesfully") 
    )
})
//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid Video Id")
    }
    // Get Video Likes , Owner Info
    const Video = await video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $lookup:{
                            from: "subscription",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        }
                    },
                    {
                        $addFields:{
                            subscriberCount:{
                                $size:"$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if:{
                                        $in:[req.user._id,"$subscribers.subscriber"]
                                    },
                                    then:true,
                                    else:false,                                    
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            subscribersCount:1,
                            isSubscribed:1

                        }
                    }
                    
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLikedBy:{
                    $cond:{
                        if:{
                            $in:[req.user._id,"$likes.likedBy"]
                        },
                        then:true,
                        else:false,  
                    }
                }
            }
        },
        {
            $project:{
                "videofile.url":1,
                title:1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLikedBy: 1,
            }
        }
    ]) 
    if(!Video){
        throw new apiError(401,"Failed to Fetch Video Information")
    }

    await video.findByIdAndUpdate(
        videoId,
        {
            $inc:{views:1},   
        },
        {new:true}
    )
    await user.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { watchHistory: videoId } }
    )
    return res
    .status(200)
    .json(
        new apiResponse(200,Video[0],"Video Details Fetched")
    )


})

//update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath  = req.files?.thumbnail?.[0].path
    console.log(thumbnailLocalPath)
    if(!isValidObjectId(videoId)){
        throw new apiError(401,"Invalid Video ID")
    }

    if((!title)||(!description)){
        throw new apiError(401,"Title and Description Required")
    }

    const orinalVideo = await video.findById(videoId)
    if(!orinalVideo){
        throw new apiError(400,"Video Not found")
    }

    if(req.user._id.toString() != orinalVideo.owner.toString()){
        console.log(req.user._id, orinalVideo.owner)
        throw new apiError(401,"UnAuthorized to make the change")
    }

    // Deleting Old thumbnail
    const oldThumbnailurl = orinalVideo.thumbnail.public_id
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!newThumbnail){
        throw new apiError(401,"Thumbnail Not Found")
    }
    const updatedVideo = video.findByIdAndUpdate(videoId,
        {$set:{
            title,
            description,
            thumbnail:{
                public_id:newThumbnail.public_id,
                url:newThumbnail.url
            }
        }}
    )
    if(!updatedVideo){
        throw new apiError(500,"Failed to update Video , Try again")
    }
    console.log('New added')
    await deleteFromCloudinary(oldThumbnailurl)

    return res
    .status(200)
    .json(
        new apiResponse(200,updatedVideo,"Video Uploaded Successfully")
    )
})

//delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new apiError(401,"Invalid Video ID")
    }
    const Video = await video.findById(videoId)
    if(!Video){
        throw new apiError(401,"Video Not found")
    }


    if(req.user._id.toString() != Video.owner.toString()){
        throw new apiError(401,"UnAuthorized to make the change")
    }

    const VideoDeleted = await video.findByIdAndDelete(videoId)
    if(!VideoDeleted){
        throw new apiError(400,"Failed to Delete Video")
    }

    await deleteFromCloudinary(Video.videofile.public_id)
    await deleteFromCloudinary(Video.thumbnail.public_id)
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new apiError(401,"Invalid Video ID")
    }
    const Video = await video.findById(videoId)
    if(!Video){
        throw new apiError(401,"Video Not found")
    }


    if(req.user._id.toString() != Video.owner.toString()){
        throw new apiError(401,"UnAuthorized to make the change")
    }

    const toggleVideoStatus = await video.findByIdAndUpdate(videoId,
        {$set:{
            togglePublishStatus:!video?.isPublished
        }},
        {
            new:true
        }
    )
    if(!toggleVideoStatus){
        throw new ApiError(500, "Failed to toogle video publish status");
    }
    return res
        .status(200)
        .json(
        new ApiResponse(
            200,
            { isPublished: toggleVideoStatus.isPublished },
            "Video publish toggled successfully"
        )
    );



})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}