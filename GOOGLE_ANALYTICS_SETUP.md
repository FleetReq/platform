# Google Analytics 4 Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for your resume website.

## 📊 Why Google Analytics 4?

- **Free forever** - No usage limits or costs
- **Privacy-focused** - GDPR compliant with proper configuration
- **Comprehensive tracking** - Page views, events, conversions
- **Real-time data** - See visitors as they browse your site
- **Goal tracking** - Track resume downloads, contact form submissions

## 🚀 Quick Setup Steps

### 1. Create Google Analytics Account

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **"Start measuring"**
3. Create an **Account** (use your name or business name)
4. Create a **Property** (your website name - e.g., "Bruce Truong Portfolio")

### 2. Configure Property

1. **Property name**: Your website name
2. **Reporting time zone**: Your local timezone
3. **Currency**: Your local currency (for e-commerce tracking if needed)

### 3. Set Up Data Stream

1. Choose **"Web"** platform
2. **Website URL**: `https://brucetruong.com`
3. **Stream name**: "Portfolio Website"
4. Click **"Create stream"**

### 4. Get Measurement ID

After creating the data stream, you'll see your **Measurement ID**:
- Format: `G-XXXXXXXXXX`
- Example: `G-ABC123DEF4`

### 5. Add to Your Website

1. **Local Development:**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_GA_ID=G-YOUR-ACTUAL-ID-HERE
   ```

2. **Production Deployment:**
   - Go to your GitHub repository settings
   - Navigate to **Secrets and variables → Actions**
   - Add repository variable: `NEXT_PUBLIC_GA_ID` = `G-YOUR-ACTUAL-ID-HERE`

### 6. Test Your Setup

1. Deploy your site with the GA ID
2. Visit your live website
3. Check GA4 real-time reports (may take 24-48 hours for full data)

## 🔧 Advanced Configuration

### Enhanced Tracking (Already Included)

Your Analytics component automatically tracks:
- ✅ Page views
- ✅ Session duration
- ✅ Bounce rate
- ✅ User location and device info

### Custom Events

Use the included helper functions:

```typescript
import { trackEvent } from '@/components/Analytics'

// Track PDF downloads
trackEvent('resume_download', {
  file_name: 'Bruce_Truong_Resume.pdf',
  download_method: 'button_click'
})

// Track contact form submissions
trackEvent('contact_form_submit', {
  form_type: 'contact_page'
})
```

## 📈 Key Metrics to Monitor

### Important Reports in GA4:

1. **Realtime** - Live visitor activity
2. **Acquisition** - How people find your site
3. **Engagement** - Page views, session duration
4. **Demographics** - Visitor location and tech
5. **Events** - Custom tracking (resume downloads, etc.)

### Goals to Set Up:

- **Resume Downloads** - Track PDF download clicks
- **Contact Form Submissions** - Track career inquiries
- **External Links** - Track LinkedIn/GitHub clicks
- **Session Duration** - Engagement quality

## 🛡️ Privacy & GDPR Compliance

Your setup is privacy-focused by default:

- ✅ **Development only** - GA4 only loads in production
- ✅ **No personal data** - Only anonymous usage statistics
- ✅ **Respect DNT** - Honors "Do Not Track" settings
- ✅ **IP Anonymization** - Built into GA4 by default

## 🚨 Common Issues

### Analytics Not Working?

1. **Check Environment Variable**
   ```bash
   echo $NEXT_PUBLIC_GA_ID  # Should show your Measurement ID
   ```

2. **Check Production Only**
   - GA4 only loads in production builds
   - Test on your live site, not localhost

3. **Wait 24-48 Hours**
   - New properties take time to collect data
   - Real-time reports work immediately

4. **Browser Extensions**
   - Ad blockers may block GA4
   - Test in incognito mode

## 🔗 Helpful Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Privacy Guide](https://support.google.com/analytics/answer/9019185)

---

**Questions?** Check the Analytics component at `/app/components/Analytics.tsx` for implementation details.