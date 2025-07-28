import verifyjwt from "../middleware/auth.middleware.js";
import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyjwt);

router.route("/:videoId").get(getVideoComments);
router.route("/:videoId").post(addComment);
router.route("/c/:commentId").delete(deleteComment);
router.route("/c/:commentId").patch(updateComment);

export default router;