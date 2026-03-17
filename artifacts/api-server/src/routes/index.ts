import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import videosRouter from "./videos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(videosRouter);

export default router;
