import { Router} from "express";
import { changeCurrentPassword, getCurrentUsers, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
const router=Router();
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },{
        name:"coverImage",
        maxCount:1
    }
]),registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyjwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyjwt, changeCurrentPassword)
router.route("/current-user").get(verifyjwt,getCurrentUsers)
router.route("/update-account").patch(verifyjwt,updateAccountDetails)
  


router.route("/avatar").patch(verifyjwt, upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyjwt,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyjwt, getUserChannelProfile)
router.route("/history").get(verifyjwt,getWatchHistory)
export default router