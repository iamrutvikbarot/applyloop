<div align="center">
  <h1>♾️ ApplyLoop</h1>
  <p><strong>Automate your job search workflow straight from your inbox.</strong></p>
</div>

---

## 🌟 Overview

**ApplyLoop** is an intelligent job-tracking dashboard designed to seamlessly extract, organize, and present job opportunities hidden within your daily email alerts. By securely connecting to your Gmail, ApplyLoop parses heavy job board emails (like LinkedIn and Hirist) and curates them into a stunning, hand-drawn workspace. 

Stop sifting through hundreds of emails manually. Let ApplyLoop build your daily, highly-curated job feed.

## ✨ Features

- 📧 **Gmail Integration**: Secure Google OAuth flow to fetch and read job alert emails automatically.
- ⚡ **Smart Extraction Engine**: Parses complex email HTML to instantly extract Job Titles, Companies, Locations, Experience requirements, and direct application URLs.
- 🎯 **Intelligent Filtering**: Automatically filters out senior roles (e.g. jobs requiring 5+ years of experience) so you only see opportunities relevant to you.
- 🎨 **Beautiful Hand-Drawn UI**: A unique, responsive "creator's desk" interface featuring gorgeous `light` and `dark` modes, crafted with Tailwind CSS and Framer Motion.
- 📱 **Adaptive Layouts**: Seamlessly handles desktop and mobile views with collapsible side panels, sliding tabs, and focus modes.
- 📄 **Integrated PDF Tools**: Built-in infrastructure for viewing and manipulating PDF resumes directly in the browser using PDF.js.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- A Google Cloud Console project with the Gmail API enabled (for OAuth credentials).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/applyloop.git
   cd applyloop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_string
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard in action.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://motion.dev/)
- **PDF Processing:** [PDF.js](https://mozilla.github.io/pdf.js/)
- **Authentication:** Google OAuth / Gmail API

## 🎨 Design Philosophy

ApplyLoop rejects the sterile, overly corporate look of traditional job boards. Instead, it embraces a **"creator's desk"** aesthetic—featuring custom handwritten fonts (`Caveat`, `Patrick Hand`, `Kalam`), soft pastel/amber color palettes, dashed borders, and subtle paper-like drop shadows. The result is a workspace that feels personal, dynamic, and engaging to use every single day.

---
<div align="center">
  <i>Built with ❤️ to make job hunting a little less painful and a lot more beautiful.</i>
</div>
