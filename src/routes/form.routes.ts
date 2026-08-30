import { Router } from "express";
import {
  createForm,
  getFormsByEvent,
  getFormById,
  disableForm,
  getAllForms,
  deleteForm,
  updateForm,
} from "../controllers/form.controller";

import { submitForm, getSubmissionsByForm, exportSubmissions } from "../controllers/formSubmission.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

import "../docs/form.docs"; // 🔥 IMPORTANT: load swagger docs

const router = Router();

// Create form (Admin)
router.post("/", authMiddleware(["admin", "moderator"]), createForm);

// Get all forms (Admin)
router.get("/", getAllForms);

// Get all forms by event
router.get("/event/:eventId", getFormsByEvent);

// Export submissions directly (Admin)
router.get("/export/:formId", authMiddleware(["admin", "moderator"]), exportSubmissions);

// Get single form
router.get("/:id", getFormById);

// Disable form (Admin)
router.patch("/disable/:id", authMiddleware(["admin", "moderator"]), disableForm);

// Delete form (Admin)
router.delete("/:id", authMiddleware(["admin", "moderator"]), deleteForm);

// Submit form
router.post("/submit/:formId", submitForm);

// Get submissions of a form (Admin)
router.get("/submissions/:formId", getSubmissionsByForm);

// Update form (Admin)
router.put("/:id", authMiddleware(["admin", "moderator"]), updateForm);

export default router;
