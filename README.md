# Queryloom

Queryloom is a robust social polling and discussion platform built with Node.js, Express, and MySQL (via Sequelize ORM). It empowers users to create, share, and interact with polls, posts, and groups, supporting rich media attachments, comments, likes, votes, and advanced user management.

## Features

- **User Authentication & Roles:**
  - Secure signup/login with email or phone
  - OTP verification
  - Role-based access (admin/user)
- **Polls & Posts:**
  - Create, edit, and manage polls or posts
  - Attach images or videos
  - Multiple-choice poll options
- **Groups & Membership:**
  - Create and join groups
  - Manage group roles (admin, sub-admin, member)
  - Set and enforce group rules
- **Voting & Reactions:**
  - Like, comment, vote, and save polls or posts
  - All interactions are tracked and visible to users
- **Moderation & Reporting:**
  - Report posts and users
  - Admin tools for approval, blocking, and content moderation
- **Rich User Profiles:**
  - Specify education, income, expertise, political affiliation, and more
- **Privacy & Visibility:**
  - Fine-grained controls for post visibility, incognito posting, and group privacy
- **File Uploads:**
  - Supports image and video uploads for posts and comments
- **Sequelize ORM:**
  - All data models, migrations, and seeders are managed with Sequelize

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL (with Sequelize ORM)
- **File Uploads:** Multer
- **Authentication:** JWT
- **Email/OTP:** Nodemailer
- **API:** RESTful

## Getting Started

### Prerequisites
- Node.js (v16 or above)
- MySQL

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/queryloom.git
   cd queryloom
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values (create `.env.example` if not present).
   - Update `config/config.json` with your MySQL credentials (this file is gitignored for security).
4. **Run database migrations and seeders:**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
5. **Start the server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000` by default.

## Project Structure

- `app.js` – Main application entry point
- `routes/` – Express route handlers (users, polls, groups, etc.)
- `controllers/` – Business logic for each route
- `models/` – Sequelize models
- `migrations/` – Sequelize migration files
- `seeders/` – Sequelize seed data
- `helpers/` – Utility modules (file upload, email, OTP, etc.)
- `middleware/` – Express middleware (auth, admin checks)
- `uploads/` – Uploaded files (images, videos)
- `public/` – Static files

## Contribution

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

This project is licensed under the ISC License.
