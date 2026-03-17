import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import videosRouter from "./videos";
import commentsRouter from "./comments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(videosRouter);
router.use(commentsRouter);

export default router;
