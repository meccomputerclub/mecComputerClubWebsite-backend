import { Router } from "express";
import {
  createForm,
  getFormsByEvent,
  getFormById,
  disableForm,
  getAllForms,
} from "../controllers/form.controller";

import { submitForm, getSubmissionsByForm } from "../controllers/formSubmission.controller";

import "../docs/form.docs"; // 🔥 IMPORTANT: load swagger docs

const router = Router();

/**
 * ============================
 * Form management routes
 * ============================
 */

// Create form (Admin)
router.post("/", createForm);

// Get all forms (Admin)
router.get("/", getAllForms);

// Get all forms by event (filter + sort + paginate)
router.get("/event/:eventId", getFormsByEvent);

// Get single form
router.get("/:id", getFormById);

// Disable form (Admin)
router.patch("/disable/:id", disableForm);

/**
 * ============================
 * Form submission routes
 * ============================
 */

// Submit form
router.post("/submit/:formId", submitForm);

// Get submissions of a form (Admin)
router.get("/submissions/:formId", getSubmissionsByForm);

export default router;
