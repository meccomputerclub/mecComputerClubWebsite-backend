import { Request, Response, NextFunction } from "express";
import EmailRoutingModel from "../models/EmailRouting.model";
import UserModel from "../models/User.model";

/**
 * Helper to fetch or initialize the singleton EmailRouting configuration.
 */
export const getOrCreateEmailRoutingDoc = async () => {
  let doc = await EmailRoutingModel.findOne();
  if (!doc) {
    // Default fallback: initialize with emails of system admins
    const admins = await UserModel.find({ role: "admin" }).select("email").lean();
    const adminEmails = admins.map((a) => a.email).filter(Boolean);

    doc = await EmailRoutingModel.create({
      registrationApproval: {
        enabled: true,
        recipients:
          adminEmails.length > 0
            ? adminEmails.map((email) => ({ email, label: "Admin" }))
            : [{ email: "meccomputerclub@gmail.com", label: "MEC CC" }],
      },
      contactMessages: {
        enabled: true,
        recipients:
          adminEmails.length > 0
            ? adminEmails.map((email) => ({ email, label: "Admin" }))
            : [{ email: "meccomputerclub@gmail.com", label: "MEC CC" }],
      },
    });
  }
  return doc;
};

/**
 * Helper function for internal services: Get recipient email addresses for member registration approvals.
 * Returns empty array if disabled.
 */
export const getRegistrationApprovalEmailRecipients = async (): Promise<string[]> => {
  try {
    const config = await getOrCreateEmailRoutingDoc();
    if (!config.registrationApproval?.enabled) {
      return [];
    }
    const recipients = (config.registrationApproval.recipients || [])
      .map((r: any) => (typeof r === "string" ? r : r.email)?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e && e.length > 0));

    if (recipients.length > 0) return recipients;

    // Fallback: active admins
    const admins = await UserModel.find({ role: "admin" }).select("email").lean();
    return admins.map((a) => a.email).filter(Boolean);
  } catch (err) {
    console.error("Error retrieving registration approval email recipients:", err);
    return [];
  }
};

/**
 * Helper function for internal services: Get recipient email addresses for contact form messages.
 * Returns empty array if disabled.
 */
export const getContactMessageEmailRecipients = async (): Promise<string[]> => {
  try {
    const config = await getOrCreateEmailRoutingDoc();
    if (!config.contactMessages?.enabled) {
      return [];
    }
    const recipients = (config.contactMessages.recipients || [])
      .map((r: any) => (typeof r === "string" ? r : r.email)?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e && e.length > 0));

    if (recipients.length > 0) return recipients;

    // Fallback: active admins
    const admins = await UserModel.find({ role: "admin" }).select("email").lean();
    return admins.map((a) => a.email).filter(Boolean);
  } catch (err) {
    console.error("Error retrieving contact message email recipients:", err);
    return [];
  }
};

/**
 * Helper to sanitize and deduplicate recipients with optional labels.
 */
const normalizeRecipients = (raw: any[]): { email: string; label?: string }[] => {
  const map = new Map<string, string>();
  for (const item of raw) {
    if (!item) continue;
    let email = "";
    let label = "";
    if (typeof item === "string") {
      email = item.trim().toLowerCase();
    } else if (typeof item === "object") {
      email = String(item.email || "").trim().toLowerCase();
      label = item.label ? String(item.label).trim() : "";
    }
    if (email && email.includes("@")) {
      const existingLabel = map.get(email);
      map.set(email, label || existingLabel || "");
    }
  }
  return Array.from(map.entries()).map(([email, label]) => ({ email, label }));
};

/**
 * GET /api/email-routing
 * Returns routing settings and eligible staff users (admin, moderator, executive).
 */
export const getEmailRouting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routing = await getOrCreateEmailRoutingDoc();

    // Fetch eligible staff members to allow 1-click recipient selection
    const staff = await UserModel.find({
      role: { $in: ["admin", "moderator", "executive"] },
    })
      .select("_id fullName email role clubRole imageUrl studentId department")
      .sort({ role: 1, fullName: 1 })
      .lean();

    // Ensure recipient objects have uniform structure { email, label }
    const normalizedData = {
      _id: routing._id,
      registrationApproval: {
        enabled: routing.registrationApproval.enabled,
        recipients: normalizeRecipients(routing.registrationApproval.recipients),
      },
      contactMessages: {
        enabled: routing.contactMessages.enabled,
        recipients: normalizeRecipients(routing.contactMessages.recipients),
      },
      updatedBy: routing.updatedBy,
    };

    return res.status(200).json({
      success: true,
      data: normalizedData,
      eligibleStaff: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/email-routing
 * Update routing settings.
 */
export const updateEmailRouting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { registrationApproval, contactMessages } = req.body;

    const routing = await getOrCreateEmailRoutingDoc();

    if (registrationApproval) {
      if (typeof registrationApproval.enabled === "boolean") {
        routing.registrationApproval.enabled = registrationApproval.enabled;
      }
      if (Array.isArray(registrationApproval.recipients)) {
        routing.registrationApproval.recipients = normalizeRecipients(
          registrationApproval.recipients
        );
      }
    }

    if (contactMessages) {
      if (typeof contactMessages.enabled === "boolean") {
        routing.contactMessages.enabled = contactMessages.enabled;
      }
      if (Array.isArray(contactMessages.recipients)) {
        routing.contactMessages.recipients = normalizeRecipients(
          contactMessages.recipients
        );
      }
    }

    if (user?.id) {
      routing.updatedBy = user.id;
    }

    await routing.save();

    return res.status(200).json({
      success: true,
      message: "Email routing settings saved successfully.",
      data: routing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get list of eligible staff users (admin, moderator, executive) for email routing assignment
 * @route GET /api/email-routing/staff-users
 */
export const getStaffUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await UserModel.find({
      $or: [
        { role: { $in: ["admin", "moderator", "executive"] } },
        { clubRole: "executive" },
      ],
      isVerified: true,
    })
      .select("fullName email role clubRole imageUrl designation studentId")
      .sort({ role: 1, fullName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

