import Designation, { IDesignation } from "../models/Designation.model";
import User from "../models/User.model";

const DEFAULT_EXECUTIVE_ROLES = [
  { title: "President", wing: "Core Board", order: 1, defaultRole: "admin", maxSeats: 1 },
  { title: "Vice President", wing: "Core Board", order: 2, defaultRole: "admin", maxSeats: 2 },
  { title: "General Secretary", wing: "Core Board", order: 3, defaultRole: "admin", maxSeats: 1 },
  { title: "Joint Secretary", wing: "Core Board", order: 4, defaultRole: "moderator", maxSeats: 2 },
  { title: "Organizing Secretary", wing: "Core Board", order: 5, defaultRole: "moderator", maxSeats: 2 },
  { title: "Creative & Media Executive", wing: "Media & PR Wing", order: 6, defaultRole: "moderator" },
  { title: "Event Co-Ordinator", wing: "Event & Logistics Wing", order: 7, defaultRole: "moderator" },
  { title: "Finance Secretary", wing: "Core Board", order: 8, defaultRole: "moderator", maxSeats: 1 },
  { title: "Resource & Logistics Manager", wing: "Event & Logistics Wing", order: 9, defaultRole: "moderator" },
  { title: "Public Relations Executive", wing: "Media & PR Wing", order: 10, defaultRole: "moderator" },
  { title: "Web Administrator", wing: "Tech Wing", order: 11, defaultRole: "admin" },
  { title: "Competitive Programming Lead", wing: "Tech Wing", order: 12, defaultRole: "moderator" },
  { title: "Web Development Lead", wing: "Tech Wing", order: 13, defaultRole: "moderator" },
  { title: "AI & ML Lead", wing: "Tech Wing", order: 14, defaultRole: "moderator" },
  { title: "Cybersecurity Lead", wing: "Tech Wing", order: 15, defaultRole: "moderator" },
  { title: "Executive Member", wing: "General Panel", order: 16, defaultRole: "member" },
];

const DEFAULT_ADVISOR_ROLES = [
  { title: "Chief Patron & Principal", wing: "College Administration", order: 1, defaultRole: "member", maxSeats: 1 },
  { title: "Chief Advisor", wing: "CSE Department", order: 2, defaultRole: "member", maxSeats: 1 },
  { title: "Technical Advisor", wing: "Faculty Advisory", order: 3, defaultRole: "member" },
  { title: "Faculty Advisor", wing: "Faculty Advisory", order: 4, defaultRole: "member" },
  { title: "Honorary Mentor", wing: "Industry Advisory", order: 5, defaultRole: "member" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const seedDefaultDesignationsIfEmpty = async () => {
  try {
    const count = await Designation.countDocuments();
    if (count === 0) {
      const execItems = DEFAULT_EXECUTIVE_ROLES.map((r) => ({
        ...r,
        slug: generateSlug(r.title),
        category: "executive",
        isActive: true,
      }));
      const advisorItems = DEFAULT_ADVISOR_ROLES.map((r) => ({
        ...r,
        slug: generateSlug(r.title),
        category: "advisor",
        isActive: true,
      }));
      await Designation.insertMany([...execItems, ...advisorItems]);
      console.log("Successfully seeded default designations (Executive & Advisor roles).");
    }
  } catch (error) {
    console.error("Error seeding default designations:", error);
  }
};

export const getDesignationsService = async (category?: string) => {
  await seedDefaultDesignationsIfEmpty();

  const filter: any = { isActive: true };
  if (category && ["executive", "advisor", "general", "alumni"].includes(category)) {
    filter.category = category;
  }

  const designations = await Designation.find(filter).sort({ order: 1, createdAt: 1 }).lean();

  // Attach currently assigned members count and list
  const titles = designations.map((d) => d.title);
  const assignedUsers = await User.find({
    applicationStatus: "approved",
    $or: [{ designation: { $in: titles } }, { customRole: { $in: titles } }],
  })
    .select("_id fullName email imageUrl studentId department session designation customRole role clubRole")
    .lean();

  const designationsWithMembers = designations.map((desig) => {
    const members = assignedUsers.filter(
      (u) =>
        (u.designation && u.designation.toLowerCase() === desig.title.toLowerCase()) ||
        (u.customRole && u.customRole.toLowerCase() === desig.title.toLowerCase())
    );
    return {
      ...desig,
      assignedCount: members.length,
      assignedMembers: members,
    };
  });

  return designationsWithMembers;
};

export const createDesignationService = async (data: {
  title: string;
  category: "executive" | "advisor" | "general" | "alumni";
  wing?: string;
  order?: number;
  maxSeats?: number;
  defaultRole?: "admin" | "moderator" | "member";
}) => {
  const slug = generateSlug(data.title);

  // If order not provided, place at end of category
  let order = data.order;
  if (!order) {
    const highestOrder = await Designation.findOne({ category: data.category }).sort({ order: -1 });
    order = highestOrder ? highestOrder.order + 1 : 1;
  }

  const newDesignation = await Designation.create({
    title: data.title.trim(),
    slug,
    category: data.category || "executive",
    wing: data.wing ? data.wing.trim() : "General",
    order,
    maxSeats: data.maxSeats || null,
    defaultRole: data.defaultRole || "member",
    isActive: true,
  });

  return newDesignation;
};

export const updateDesignationService = async (
  id: string,
  updateData: {
    title?: string;
    wing?: string;
    order?: number;
    maxSeats?: number;
    defaultRole?: "admin" | "moderator" | "member";
    isActive?: boolean;
  }
) => {
  const existing = await Designation.findById(id);
  if (!existing) {
    throw new Error("Designation not found");
  }

  const oldTitle = existing.title;
  if (updateData.title && updateData.title.trim() !== oldTitle) {
    const newTitle = updateData.title.trim();
    existing.title = newTitle;
    existing.slug = generateSlug(newTitle);

    // Also update any users holding this old title
    await User.updateMany(
      { designation: oldTitle },
      { $set: { designation: newTitle, customRole: newTitle } }
    );
  }

  if (updateData.wing !== undefined) existing.wing = updateData.wing.trim();
  if (updateData.order !== undefined) existing.order = updateData.order;
  if (updateData.maxSeats !== undefined) existing.maxSeats = updateData.maxSeats;
  if (updateData.defaultRole !== undefined) existing.defaultRole = updateData.defaultRole;
  if (updateData.isActive !== undefined) existing.isActive = updateData.isActive;

  await existing.save();
  return existing;
};

export const reorderDesignationsService = async (
  items: { id: string; order: number }[]
) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  if (bulkOps.length > 0) {
    await Designation.bulkWrite(bulkOps);
  }

  return { success: true, count: bulkOps.length };
};

export const deleteDesignationService = async (id: string) => {
  const existing = await Designation.findById(id);
  if (!existing) {
    throw new Error("Designation not found");
  }

  // Clear designation on users holding this title
  await User.updateMany(
    {
      $or: [{ designation: existing.title }, { customRole: existing.title }],
    },
    {
      $set: {
        designation: "General Member",
        customRole: "",
        clubRole: "member",
      },
    }
  );

  await Designation.findByIdAndDelete(id);
  return { success: true, deletedId: id };
};

export const assignMembersToDesignationService = async (
  designationTitle: string,
  category: "executive" | "advisor",
  memberIds: string[],
  defaultRole?: "admin" | "moderator" | "member"
) => {
  // First, find all members currently having this designation
  const currentMembers = await User.find({
    $or: [{ designation: designationTitle }, { customRole: designationTitle }],
  }).select("_id");

  const currentIds = currentMembers.map((m) => m._id.toString());
  const newIds = memberIds.map((id) => id.toString());

  // Members to remove from this role
  const toRemove = currentIds.filter((id) => !newIds.includes(id));
  if (toRemove.length > 0) {
    await User.updateMany(
      { _id: { $in: toRemove } },
      {
        $set: {
          designation: "General Member",
          customRole: "",
          clubRole: "member",
        },
      }
    );
  }

  // Members to add/set to this role
  if (newIds.length > 0) {
    const updatePayload: any = {
      designation: designationTitle,
      customRole: designationTitle,
      clubRole: category === "advisor" ? "advisor" : "executive",
    };

    if (defaultRole && defaultRole !== "member") {
      updatePayload.role = defaultRole;
    }

    await User.updateMany({ _id: { $in: newIds } }, { $set: updatePayload });
  }

  return { success: true, assignedCount: newIds.length, unassignedCount: toRemove.length };
};
