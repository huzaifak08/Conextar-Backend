import { Router } from "express";
import * as RoundtableController from "../controllers/roundtable_controller";
import { requireAuth } from "../middlewares/auth_middleware";

const router = Router();

router.use(requireAuth);

router.post("/create", RoundtableController.createRoundtable);
router.post("/join", RoundtableController.joinWithCode);
router.get("/my-feeds", RoundtableController.getMyRoundtables);
router.put("/update/:id", RoundtableController.updateRoundtable);
router.patch("/leave/:id", RoundtableController.leaveRoundtable);
router.delete("/delete/:id", RoundtableController.deleteRoundtable);

export default router;
