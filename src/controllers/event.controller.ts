import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as EventService from "../services/event.service";
import { Event } from "../models/Event.model";
import User from "../models/User.model";
import { Certificate } from "../models/Certificate.model";
import { Media } from "../models/Media.model";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service";
import crypto from "crypto";

// ── Basic CRUD ─────────────────────────────────────────────────────────────

export const handleCreateEvent = async (req: Request, res: Response) => {
  try {
    const event = await EventService.createEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleGetEvents = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    const events = await EventService.getAllEvents(filter);
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleGetEventById = async (req: Request, res: Response) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
      : { slug: req.params.id };

    const event = await Event.findOne(query)
      .populate("attendees", "fullName email imageUrl studentId department batch")
      .populate({
        path: "pendingParticipants.userId",
        select: "fullName email imageUrl studentId department",
        options: { strictPopulate: false },
      })
      .populate({
        path: "winners.members",
        select: "fullName email imageUrl studentId",
        options: { strictPopulate: false },
      })
      .populate("media")
      .populate("certificates")
      .populate({
        path: "eventSponsors.sponsorId",
        select: "name logoUrl website",
        options: { strictPopulate: false },
      });

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Normalise — ensure arrays exist even on old documents
    const data = event.toObject({ virtuals: true });
    data.pendingParticipants = data.pendingParticipants || [];
    data.winners = data.winners || [];
    data.eventSponsors = data.eventSponsors || [];
    data.media = data.media || [];
    data.certificates = data.certificates || [];
    data.attendees = data.attendees || [];
    data.tags = data.tags || [];

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("handleGetEventById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleUpdateEvent = async (req: Request, res: Response) => {
  try {
    const updatedEvent = await EventService.updateEvent(req.params.id, req.body);
    if (!updatedEvent) return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: updatedEvent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleDeleteEvent = async (req: Request, res: Response) => {
  try {
    const deletedEvent = await EventService.deleteEvent(req.params.id);
    if (!deletedEvent) return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Participant Management ─────────────────────────────────────────────────

/**
 * @desc  Add a user to pending participants (self-register or admin-add)
 * @route POST /api/events/:id/participants/register
 */
export const registerParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, formData } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Check not already attendee or pending
    const alreadyAttendee = event.attendees.some((id) => id.toString() === userId);
    const alreadyPending = event.pendingParticipants.some((p) => p.userId.toString() === userId);
    if (alreadyAttendee || alreadyPending) {
      return res.status(400).json({ success: false, message: "User already registered or pending" });
    }

    event.pendingParticipants.push({ userId, registeredAt: new Date(), formData });
    await event.save();

    res.status(200).json({ success: true, message: "Registration submitted, pending approval." });
  } catch (error) { next(error); }
};

/**
 * @desc  Approve a pending participant → moves to attendees, updates user profile
 * @route PATCH /api/events/:id/participants/:userId/approve
 */
export const approveParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const pendingIdx = event.pendingParticipants.findIndex((p) => p.userId.toString() === userId);
    if (pendingIdx === -1) return res.status(404).json({ success: false, message: "Pending participant not found" });

    // Move from pending to attendees
    event.pendingParticipants.splice(pendingIdx, 1);
    if (!event.attendees.some((id) => id.toString() === userId)) {
      event.attendees.push(userId as any);
    }
    await event.save();

    // Update user's eventsAttended
    await User.findByIdAndUpdate(userId, {
      $addToSet: { eventsAttended: eventId },
    });

    res.status(200).json({ success: true, message: "Participant approved." });
  } catch (error) { next(error); }
};

/**
 * @desc  Reject a pending participant
 * @route PATCH /api/events/:id/participants/:userId/reject
 */
export const rejectParticipant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    event.pendingParticipants = event.pendingParticipants.filter(
      (p) => p.userId.toString() !== userId
    ) as any;
    await event.save();

    res.status(200).json({ success: true, message: "Participant rejected." });
  } catch (error) { next(error); }
};

/**
 * @desc  Directly add an approved attendee (for past events / manual entry)
 * @route POST /api/events/:id/participants/add
 */
export const addAttendee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds } = req.body; // array of user IDs
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "userIds array is required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    for (const userId of userIds) {
      if (!event.attendees.some((id) => id.toString() === userId)) {
        event.attendees.push(userId);
      }
      // Update user profile
      await User.findByIdAndUpdate(userId, { $addToSet: { eventsAttended: req.params.id } });
    }
    await event.save();

    res.status(200).json({ success: true, message: `${userIds.length} attendee(s) added.` });
  } catch (error) { next(error); }
};

/**
 * @desc  Remove an attendee
 * @route DELETE /api/events/:id/participants/:userId
 */
export const removeAttendee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: eventId, userId } = req.params;

    await Event.findByIdAndUpdate(eventId, { $pull: { attendees: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { eventsAttended: eventId } });

    res.status(200).json({ success: true, message: "Attendee removed." });
  } catch (error) { next(error); }
};

// ── Winners ────────────────────────────────────────────────────────────────

/**
 * @desc  Set/update winners for an event
 * @route PUT /api/events/:id/winners
 */
export const setWinners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { winners } = req.body; // [{ teamName?, members: [userId], position, prize? }]
    if (!Array.isArray(winners)) {
      return res.status(400).json({ success: false, message: "winners array is required" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { winners } },
      { new: true }
    ).populate("winners.members", "fullName email imageUrl");

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    res.status(200).json({ success: true, data: event.winners });
  } catch (error) { next(error); }
};

// ── Sponsors ───────────────────────────────────────────────────────────────

/**
 * @desc  Add a sponsor to an event
 * @route POST /api/events/:id/sponsors
 */
export const addEventSponsor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sponsorId, sponsorName, logoUrl, tier } = req.body;
    if (!sponsorId || !sponsorName) {
      return res.status(400).json({ success: false, message: "sponsorId and sponsorName are required" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push: { eventSponsors: { sponsorId, sponsorName, logoUrl, tier } } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    res.status(200).json({ success: true, data: event.eventSponsors });
  } catch (error) { next(error); }
};

/**
 * @desc  Remove a sponsor from an event
 * @route DELETE /api/events/:id/sponsors/:sponsorId
 */
export const removeEventSponsor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $pull: { eventSponsors: { sponsorId: req.params.sponsorId } } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event.eventSponsors });
  } catch (error) { next(error); }
};

// ── Media ──────────────────────────────────────────────────────────────────

/**
 * @desc  Upload media (image/video) for an event
 * @route POST /api/events/:id/media
 */
export const uploadEventMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, mediaType, url, fileSize, publicId } = req.body;
    const uploaderId = (req as any).user?.id;

    let mediaUrl = url;
    let cloudinaryPublicId: string = publicId || "";

    // If a file was sent directly (multipart), upload it
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      mediaUrl = result.url;
      cloudinaryPublicId = result.public_id;
    }

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: "Media URL or file is required" });
    }

    const media = await Media.create({
      title: title || "Event Media",
      url: mediaUrl,
      mediaType: mediaType || (req.file?.mimetype?.startsWith("video") ? "video" : "image"),
      fileSize: fileSize || req.file?.size || 0,
      uploader: uploaderId,
      relatedEvent: req.params.id,
      tags: [],
      imagePublicId: cloudinaryPublicId || null,
    });

    await Event.findByIdAndUpdate(req.params.id, { $push: { media: media._id } });

    res.status(201).json({ success: true, data: media });
  } catch (error) { next(error); }
};

export const removeEventMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Unlink from event
    await Event.findByIdAndUpdate(req.params.id, { $pull: { media: req.params.mediaId } });

    // 2. Find the media document to get the Cloudinary public_id
    const mediaDoc = await Media.findById(req.params.mediaId).lean() as any;

    // 3. Delete from Cloudinary if it was uploaded there (has a public_id)
    if (mediaDoc?.imagePublicId) {
      try {
        await deleteFromCloudinary(mediaDoc.imagePublicId);
      } catch (cloudErr) {
        console.error("Cloudinary deletion failed for media:", mediaDoc.imagePublicId, cloudErr);
      }
    }

    // 4. Delete the Media document
    await Media.findByIdAndDelete(req.params.mediaId);

    res.status(200).json({ success: true, message: "Media removed." });
  } catch (error) { next(error); }
};

// ── Certificates ───────────────────────────────────────────────────────────

/**
 * @desc  Issue certificates to event participants (bulk or individual)
 * @route POST /api/events/:id/certificates
 * Body: { recipients: [{ userId, type, position?, digitalUrl }], name, description, issueDate }
 */
export const issueCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipients, name, description, issueDate, digitalUrl } = req.body;
    const adminId = (req as any).user?.id;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: "recipients array is required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const created: any[] = [];

    for (const r of recipients) {
      // Generate unique certificate ID
      const certId = `MCC-${new Date(issueDate || Date.now()).getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      const cert = await Certificate.create({
        name: name || `${event.title} Certificate`,
        description: description || `Awarded for participation in ${event.title}`,
        recipient: r.userId,
        associatedEvent: req.params.id,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        certificateId: certId,
        digitalUrl: r.digitalUrl || digitalUrl || "",
        type: r.type || "participation",
        position: r.position,
        issuedBy: adminId,
      });

      // Link certificate to event
      await Event.findByIdAndUpdate(req.params.id, { $addToSet: { certificates: cert._id } });

      // Link certificate to user profile
      await User.findByIdAndUpdate(r.userId, { $addToSet: { certificates: cert._id } });

      created.push(cert);
    }

    res.status(201).json({
      success: true,
      message: `${created.length} certificate(s) issued.`,
      data: created,
    });
  } catch (error) { next(error); }
};

/**
 * @desc  Get all certificates for an event
 * @route GET /api/events/:id/certificates
 */
export const getEventCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await Certificate.find({ associatedEvent: req.params.id })
      .populate("recipient", "fullName email imageUrl studentId")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: certs });
  } catch (error) { next(error); }
};
