import { Router, type IRouter } from "express";
import healthRouter from "./health";
import boardsRouter from "./boards";
import standardsRouter from "./standards";
import subjectsRouter from "./subjects";
import chaptersRouter from "./chapters";
import topicsRouter from "./topics";
import settingsRouter from "./settings";
import quizRouter from "./quiz";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(boardsRouter);
router.use(standardsRouter);
router.use(subjectsRouter);
router.use(chaptersRouter);
router.use(topicsRouter);
router.use(settingsRouter);
router.use(quizRouter);
router.use(dashboardRouter);

export default router;
