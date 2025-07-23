import {Router} from "express"

import{
     deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/videoController.js"
import { verifyjwt } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router= Router();
router.use(verifyjwt);
router.route("/").get(getAllVideos).post(upload.fields([
    {
        name:"videoFile", 
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    },
]),
publishAVideo);
