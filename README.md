# Bruce Truong - Resume Website

A modern, responsive resume website built with Next.js, showcasing my experience as a Site Reliability Engineer. Features dark/light mode, dynamic PDF generation, search functionality, and privacy-focused analytics.

🌐 **Live Site**: [brucetruong.com](https://brucetruong.com)

## ✨ Features

- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Dark/Light Mode** - System-aware theme switching with manual toggle
- **PDF Resume Download** - Static PDF resume download functionality
- **Contact Form** - Functional contact form with validation
- **Search Functionality** - Site-wide search with keyboard shortcuts (Ctrl/Cmd+K)
- **Privacy-First Analytics** - Plausible Analytics integration
- **SEO Optimized** - Structured data, meta tags, and sitemap
- **Performance Focused** - Loading states, image optimization, and caching

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/my-resume-site.git
   cd my-resume-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
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
│   ├── Search.tsx      # Site-wide search functionality
│   └── ...
├── api/                # API routes
│   └── contact/        # Contact form handler
├── about/              # About page
├── contact/            # Contact page
├── resume/             # Resume page
└── ...
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **File Serving**: Static PDF serving
- **Analytics**: Plausible Analytics
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Optional: Google Analytics (fallback)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Analytics Setup

The site is configured for [Plausible Analytics](https://plausible.io/). See `PLAUSIBLE_SETUP.md` for detailed setup instructions.

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
npm run build
npm run deploy
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
