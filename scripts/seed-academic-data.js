const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mec_computer_club";

const initialCourses = [
  {
    courseName: "Database Management Systems - I Lab",
    courseCode: "CSE-2211",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Design and Analysis of Algorithms-I Lab",
    courseCode: "CSE-2212",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Microprocessor and Assembly Language Lab.",
    courseCode: "CSE-3113",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Data Structure and Algorithms Lab.",
    courseCode: "CSE-2102",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Object Oriented Programming Lab.",
    courseCode: "CSE-2104",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Database Management Systems Lab.",
    courseCode: "CSE-3102",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Computer Networks Lab.",
    courseCode: "CSE-3202",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Operating Systems Lab.",
    courseCode: "CSE-3206",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  {
    courseName: "Software Engineering & Information System Design Lab.",
    courseCode: "CSE-4102",
    courseCredit: "1.5",
    department: "CSE",
    status: "approved",
  },
  // Some EEE & CE courses for initial variety
  {
    courseName: "Electrical Circuits-I Lab",
    courseCode: "EEE-1102",
    courseCredit: "1.5",
    department: "EEE",
    status: "approved",
  },
  {
    courseName: "Digital Electronics Lab",
    courseCode: "EEE-2204",
    courseCredit: "1.5",
    department: "EEE",
    status: "approved",
  },
  {
    courseName: "Engineering Mechanics Lab",
    courseCode: "CE-1102",
    courseCredit: "1.5",
    department: "CE",
    status: "approved",
  },
  {
    courseName: "Surveying Practical",
    courseCode: "CE-2102",
    courseCredit: "1.5",
    department: "CE",
    status: "approved",
  },
];

const initialInstructors = [
  {
    name: "Fokrul Islam",
    designation: "Lecturer",
    department: "CSE",
    institution: "Mymensingh Engineering College",
    status: "approved",
  },
  {
    name: "Md. Shafiul Alam",
    designation: "Associate Professor & Head",
    department: "CSE",
    institution: "Mymensingh Engineering College",
    status: "approved",
  },
  {
    name: "Al Amin",
    designation: "Assistant Professor",
    department: "CSE",
    institution: "Mymensingh Engineering College",
    status: "approved",
  },
  {
    name: "Dr. SM Anowarul Haque",
    designation: "Associate Professor & Head",
    department: "EEE",
    institution: "Mymensingh Engineering College",
    status: "approved",
  },
  {
    name: "Engr. Md. Rabiul Islam",
    designation: "Assistant Professor & Head",
    department: "CE",
    institution: "Mymensingh Engineering College",
    status: "approved",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const Course = mongoose.model(
      "Course",
      new mongoose.Schema(
        {
          courseName: String,
          courseCode: String,
          courseCredit: String,
          department: String,
          status: String,
        },
        { timestamps: true }
      )
    );

    const Instructor = mongoose.model(
      "Instructor",
      new mongoose.Schema(
        {
          name: String,
          designation: String,
          department: String,
          institution: String,
          status: String,
        },
        { timestamps: true }
      )
    );

    for (const c of initialCourses) {
      await Course.updateOne(
        { courseCode: c.courseCode, department: c.department },
        { $setOnInsert: c },
        { upsert: true }
      );
    }
    console.log("Courses seeded successfully.");

    for (const ins of initialInstructors) {
      await Instructor.updateOne(
        { name: ins.name, department: ins.department },
        { $setOnInsert: ins },
        { upsert: true }
      );
    }
    console.log("Instructors seeded successfully.");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
