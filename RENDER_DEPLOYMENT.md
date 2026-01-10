# Deploy ElimuAI to Render - Complete Guide

## 🚀 Deploy Your App in 10 Minutes

Render is the **easiest** way to deploy your ElimuAI platform. Free tier available!

---

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/kadioko/ElimuAI
- ✅ Render account (create at https://render.com)
- ✅ M-Pesa credentials (optional for testing)

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with:
   - **GitHub** (recommended - easiest integration)
   - Or email/Google
4. Verify your email if required

---

### Step 2: Connect GitHub Repository

1. After signing in, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** next to GitHub
4. Authorize Render to access your repositories
5. Find and select: **kadioko/ElimuAI**
6. Click **"Connect"**

---

### Step 3: Configure Web Service

Fill in the following settings:

#### Basic Settings
- **Name**: `elimuai` (or `elimuai-tz`)
- **Region**: Choose closest to Tanzania (e.g., Frankfurt, Singapore)
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Runtime**: `Python 3`

#### Build & Deploy Settings
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```

- **Start Command**:
  ```bash
  gunicorn backend.app:app
  ```

#### Instance Type
- Select: **Free** (for testing)
- Or **Starter** ($7/month for production)

---

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Generate random string: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | `sqlite:///elimuai.db` |
| `FLASK_ENV` | `production` |
| `MPESA_CONSUMER_KEY` | Your M-Pesa key (or leave blank for testing) |
| `MPESA_CONSUMER_SECRET` | Your M-Pesa secret (or leave blank) |
| `MPESA_SHORTCODE` | Your shortcode (or leave blank) |
| `MPESA_PASSKEY` | Your passkey (or leave blank) |
| `MPESA_CALLBACK_URL` | `https://your-app.onrender.com/api/mpesa/callback` |

**Note:** For testing without M-Pesa, you can leave M-Pesa variables blank.

---

### Step 5: Deploy!

1. Scroll down and click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy it live
3. Wait 3-5 minutes for deployment to complete
4. You'll see: **"Your service is live 🎉"**

---

### Step 6: Get Your Live URL

After deployment:
1. Your app URL will be: `https://elimuai.onrender.com` (or your chosen name)
2. Click the URL to visit your live application
3. Test the features:
   - Register a new account
   - Browse courses
   - Take a quiz
   - Chat with AI tutor

---

## 🔧 Post-Deployment Setup

### Initialize Database

Your database will be automatically created on first run. The app will:
1. Create all tables
2. Seed sample data (courses, quizzes)
3. Be ready to use

### Update GitHub Repository

Add your live URL to GitHub:
1. Go to: https://github.com/kadioko/ElimuAI
2. Click ⚙️ gear icon
3. Add website: `https://elimuai.onrender.com`
4. Save changes

### Update MPESA_CALLBACK_URL

If using M-Pesa:
1. In Render dashboard, go to Environment
2. Update `MPESA_CALLBACK_URL` with your actual URL
3. Save changes
4. Render will auto-redeploy

---

## 📊 Monitor Your Application

### Render Dashboard

Access at: https://dashboard.render.com

You can:
- View logs (real-time)
- Monitor metrics (CPU, memory)
- See deployment history
- Manage environment variables
- View custom domains

### View Logs

1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. See real-time application logs
4. Debug any issues

---

## 🔄 Update Your Application

When you make changes to your code:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **Render auto-deploys:**
   - Render detects the push
   - Automatically rebuilds
   - Deploys new version
   - Takes 2-3 minutes

---

## 💰 Pricing

### Free Tier
- ✅ Perfect for testing and MVP
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold starts (15-30 seconds)

### Starter Tier ($7/month)
- ✅ Always on (no spin down)
- ✅ Faster performance
- ✅ Custom domains
- ✅ Better for production

### Upgrade Later
Start with free tier, upgrade when you have users!

---

## 🔒 Security Best Practices

### 1. Use Strong SECRET_KEY
Generate a new one:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Enable HTTPS (Automatic)
Render provides free SSL certificates automatically.

### 3. Set Environment Variables
Never commit sensitive data to GitHub. Use Render's environment variables.

### 4. Regular Updates
Keep dependencies updated:
```bash
pip list --outdated
```

---

## 🚨 Troubleshooting

### Build Failed
**Check logs for errors:**
- Missing dependencies? Update `requirements.txt`
- Python version issue? Check `runtime.txt`
- Import errors? Check file paths

### App Won't Start
**Common issues:**
- Wrong start command? Should be: `gunicorn backend.app:app`
- Missing environment variables? Add them in Render
- Database errors? Check DATABASE_URL

### 500 Internal Server Error
**Debug steps:**
1. Check Render logs
2. Verify environment variables
3. Test locally first: `python scripts/run_app.py`
4. Check file paths (use absolute paths)

### Slow Performance (Free Tier)
**Solutions:**
- Upgrade to Starter tier ($7/month)
- Optimize database queries
- Add caching (Redis)
- Use CDN for static files

---

## 📈 Scaling Your Application

### When to Upgrade

Upgrade from Free to Starter when:
- You have 50+ daily active users
- Cold starts affect user experience
- You need custom domain
- You want better performance

### Database Upgrade

For production with many users:
1. Add PostgreSQL database in Render
2. Update `DATABASE_URL` environment variable
3. Migrate data from SQLite

### Add Redis Caching

For better performance:
1. Add Redis instance in Render
2. Update code to use Redis
3. Cache frequently accessed data

---

## 🎯 Production Checklist

Before going live with real users:

- [ ] Upgrade to Starter tier ($7/month)
- [ ] Add PostgreSQL database
- [ ] Configure M-Pesa with production credentials
- [ ] Set up custom domain
- [ ] Enable error monitoring (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Set up backups
- [ ] Test all features thoroughly
- [ ] Add terms of service and privacy policy
- [ ] Set up customer support email

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. Buy domain (e.g., elimuai.co.tz)
2. In Render dashboard:
   - Go to Settings → Custom Domains
   - Click "Add Custom Domain"
   - Enter your domain
3. Update DNS records:
   - Add CNAME record pointing to Render
4. Wait for DNS propagation (up to 24 hours)
5. Render auto-provisions SSL certificate

---

## 📞 Support

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### ElimuAI Issues
- GitHub Issues: https://github.com/kadioko/ElimuAI/issues
- Documentation: See `/docs` folder

---

## ✅ Success!

Your ElimuAI platform is now live and accessible worldwide!

**Live URL**: https://elimuai.onrender.com (or your custom domain)

**Next Steps:**
1. Test all features
2. Share with beta users
3. Gather feedback
4. Iterate and improve
5. Market your platform!

---

## 🎉 Congratulations!

You've successfully deployed ElimuAI to production. Your platform is now helping Tanzanian students learn!

**Share your success:**
- LinkedIn: Post about your project
- Twitter: Share the live link
- Dev.to: Write a blog post
- Product Hunt: Submit your product

Good luck with ElimuAI! 🚀📚
