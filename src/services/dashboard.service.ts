// src/services/dashboard.service.ts
import User from "../models/User.model"; // Assuming this model exists
import { Event } from "../models/Event.model"; // Assuming this model exists
import { Certificate } from "../models/Certificate.model"; // Assuming this model exists
import { Sponsor } from "../models/Sponsor.model"; // Assuming this model exists
import { Project } from "../models/Project.model"; // Assuming this model exists
import { Asset } from "../models/Asset.model"; // Assuming this model exists
import { DashboardStats } from "../types/dashboard.types";
import { generateEmail } from "../utils/generateEmailTemplate";
import { sendEmail } from "../utils/sendEmail";
// Note: You would import the actual models and types here

// --- MEMBER DASHBOARD SERVICE ---
export const getMemberDashboardData = async (userId: string) => {
  try {
    const member = await User.findById(userId)
      .select("profileStatus eventsAttended certificates projectsContributed")
      .populate({
        path: "eventsAttended",
        select: "name date location",
      })
      .populate({
        path: "certificates",
        select: "name issueDate",
      })
      .populate({
        path: "projectsContributed",
        select: "name status",
      })
      .lean(); // .lean() for faster query results

    if (!member) {
      throw new Error("Member not found.");
    }

    return {
      eventsAttended: member?.eventsAttended?.length || 0,
      certificatesEarned: member?.certificates?.length || 0,
      projectsContributed: member?.projectsContributed?.length || 0,
      profileStatus: member.profileStatus,
    };
  } catch (error) {
    console.error("Error fetching member dashboard data:", error);
    throw new Error("Could not retrieve member dashboard data.");
  }
};

export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Parallel queries for speed - Keep the Promise.all structure
    const [
      totalMembers,
      totalActiveMembers,
      totalAlumni,
      pendingApplications,
      totalEvents,
      upcomingEvents,
      totalCertificates,
      totalProjects,
      totalSponsors,
      activeSponsors,
      totalAssets,
    ] = await Promise.all([
      // 1. Membership Queries
      User.countDocuments(),
      User.countDocuments({ role: { $nin: ["alumni", "guest"] }, profileStatus: "active" }),
      User.countDocuments({ role: "alumni" }),
      User.countDocuments({ applicationStatus: "pending" }),

      // 2. Activity & Content Queries
      Event.countDocuments(),
      Event.countDocuments({ date: { $gte: new Date() } }),
      Certificate.countDocuments(),
      Project.countDocuments(),

      // 3. Financial & Asset Queries
      Sponsor.countDocuments(),
      Sponsor.countDocuments({ isActive: true }), // Assuming an isActive field
      Asset.countDocuments(),
    ]);

    return {
      membership: {
        totalMembers: totalMembers,
        totalActiveMembers: totalActiveMembers,
        totalAlumni: totalAlumni,
        pendingApplications: pendingApplications,
      },
      activities: {
        totalEvents: totalEvents,
        upcomingEvents: upcomingEvents,
        totalCertificates: totalCertificates,
        totalProjects: totalProjects,
      },
      resources: {
        totalSponsors: totalSponsors,
        activeSponsors: activeSponsors,
        totalAssets: totalAssets,
      },
    } as DashboardStats; // Explicitly cast the return value
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    // You can throw a more descriptive error or use a standardized error class
    throw new Error("Could not retrieve admin dashboard stats.");
  }
};

export const getMembersDataService = async () => {
  try {
    //fetch all members with _id, name, email, role, profileStatus, eventsAttended, certificates, projectsContributed
    const members = await User.find({})
      .select(
        "_id fullName imageUrl email role applicationStatus profileStatus eventsAttended certificates projectsContributed"
      )
      .lean();

    // Map to a new array and attach activityCounts (use any for the plain objects from .lean())
    const membersWithCounts = (members as any[]).map((member) => {
      const { eventsAttended, certificates, projectsContributed, ...rest } = member;
      const activityCounts =
        (eventsAttended?.length || 0) +
        (certificates?.length || 0) +
        (projectsContributed?.length || 0);

      return {
        ...rest,
        activityCounts,
      };
    });
    // const members = await User.find({ role: { $nin: ["alumni", "guest"] } }); // Exclude alumni and guests
    return membersWithCounts;
    // const members = await User.find({ role: { $nin: ["alumni", "guest"] } }); // Exclude alumni and guests
    // return members;
  } catch (error) {
    console.error("Error fetching members data:", error);
    throw new Error("Could not retrieve members data.");
  }
};

export const approveOrRejectUser = async (
  adminId: string,
  userId: string,
  approved: boolean,
  reason?: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (approved) {
    user.applicationStatus = "approved";
    user.approvedBy = adminId as any;
    user.approvedAt = new Date();
    user.rejectionReason = undefined;
    // if approved and graduated, you may set role=member or alumni
    if (user.isGraduated) user.role = "alumni";
    else if (user.role === "guest") user.role = "member";
    await user.save();

    // notify user
    const emailTemplate = generateEmail("status", { userName: user.fullName, status: "Approved" });
    await sendEmail(user.email, "Your MEC Club membership was approved", emailTemplate);

    return user;
  } else {
    user.applicationStatus = "rejected";
    user.rejectionReason = reason || "Rejected by admin";
    user.approvedBy = adminId as any;
    user.approvedAt = new Date();
    await user.save();

    const emailTemplate = generateEmail("status", { userName: user.fullName, status: "Rejected" });
    await sendEmail(user.email, "Your MEC Club application was rejected", emailTemplate);
    return user;
  }
};
