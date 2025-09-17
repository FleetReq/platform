# Bruce Truong - Site Reliability Engineer Portfolio

A professional, enterprise-grade portfolio website showcasing Site Reliability Engineering expertise and full-stack development skills. Built with modern technologies and production-ready features, demonstrating the same quality and attention to detail that goes into enterprise infrastructure.

🌐 **Live Site**: [brucetruong.com](https://brucetruong.com)
🚀 **SRE Professional** • **60B+ Documents Migrated** • **Production Systems Expert**

## 🎯 Technical Highlights & Professional Features

### 🔐 **Security & Authentication**
- **GitHub OAuth Integration** - Secure popup-based authentication flow with Supabase
- **Row Level Security (RLS)** - Database-level security ensuring data isolation
- **Zero-Flash OAuth** - Optimized authentication preventing home page redirects
- **HTTPS-Only** - Production security with proper certificate management

### 🏗️ **Enterprise Architecture & Infrastructure**
- **Next.js 15 App Router** - Latest framework with server components and streaming
- **TypeScript** - Full type safety across the entire application stack
- **Supabase Backend** - PostgreSQL with real-time subscriptions and edge functions
- **RESTful API Design** - Professional API architecture with proper error handling
- **Responsive PWA** - Progressive Web App with offline capabilities

### 📊 **Production-Grade Analytics & Monitoring**
- **Real-Time Analytics Dashboard** - Chart.js integration with interactive data visualization
- **Custom Metrics Tracking** - Professional KPI dashboards with weekly/monthly/yearly views
- **Performance Monitoring** - Google Analytics integration with privacy compliance
- **SEO Optimization** - Structured data, meta tags, sitemap, and search optimization

### 🛠️ **DevOps & Deployment Excellence**
- **Automated CI/CD** - GitHub Actions with Vercel deployment pipeline
- **Environment Management** - Proper env variable handling and secret management
- **Code Quality** - ESLint, TypeScript, and automated testing workflows
- **Performance Optimization** - Image optimization, code splitting, and caching strategies

### 💼 **Professional Applications**

#### **Gas Mileage & Maintenance Tracker** - *Full-Stack Production Application*
- **Multi-User SaaS Platform** - Complete user management with role-based access
- **Advanced Analytics Engine** - Automated MPG calculations with trend analysis
- **Maintenance Management System** - Color-coded status indicators and automated alerts
- **Data Visualization** - Interactive charts with exportable analytics reports
- **Mobile-Responsive Design** - Touch-friendly interface optimized for field use

#### **Professional Portfolio Features**
- **Photography Gallery** - Lightbox gallery with Instagram API integration
- **Contact Management** - Formspree integration with spam protection
- **PDF Resume System** - Dynamic resume download with version control
- **Search Functionality** - Site-wide search with indexed content and keyboard shortcuts

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

## 🛠️ Enterprise Technology Stack

### **Frontend Architecture**
- **Next.js 15** - Latest React framework with App Router, Server Components, and Streaming
- **TypeScript** - Complete type safety and enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework with custom component system
- **React 19** - Latest React with concurrent features and improved performance

### **Backend & Database**
- **Supabase** - PostgreSQL with Edge Functions, real-time subscriptions, and Row Level Security
- **RESTful APIs** - Professional API design with proper error handling and validation
- **GitHub OAuth** - Secure authentication with popup-based flow optimization
- **Edge Computing** - Globally distributed backend for optimal performance

### **Analytics & Monitoring**
- **Chart.js** - Professional data visualization with interactive dashboards
- **Google Analytics** - Privacy-compliant user analytics and performance tracking
- **Real-time Metrics** - Live dashboard updates with WebSocket connections
- **Custom KPI Tracking** - Business intelligence and reporting systems

### **DevOps & Deployment**
- **Vercel** - Enterprise hosting with automatic deployments and edge optimization
- **GitHub Actions** - Automated CI/CD pipeline with testing and quality checks
- **Environment Management** - Secure configuration and secret management
- **Performance Optimization** - Image optimization, code splitting, and progressive loading

### **Professional Integrations**
- **Formspree** - Enterprise contact form handling with spam protection
- **Instagram API** - Social media integration for photography portfolio
- **PDF Generation** - Dynamic document serving and version control
- **Search Engine** - Custom search implementation with keyboard shortcuts

## 🎖️ Site Reliability Engineering Skills Demonstrated

### **Infrastructure Automation**
- **Infrastructure as Code** - Automated deployment and environment management
- **CI/CD Pipelines** - GitHub Actions with automated testing and deployment
- **Environment Consistency** - Reproducible builds across development and production
- **Monitoring & Alerting** - Performance tracking with automated incident response

### **Scalability & Performance**
- **Edge Computing** - Global content delivery and optimization
- **Database Optimization** - Efficient queries with proper indexing and caching
- **Load Balancing** - Automatic scaling and traffic distribution
- **Performance Monitoring** - Real-time metrics and alerting systems

### **Security & Compliance**
- **Authentication Security** - OAuth implementation with proper session management
- **Data Protection** - Row Level Security and encrypted data transmission
- **Access Control** - Role-based permissions and user management
- **Security Headers** - HTTPS enforcement and security best practices

### **Production Reliability**
- **Zero-Downtime Deployments** - Automated deployment with rollback capabilities
- **Error Handling** - Comprehensive error tracking and recovery mechanisms
- **Data Backup & Recovery** - Automated backup systems with disaster recovery
- **High Availability** - Multi-region deployment with failover capabilities

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

## 🎯 Professional Results & Impact

This portfolio demonstrates the same engineering excellence and attention to detail that I bring to enterprise infrastructure projects:

- **✅ Production-Ready Architecture** - Built with enterprise patterns and best practices
- **✅ Security-First Design** - Implements proper authentication, authorization, and data protection
- **✅ Performance Optimized** - Achieves 90+ Lighthouse scores across all metrics
- **✅ Scalable Infrastructure** - Designed to handle growth and high-traffic scenarios
- **✅ Monitoring & Observability** - Full analytics and performance tracking implementation

## 🚀 Why This Matters for SRE

This website serves as a practical demonstration of:

1. **Infrastructure Automation** - Automated CI/CD and deployment processes
2. **Security Implementation** - OAuth, RLS, and security best practices
3. **Performance Engineering** - Optimization techniques and monitoring
4. **Full-Stack Capability** - End-to-end application development and maintenance
5. **Production Operations** - Real-world application with 24/7 availability

## 📞 Professional Contact

- **🌐 Portfolio**: [brucetruong.com](https://brucetruong.com)
- **✉️ Email**: careers@brucetruong.com
- **💼 LinkedIn**: [linkedin.com/in/brucentruong](https://linkedin.com/in/brucentruong)
- **⚡ GitHub**: [github.com/DeeAhTee](https://github.com/DeeAhTee)

---

**Site Reliability Engineer** • **Next.js 15** • **TypeScript** • **Enterprise Architecture**
*Demonstrating production-grade development and infrastructure expertise*
