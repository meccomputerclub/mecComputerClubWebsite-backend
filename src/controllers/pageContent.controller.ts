import { Request, Response, NextFunction } from "express";
import { PageContent } from "../models/PageContent.model";

const DEFAULT_PAGE_CONTENTS: Record<string, any> = {
  home: {
    hero: {
      title: "Debug your limits. Build reality.",
      highlightText: "Welcome to the Club.",
      description:
        "MEC Computer Club is where students compete in ICPC, build production software, and grow as developers — not just attend meetings.",
      ctaText: "Become a Member",
      ctaLink: "/join",
    },
    stats: {
      members: "70+",
      segments: "5+",
      events: "12+",
    },
    techTreeEvents: {
      cp: "8+ EVENTS",
      webdev: "5+ EVENTS",
      ml: "3+ EVENTS",
      cybersec: "3+ EVENTS",
      gaming: "3+ EVENTS",
    },
    contact: {
      email: "meccomputerclub@gmail.com",
      presidentPhone: "01773-758374",
      generalSecretaryPhone: "01568985672",
      location:
        "Department of CSE, Mymensingh Engineering College, Khagdahar, Mymensingh-2200",
    },
    announcement: {
      enabled: false,
      badge: "Notice",
      text: "Intra-MEC Programming Contest 2026 pre-registration is now open!",
      link: "/events",
    },
  },
  "cp-hub": {
    header: {
      kicker: "Competitive Programming",
      title: "CP Hub",
      description:
        "Leaderboard, curated roadmaps, problem sets, and resources — everything the CP team needs in one place.",
    },
    achievements: [
      {
        id: "ach-1",
        title: "ICPC Asia Dhaka Regional Contest",
        highlight: "Top 25 Finish",
        desc: "MEC Computer Club represented the institution with distinction among national universities.",
        year: "2025",
      },
      {
        id: "ach-2",
        title: "Intra-MEC Programming Contest",
        highlight: "100+ Participants",
        desc: "Annual algorithmic contest hosted on campus with dedicated lab setups and real-time scoreboards.",
        year: "2025",
      },
      {
        id: "ach-3",
        title: "National Collegiate Girls' Contest",
        highlight: "Regional Qualification",
        desc: "Female members of MEC Computer Club qualified for national finals with flying colors.",
        year: "2025",
      },
    ],
    clubDocs: [
      {
        id: "r1",
        title: "Binary Search — Complete Guide",
        type: "tutorial",
        difficulty: "beginner",
        url: "#",
        tags: ["binary-search", "fundamentals"],
        author: "Rafi Islam",
        date: "2025-09-05",
      },
      {
        id: "r2",
        title: "Dynamic Programming: From Zero to Hero",
        type: "tutorial",
        difficulty: "intermediate",
        url: "#",
        tags: ["dynamic-programming", "algorithms"],
        author: "Nusrat Jahan",
        date: "2025-08-20",
      },
      {
        id: "r3",
        title: "Intra-MEC Contest 2025 — Editorial",
        type: "editorial",
        difficulty: "intermediate",
        url: "#",
        tags: ["contest", "editorial"],
        author: "Nusrat Jahan",
        date: "2025-09-01",
      },
      {
        id: "r4",
        title: "Graph Theory Problem Set (30 problems)",
        type: "problem-set",
        difficulty: "intermediate",
        url: "#",
        tags: ["graphs", "bfs", "dfs", "shortest-path"],
        author: "Tanvir Hasan",
      },
      {
        id: "r5",
        title: "Segment Trees Crash Course",
        type: "tutorial",
        difficulty: "advanced",
        url: "#",
        tags: ["data-structures", "segment-tree"],
        author: "Nusrat Jahan",
        date: "2025-07-15",
      },
    ],
  },
  contact: {
    info: {
      email: "meccomputerclub@gmail.com",
      presidentPhone: "01773-758374",
      generalSecretaryPhone: "01568985672",
      location:
        "Department of CSE, Mymensingh Engineering College, Khagdahar, Mymensingh-2200",
    },
  },
};

/**
 * @desc  Get content for a page (Public)
 * @route GET /api/page-content/:page
 */
export const getPageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageKey = (req.params.page || "").toLowerCase().trim();
    if (!pageKey) {
      return res.status(400).json({ success: false, message: "Page key is required" });
    }

    let doc: any = await PageContent.findOne({ page: pageKey }).lean();

    // If none exists, seed default if available
    if (!doc) {
      const defaultSections = DEFAULT_PAGE_CONTENTS[pageKey] || {};
      const newDoc = await PageContent.create({
        page: pageKey,
        sections: defaultSections,
      });
      doc = newDoc.toObject();
    }

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update content for a page (Admin / Moderator)
 * @route PUT /api/page-content/:page
 */
export const updatePageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageKey = (req.params.page || "").toLowerCase().trim();
    if (!pageKey) {
      return res.status(400).json({ success: false, message: "Page key is required" });
    }

    const { sections } = req.body;
    if (!sections || typeof sections !== "object") {
      return res.status(400).json({ success: false, message: "Sections object is required" });
    }

    const userId = (req as any).user?.id || (req as any).user?._id;

    const updated = await PageContent.findOneAndUpdate(
      { page: pageKey },
      {
        $set: {
          sections,
          updatedBy: userId,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Content for ${pageKey} updated successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
