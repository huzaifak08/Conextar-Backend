import { Router } from "express";
import * as ParticipantController from "../controllers/participant_controller";
import { requireAuth } from "../middlewares/auth_middleware";

const router = Router();

router.use(requireAuth);

router.get(
  "/roundtable/:roundtableId",
  ParticipantController.getRoundtableParticipants,
);
router.get(
  "/roundtable/:roundtableId/user/:userId",
  ParticipantController.getParticipantDetails,
);

export default router;
