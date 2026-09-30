import {Router, type RequestHandler} from "express";
import {authorize} from "../middleware/authorize";

export function createAdminRouter(authenticate: RequestHandler): Router {
    const router = Router();
    router.use(authenticate, authorize("ADMIN"))


    router.get("/ping", (req, res) => {
        res.json({success: true, message: "Admin access granted", userId: req.user?.id});
    });

    return router;
}