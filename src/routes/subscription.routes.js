import {
 
  getSubscribedChannels,
  toggleSubscription,
  getUserChannelSubscribers
} from "../controllers/subscription.controller.js";

import verifyjwt from "../middleware/auth.middleware.js";

import { Router } from "express";
const router = Router();

router.use(verifyjwt);
//apply verifyJWT to ll routes in this file

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router;