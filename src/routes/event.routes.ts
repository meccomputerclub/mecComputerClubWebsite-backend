import { Router } from "express";
import {
  handleCreateEvent, handleGetEvents, handleGetEventById,
  handleUpdateEvent, handleDeleteEvent,
  // Participants
  registerParticipant, approveParticipant, rejectParticipant,
  addAttendee, removeAttendee,
  // Winners
  setWinners,
  // Sponsors
  addEventSponsor, removeEventSponsor,
  // Media
  uploadEventMedia, removeEventMedia,
  // Certificates
  issueCertificates, getEventCertificates,
} from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createUploader } from "../config/multer.config";

const router = Router();
const upload = createUploader("event_media");

// ── Basic CRUD ──────────────────────────────────────────────────────────────
router.post("/", authMiddleware(["admin", "moderator"]), handleCreateEvent);
router.get("/", handleGetEvents);
router.get("/:id", handleGetEventById);
router.patch("/:id", authMiddleware(["admin", "moderator"]), handleUpdateEvent);
router.delete("/:id", authMiddleware(["admin", "moderator"]), handleDeleteEvent);

// ── Participants ────────────────────────────────────────────────────────────
router.post("/:id/participants/register", authMiddleware(), registerParticipant);
router.post("/:id/participants/add", authMiddleware(["admin", "moderator"]), addAttendee);
router.patch("/:id/participants/:userId/approve", authMiddleware(["admin", "moderator"]), approveParticipant);
router.patch("/:id/participants/:userId/reject", authMiddleware(["admin", "moderator"]), rejectParticipant);
router.delete("/:id/participants/:userId", authMiddleware(["admin", "moderator"]), removeAttendee);

// ── Winners ─────────────────────────────────────────────────────────────────
router.put("/:id/winners", authMiddleware(["admin", "moderator"]), setWinners);

// ── Sponsors ────────────────────────────────────────────────────────────────
router.post("/:id/sponsors", authMiddleware(["admin", "moderator"]), addEventSponsor);
router.delete("/:id/sponsors/:sponsorId", authMiddleware(["admin", "moderator"]), removeEventSponsor);

// ── Media ───────────────────────────────────────────────────────────────────
router.post("/:id/media", authMiddleware(["admin", "moderator"]), upload.single("file"), uploadEventMedia);
router.delete("/:id/media/:mediaId", authMiddleware(["admin", "moderator"]), removeEventMedia);

// ── Certificates ────────────────────────────────────────────────────────────
router.post("/:id/certificates", authMiddleware(["admin", "moderator"]), issueCertificates);
router.get("/:id/certificates", authMiddleware(["admin", "moderator"]), getEventCertificates);

export default router;
