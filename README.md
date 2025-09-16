# Bruce Truong - Resume Website

A modern, responsive resume website built with Next.js, showcasing my experience as a Site Reliability Engineer. Features dark/light mode, PDF resume download, Formspree contact integration, privacy-focused design, and a full-stack Gas Mileage & Maintenance Tracker application.

🌐 **Live Site**: [brucetruong.com](https://brucetruong.com)

## ✨ Features

- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Dark/Light Mode** - System-aware theme switching with manual toggle
- **PDF Resume Download** - Static PDF resume download functionality
- **Contact Form** - Formspree integration with client-side validation
- **Privacy-Focused** - No phone numbers on public pages, strategic information disclosure
- **SEO Optimized** - Structured data, meta tags, and sitemap
- **Performance Focused** - Loading states, image optimization, and caching
- **Photography Gallery** - Lightbox gallery with Instagram integration
- **Gas Mileage Tracker** - Professional full-stack application with comprehensive analytics dashboard
- **Vehicle Analytics Dashboard** - Advanced charts with weekly/monthly/yearly views and interactive data visualization
- **Maintenance Management System** - Complete maintenance tracking with color-coded status indicators and due date alerts

## 📋 Prerequisites

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
  - This includes npm automatically
- **Git** - For cloning the repository

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/DeeAhTee/my-resume-site.git
   cd my-resume-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   # This installs Next.js, Tailwind CSS, TypeScript, and all other dependencies
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file (see Configuration section for details)
   touch .env.local
   # Add your Google Analytics ID and Supabase credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   **⚠️ Important**: The dev server must run on port 3000 for GitHub OAuth to work properly.

   **If port 3000 is in use:**
   ```bash
   # Find and kill the process using port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F

   # Then restart dev server
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

   **Note**: Mileage tracker OAuth requires localhost:3000 (configured in Supabase)

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── BackgroundAnimation.tsx    # Animated background
│   ├── ContactForm.tsx           # Formspree contact form
│   ├── HeroSection.tsx           # Home page hero
│   ├── PDFDownload.tsx           # PDF resume download
│   ├── PhotographyGallery.tsx    # Photo gallery with lightbox
│   ├── LoadingStates.tsx         # Loading components (spinner, button)
│   ├── Testimonials.tsx          # Client testimonials display
│   ├── TestimonialCarousel.tsx   # Carousel for multiple testimonials
│   └── OAuthRedirectHandler.tsx  # GitHub OAuth flow handler
├── about/              # About page with personal stories
├── contact/            # Contact page with Formspree form
├── projects/           # Projects showcase
├── resume/             # Resume page with PDF download
├── mileage/            # Gas Mileage & Maintenance Tracker
├── api/                # API routes for Supabase integration
└── globals.css         # Global styles and Tailwind
public/
├── Bruce_Truong_Resume.pdf       # Static PDF resume file
├── images/             # Static images and photos
└── icons/              # Favicon and app icons
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS with custom components
- **TypeScript**: Full type safety
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: GitHub OAuth via Supabase
- **Backend**: REST API routes with Supabase integration
- **Forms**: Formspree integration for contact form
- **File Serving**: Static PDF serving
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Version Control**: Git with GitHub

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-YOUR-GA-ID-HERE

# Supabase Configuration (for Gas Mileage Tracker)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Gas Mileage & Maintenance Tracker Setup

The mileage tracker is a full-stack application using Supabase as the backend:

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key to `.env.local`

2. **Set up Database Schema**
   - Run the SQL in `database/supabase-schema.sql` in your Supabase SQL editor
   - This creates tables for cars, fill-ups, maintenance records, and user profiles

3. **Configure GitHub OAuth**
   - In Supabase Dashboard → Authentication → Providers
   - Enable GitHub provider
   - Add your GitHub OAuth credentials
   - Set redirect URL to: `https://your-domain.com/mileage`

4. **Features Include**
   - ✅ Multi-car tracking with user authentication
   - ✅ Professional analytics dashboard with Chart.js integration
   - ✅ Interactive charts with weekly/monthly/yearly views
   - ✅ Advanced maintenance management with color-coded status indicators
   - ✅ Automatic MPG calculations and trend analysis
   - ✅ Complete maintenance record keeping with due date tracking
   - ✅ Owner/read-only access modes with professional status indicators
   - ✅ Row Level Security for data privacy
   - ✅ Responsive mobile-friendly interface with modern design patterns

### Contact Form Setup (Formspree)

The contact form uses [Formspree](https://formspree.io) for form handling:

1. **Create Formspree Account**
   - Go to [https://formspree.io](https://formspree.io)
   - Create a new form for your contact page
   - Get your form endpoint (format: `https://formspree.io/f/YOUR_FORM_ID`)

2. **Update Form Endpoint**
   - Edit `app/components/ContactForm.tsx`
   - Replace the fetch URL with your Formspree endpoint

3. **Form Features**
   - ✅ Client-side validation
   - ✅ Spam protection
   - ✅ Email notifications
   - ✅ Success/error handling

### PDF Resume Setup

To customize the PDF resume:
1. Create your professional resume using Word, Google Docs, or your preferred tool
2. Export as PDF with the filename `Bruce_Truong_Resume.pdf`
3. Replace the existing file in `/public/Bruce_Truong_Resume.pdf`
4. The download button will automatically serve your new PDF

## 📱 Features Overview

### PDF Resume Download
- Static PDF file serving
- Professional resume format
- Direct download functionality
- Easy to update - simply replace `/public/Bruce_Truong_Resume.pdf`

### Contact Form (Formspree Integration)
- Real form submissions (no mailto fallbacks)
- Client-side validation with TypeScript
- Loading states and success/error feedback
- Spam protection and email notifications
- Mobile-friendly design

### Photography Gallery
- Lightbox photo viewer with navigation
- Instagram integration and links
- Responsive grid layout
- Touch/swipe support for mobile

### Privacy-Focused Design
- No phone numbers on public pages
- Strategic information disclosure
- Clean, professional presentation
- Reduced spam/robocall exposure

### Performance & UX
- Image optimization with Next.js
- Loading skeletons and states
- Dark/light mode with system detection
- Responsive design for all devices

## 🚀 Deployment

The site deploys automatically to Vercel when pushing to the main branch via GitHub integration.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server locally
npm run lint     # Run ESLint for code quality
```

### Deployment Process

1. **Push to GitHub** - Commit and push changes to main branch
2. **Automatic Build** - Vercel detects changes and builds automatically
3. **Live in Minutes** - Changes appear on brucetruong.com within 2-3 minutes

## 🔧 Troubleshooting

### GitHub OAuth Issues

**Problem**: OAuth redirects to localhost instead of live site
**Solution**: Check Supabase URL Configuration:
- Site URL: `https://brucetruong.com`
- Redirect URLs: `https://brucetruong.com/mileage`, `http://localhost:3000/mileage`

**Problem**: "Cannot find module" errors in development
**Solution**: Clear Next.js cache and restart:
```bash
rm -rf .next
npm run dev
```

**Problem**: Port 3000 in use
**Solution**: Kill the process and restart:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Environment Variables

Required for mileage tracker functionality:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_GA_ID` - Google Analytics measurement ID

### Development Notes

- **Port 3000 Required**: Mileage tracker OAuth is configured for localhost:3000
- **Cache Issues**: Clear browser cache for OAuth problems (use incognito mode)
- **Database Access**: Row Level Security ensures user data isolation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

This is a personal resume website, but feel free to fork it for your own use or submit improvements via pull requests.

## 📞 Contact

- **Website**: [brucetruong.com](https://brucetruong.com)
- **Email**: careers@brucetruong.com
- **LinkedIn**: [linkedin.com/in/brucetruong](https://linkedin.com/in/brucetruong)
- **GitHub**: [github.com/DeeAhTee](https://github.com/DeeAhTee)

---

Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS • Deployed on Vercel
