# Bruce Truong - Resume Website

A modern, responsive resume website built with Next.js, showcasing my experience as a Site Reliability Engineer. Features dark/light mode, PDF resume download, search functionality, and privacy-focused analytics.

🌐 **Live Site**: [brucetruong.com](https://brucetruong.com)

## ✨ Features

- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Dark/Light Mode** - System-aware theme switching with manual toggle
- **PDF Resume Download** - Static PDF resume download functionality
- **Contact Form** - Functional contact form with validation
- **Search Functionality** - Site-wide search with keyboard shortcuts (Ctrl/Cmd+K)
- **Google Analytics** - GA4 analytics integration with privacy focus
- **SEO Optimized** - Structured data, meta tags, and sitemap
- **Performance Focused** - Loading states, image optimization, and caching

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

3. **Set up environment variables (optional)**
   ```bash
   # Create .env.local for analytics (optional)
   # See Configuration section below for details
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── Analytics.tsx   # Plausible Analytics integration
│   ├── ContactForm.tsx # Contact form with validation
│   ├── PDFDownload.tsx # PDF resume download component
│   ├── Search.tsx      # Site-wide search functionality
│   └── ...
├── api/                # API routes
│   └── contact/        # Contact form handler
├── about/              # About page
├── contact/            # Contact page
├── resume/             # Resume page
└── ...
public/
├── Bruce_Truong_Resume.pdf  # Static PDF resume file
├── images/             # Static images
└── ...
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **File Serving**: Static PDF serving
- **Analytics**: Google Analytics 4 (GA4)
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Google Analytics 4 Configuration
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Plausible Analytics (fallback)
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

### Analytics Setup

The site is configured for [Google Analytics 4](https://analytics.google.com). See `GOOGLE_ANALYTICS_SETUP.md` for detailed instructions, or follow these quick steps:

1. **Create Google Analytics Account**
   - Go to [https://analytics.google.com](https://analytics.google.com)
   - Create a new account and property for your domain
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Configure Environment Variable**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_GA_ID=your-measurement-id-here
   ```

3. **Deploy Configuration**
   - Add `NEXT_PUBLIC_GA_ID` as a repository secret/variable in GitHub
   - The Analytics component will automatically load GA4 in production

**Features Included:**
- ✅ Privacy-focused (only loads in production)
- ✅ Page view tracking
- ✅ Event tracking helpers
- ✅ Automatic fallback to Plausible if GA ID not provided

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

### Search Functionality
- Full-site content search
- Keyboard shortcuts (Ctrl/Cmd+K)
- Categorized results
- Mobile-friendly

### Contact Form
- Client-side validation
- Loading states
- Success/error feedback
- Accessible design

### Performance
- Image optimization
- Loading skeletons
- Lazy loading
- Static generation

## 🚀 Deployment

The site deploys automatically to GitHub Pages via GitHub Actions when pushing to the main branch.

### Manual Deployment

```bash
npm run build    # Build the static site
npm run deploy   # Deploy to GitHub Pages
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run deploy   # Deploy to GitHub Pages
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

This is a personal resume website, but feel free to fork it for your own use or submit improvements via pull requests.

## 📞 Contact

- **Website**: [brucetruong.com](https://brucetruong.com)
- **Email**: careers@brucetruong.com
- **LinkedIn**: [linkedin.com/in/brucetruong](https://linkedin.com/in/brucetruong)

---

Built with ❤️ using Next.js and deployed on GitHub Pages
