import { Schema, model, Document, Types } from "mongoose";

interface IHomePage extends Document {
  heroSection: {
    title: string;
    subtitle: string; // Changed to camelCase
    bgImgUrl: string;
    stats: {
      members: number;
      totalProjects: number;
      totalEvents: number;
      eventsPerYear: number;
    };
    links: {
      join: string;
      events: string;
    };
  };
  introSection: {
    title: string;
    description: string;
    label: string;
    imgUrl: string;
  };
  featuredData: {
    // References to other collections
    sponsors: Types.ObjectId[];
    events: Types.ObjectId[];
    gallery: Types.ObjectId[];
    blogs: Types.ObjectId[];
    projects: Types.ObjectId[];
  };
}

const homePageSchema = new Schema<IHomePage>(
  {
    heroSection: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      bgImgUrl: String,
      stats: {
        members: { type: Number, default: 0 },
        totalProjects: { type: Number, default: 0 },
        totalEvents: { type: Number, default: 0 },
        eventsPerYear: { type: Number, default: 0 },
      },
      links: {
        join: String,
        events: String,
      },
    },
    introSection: {
      title: String,
      description: String,
      label: String,
      imgUrl: String,
    },
    featuredData: {
      // Using refs allows for .populate('featuredData.events')
      sponsors: [{ type: Schema.Types.ObjectId, ref: "Sponsor" }],
      events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
      gallery: [{ type: Schema.Types.ObjectId, ref: "Gallery" }],
      blogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
      projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    },
  },
  { timestamps: true }
);

export const HomePage = model<IHomePage>("HomePage", homePageSchema);
