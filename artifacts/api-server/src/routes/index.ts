import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import ttsRouter from "./tts";
import imageGenRouter from "./image-gen";
import stripeRouter from "./stripe";
import videoGenRouter from "./video-gen";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(ttsRouter);
router.use(imageGenRouter);
router.use(stripeRouter);
router.use(videoGenRouter);

export default router;
