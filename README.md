<div align="center">
  <h1>MEC Computer Club Backend API</h1>
  <p><strong>Scalable RESTful API service powering the MEC Computer Club (MEC-CC) web platform.</strong></p>
  <p>
    Built with Express 5, TypeScript, MongoDB (Mongoose), and Cloudinary. Features role-based authorization, automated event registrations, verifiable digital certificates, and full Vercel serverless support.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#api-endpoints">API Reference</a> •
    <a href="#environment-variables">Environment Variables</a> •
    <a href="#deployment">Deployment</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-5-black?style=flat-square&logo=express" alt="Express" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose_8-brightgreen?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel" alt="Vercel" />
  </p>
</div>

---

## 🚀 Overview

The **MEC Computer Club Backend API** provides a secure, high-performance data layer and business logic service for the university computer club. It supports user lifecycle management, tournament operations with squad rosters, verifiable cryptographic certificate issuance, dynamic form builders, tech blogging, and media processing.

---

## ✨ Features

- **🔐 Robust Authentication & RBAC**:
  - JWT authentication using secure, HTTP-only cookies and Bearer tokens.
  - Role-based permissions: `admin`, `moderator`, `member`, and `guest`.
  - Account verification and secure password reset flows via SMTP.
  - Role-gated invitation system with single-use or reusable invite tokens.
- **🏆 Events & Tournament Operations**:
  - Full lifecycle support for workshops, seminars, contests, and esports gaming tournaments.
  - Multi-mode registration: Individual participants or Squad/Team rosters (Team leader, player IDs, member roster).
  - Admin approval workflows with automated HTML confirmation email dispatch upon acceptance.
  - Real-time attendee roster tracking, check-ins, and podium winners recording.
- **📜 Verifiable Digital Certificates**:
  - Unique credential generation (`MCC-YYYY-XXXXXXXX`) with tamper-proof verification URLs.
  - **Dual-Mode Template Registry**: Visual layout configurations & raw Custom HTML/CSS templates with dynamic Mustache placeholders (`{{recipient_name}}`, `{{event_title}}`, `{{issue_date}}`).
  - Single and bulk issuance endpoints linked to events or standalone achievements.
- **📋 Dynamic Form Builder & Submissions**:
  - Schema-less custom form builder supporting text, select, file uploads, and radio choices.
  - Form submission tracking and instant Excel/CSV data export.
- **📝 Technical Blogs & Projects**:
  - Markdown article management with view tracking, category filtering, and slug routing.
  - Student project showcase directory.
- **🤝 Sponsors & Partnerships**:
  - Sponsor profile tracking, logo hosting, and event sponsorship records categorized by tiers (*Gold*, *Silver*, *Bronze*, *Partner*).
- **⚡ Performance & Serverless Ready**:
  - Configured for Vercel Serverless Functions via `vercel.json`.
  - Built-in Gzip compression (`compression`), connection pooling, and optimized MongoDB index schemas.
  - Permissive, origin-validated CORS supporting localhost, Vercel deployments, and custom university domains (`meccomputerclub.org`).

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/) (v5.x)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.x)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) (v8.x)
- **Authentication**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **File & Media Storage**: [Multer](https://github.com/expressjs/multer) & [Cloudinary SDK](https://cloudinary.com/)
- **Email Dispatch**: [Nodemailer](https://nodemailer.com/) (SMTP)
- **API Documentation**: [Swagger UI](https://swagger.io/tools/swagger-ui/) & OpenAPI 3.0 (`swagger-jsdoc`)
- **Data Export**: [xlsx](https://sheetjs.com/)
- **Hosting**: [Vercel](https://vercel.com/) (Serverless)

---

## 📁 Architecture & Structure

```
mec-cc backend/
├── src/
│   ├── config/          # Database connection, Cloudinary, & Multer setup
│   ├── controllers/     # Request handlers & HTTP responses
│   ├── middlewares/     # Authentication, RBAC, error handling, upload filters
│   ├── models/          # Mongoose data schemas & TypeScript interfaces
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic & external API integrations
│   ├── utils/           # Token generation, email templates, helpers
│   ├── app.ts           # Express application configuration & middleware pipeline
│   └── server.ts        # Server entry point & local listening daemon
├── vercel.json          # Vercel serverless function build configuration
├── tsConfig.json        # TypeScript compiler options
└── package.json         # Dependencies and scripts
```

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or higher
- **MongoDB**: Local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI
- **Cloudinary Account**: For image and file uploads
- **SMTP Server**: Gmail App Password or SMTP provider (SendGrid, Mailgun, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/meccomputerclub/mecComputerClubWebsite-backend.git
   cd mecComputerClubWebsite-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your credentials (see [Environment Variables](#environment-variables)).

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The server will start on [http://localhost:4000](http://localhost:4000).

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📖 API Reference & Interactive Docs

When running locally or in staging, visit **Swagger UI** for complete interactive API exploration:

```
http://localhost:4000/api/docs
```

### Key API Endpoints Summary

| Prefix | Method | Description | Access |
| :--- | :---: | :--- | :--- |
| `/api/users` | `POST` | Register, Login, Refresh, Password Reset | Public |
| `/api/users` | `GET` | Get profile, List members, Manage approvals | Member / Admin |
| `/api/events` | `GET` | List published events, event detail by slug | Public |
| `/api/events` | `POST` | Create event, register participant/squad | Public / Admin |
| `/api/events/:id/participants/:userId/approve` | `PATCH` | Approve participant & dispatch email | Admin |
| `/api/certificates` | `GET` | Verify certificate by ID (`/verify`) | Public |
| `/api/certificates` | `POST` | Issue individual or bulk certificates | Admin |
| `/api/certificate-templates`| `GET/POST`| Visual & Custom HTML/CSS templates | Admin |
| `/api/forms` | `GET/POST`| Dynamic forms & participant submissions | Public / Admin |
| `/api/blogs` | `GET/POST`| Tech articles, comments, views | Public / Member |
| `/api/projects` | `GET/POST`| Showcase club projects & repos | Public / Member |
| `/api/sponsors` | `GET/POST`| Sponsors directory & tier records | Public / Admin |
| `/api/invitations` | `POST`| Generate role-based invitation links | Admin |

---

## 🔐 Environment Variables

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Server port (default: `4000`) | `4000` |
| `NODE_ENV` | No | Environment mode (`development` / `production`) | `production` |
| `FRONTEND_URL` | **Yes** | Client URL for CORS & email links | `https://meccomputerclub.org` |
| `MONGO_URI` | **Yes** | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/mec_club` |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens | `super-secret-random-hash` |
| `JWT_EXPIRES_IN` | No | Token expiration duration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret | `abcdefghijklmnopqrstuvwxyz` |
| `SMTP_HOST` | **Yes** | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | **Yes** | SMTP port | `587` |
| `SMTP_USER` | **Yes** | SMTP login username / email | `club@gmail.com` |
| `SMTP_PASS` | **Yes** | SMTP login password / app password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | **Yes** | Sender name and address for emails | `"MEC Computer Club" <noreply@meccomputerclub.org>` |

---

## 🚢 Deployment (Vercel Serverless)

The backend is configured to run serverlessly on **Vercel**:

1. In [Vercel](https://vercel.com/), click **Add New Project** and import [`meccomputerclub/mecComputerClubWebsite-backend`](https://github.com/meccomputerclub/mecComputerClubWebsite-backend).
2. Set the **Framework Preset** to `Other`.
3. In **Environment Variables**, populate all required keys from the table above.
4. Click **Deploy**.
5. Your API will be live at `https://<your-project>.vercel.app`.

---

## 📄 License

Distributed under the **ISC License**.

---

<div align="center">
  <sub>Maintained by the <strong>MEC Computer Club</strong> Backend Engineering Team.</sub>
</div>
