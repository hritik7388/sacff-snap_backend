// src/routes/faqRoutes.ts
import { Router } from "express";
import faqController from "../controllers/faqController";
import { 
  clientAuthMiddleware,
} from "../middlewares/authMiddleware";

const router = Router();

// Public landing page API
router.get(
  "/getActiveFAQs",clientAuthMiddleware,
  faqController.getActiveFAQs.bind(faqController),
);

// SuperAdmin CRUD APIs
router.post(
  "/",
  clientAuthMiddleware,
  faqController.createFAQ.bind(faqController),
);

 

router.get(
  "/:id",
  clientAuthMiddleware,
  faqController.getFAQById.bind(faqController),
);

router.patch(
  "/:id",
  clientAuthMiddleware,
  faqController.updateFAQ.bind(faqController),
);

router.delete(
  "/:id",
  clientAuthMiddleware,
  faqController.deleteFAQ.bind(faqController),
);

export default router;
