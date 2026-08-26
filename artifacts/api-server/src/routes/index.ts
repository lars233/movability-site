import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import publicRouter from "./public";
import contactRouter from "./contact";
import siteRouter from "./site";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(adminRouter);
router.use(contactRouter);
router.use(siteRouter);

export default router;
