# Contact Form Setup with Formspree

## ✅ Free Real Email Delivery!

Get actual email messages from your contact form using Formspree's free tier.

## 🚀 Setup Steps:

### 1. Sign Up for Formspree
- Go to: **https://formspree.io/**
- Click **"Get Started"**
- **FREE**: 50 submissions/month
- Sign up with your email

### 2. Create New Form
- Click **"New Form"**
- Form name: `Bruce Truong Contact Form`
- Form endpoint: Choose a name like `bruce-contact`
- Email: `careers@brucetruong.com` (where you want to receive emails)

### 3. Get Your Form ID
- After creating, copy your **Form ID** (looks like `xpznvqko`)
- It will be in the URL: `https://formspree.io/f/YOUR_FORM_ID`

### 4. Update Your Site
- Go to GitHub repo → Settings → Secrets and variables → Actions → Variables
- Add variable: `NEXT_PUBLIC_FORMSPREE_ID` = `your_form_id_here`
- The contact form will automatically start working!

### 5. Configure Form Settings (Optional)
- **Spam Protection**: Enabled by default
- **Email Notifications**: Customize subject line
- **Redirects**: Set thank you page
- **File Uploads**: Enable if needed

## 📧 What Happens:
1. User fills out contact form
2. Formspree receives submission
3. **You get email** at careers@brucetruong.com
4. User sees success message
5. No setup required on your end!

## 🔗 Your Dashboard:
Manage forms and view submissions at:
**https://formspree.io/forms**

## 💰 Pricing:
- **FREE**: 50 submissions/month
- **$8/month**: 1,000 submissions/month
- **$20/month**: 5,000 submissions/month

## 🌟 Benefits:
- ✅ **Real Email Delivery** - Actually sends emails
- ✅ **Spam Protection** - Built-in filtering
- ✅ **No Server Required** - Works with static sites
- ✅ **Professional** - Reliable delivery
- ✅ **Easy Setup** - Just add form action

## 🆘 Need Help?
Formspree documentation:
**https://help.formspree.io/**