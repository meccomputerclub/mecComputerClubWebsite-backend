const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mec_computer_club";

const initialProjects = [
  {
    title: "MEC Judge",
    slug: "mec-judge",
    description:
      "An online judge platform built for hosting intra-university programming contests with real-time leaderboards and automated grading.",
    department: "webdev",
    status: "completed",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-06-20"),
    githubLink: "https://github.com/mec-cs-club/mec-judge",
    liveDemoLink: "https://judge.meccc.org",
    requiredSkills: ["Next.js", "Node.js", "PostgreSQL", "Docker", "Redis"],
    techStack: ["Next.js", "Node.js", "PostgreSQL", "Docker", "Redis"],
    imageUrl: "/images/projects/mec-judge.jpg",
    featured: true,
  },
  {
    title: "CP Progress Tracker",
    slug: "cp-tracker",
    description:
      "A dashboard that aggregates Codeforces, AtCoder, and LeetCode stats for club members into a unified leaderboard.",
    department: "cp",
    status: "in_progress",
    startDate: new Date("2024-03-10"),
    githubLink: "https://github.com/mec-cs-club/cp-tracker",
    liveDemoLink: "",
    requiredSkills: ["React", "Python", "FastAPI", "Codeforces API"],
    techStack: ["React", "Python", "FastAPI", "Codeforces API"],
    imageUrl: "/images/projects/cp-tracker.jpg",
    featured: true,
  },
  {
    title: "Campus Info Chatbot",
    slug: "campus-chatbot",
    description:
      "An AI-powered chatbot trained on MEC academic data — class schedules, faculty info, and campus services.",
    department: "ml",
    status: "completed",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-04-15"),
    githubLink: "",
    liveDemoLink: "",
    requiredSkills: ["Python", "LangChain", "OpenAI API", "FastAPI", "React"],
    techStack: ["Python", "LangChain", "OpenAI API", "FastAPI", "React"],
    imageUrl: "/images/projects/chatbot.jpg",
    featured: true,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to Mongo");

  const Project = mongoose.model(
    "Project",
    new mongoose.Schema({}, { strict: false, timestamps: true })
  );

  // Link to an existing admin user if available
  const User = mongoose.model(
    "User",
    new mongoose.Schema({}, { strict: false })
  );
  const adminUser = await User.findOne({ role: "admin" });
  const adminId = adminUser ? adminUser._id : null;

  for (const item of initialProjects) {
    const existing = await Project.findOne({ title: item.title });
    if (!existing) {
      await Project.create({
        ...item,
        createdBy: adminId || undefined,
        teamMembers: adminId ? [adminId] : [],
      });
      console.log(`Created: ${item.title}`);
    } else {
      await Project.updateOne(
        { _id: existing._id },
        { $set: { featured: item.featured, imageUrl: item.imageUrl, techStack: item.techStack } }
      );
      console.log(`Updated featured: ${item.title}`);
    }
  }

  console.log("Seeding finished successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
