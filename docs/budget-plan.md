# SportNexus — Startup Budget Plan

## Overview

This document covers all costs to build, launch, and operate the SportNexus platform —
mobile app, API server, database, payments, notifications, and third-party services.

---

## 1. One-Time Setup Costs

| Item | Cost | Notes |
|---|---|---|
| Google Play Store registration | $25 (~₹2,100) | One-time lifetime fee |
| Apple App Store registration | $99/year (~₹8,300) | Annual renewal required |
| Domain name (.com) | $10–15/year (~₹850–1,250) | e.g. sportnexus.com via Namecheap/GoDaddy |
| Logo & branding (DIY) | ₹0 | Use Canva free tier |
| Logo & branding (designer) | ₹5,000–15,000 | Optional, one-time |
| **Total One-Time** | **~₹11,000–27,000** | |

---

## 2. Monthly Infrastructure Costs

### Tier 1 — MVP / Free (0–50 users)

Everything on free tiers. Suitable for testing and early beta.

| Service | Plan | Monthly Cost | Limits |
|---|---|---|---|
| **Render** — API Server | Free | ₹0 | Spins down after 15 min inactivity |
| **Render** — PostgreSQL | Free | ₹0 | 90 days, then expires |
| **Render** — Redis | Free | ₹0 | 25 MB |
| **Expo EAS Build** | Free | ₹0 | 30 builds/month |
| **Firebase** (FCM push) | Spark Free | ₹0 | Unlimited push notifications |
| **Razorpay** | Pay-per-use | ₹0 base | 2% per transaction |
| **Gmail SMTP** (OTP/email) | Free | ₹0 | 500 emails/day |
| **OpenStreetMap** (maps) | Free | ₹0 | Unlimited, no API key |
| **Cloudinary** (images) | Free | ₹0 | 25 GB storage, 25 GB bandwidth |
| **Sentry** (error tracking) | Free | ₹0 | 5,000 errors/month |
| **Total** | | **₹0/month** | |

> ⚠️ Free Render PostgreSQL expires after 90 days — migrate to paid before then.

---

### Tier 2 — Startup (50–500 users)

Recommended for soft launch and paying customers.

| Service | Plan | Monthly Cost (INR) | Notes |
|---|---|---|---|
| **Render** — API Server | Starter ($7) | ₹585 | No spin-down, always on |
| **Render** — PostgreSQL | Starter ($7) | ₹585 | 1 GB storage, automated backups |
| **Render** — Redis | Starter ($10) | ₹835 | 25 MB, persistent |
| **Expo EAS Build** | Free | ₹0 | 30 builds/month (enough for releases) |
| **Firebase** (FCM) | Spark Free | ₹0 | Unlimited push |
| **Razorpay** | Pay-per-use | ₹0 base | 2% per transaction (see Section 4) |
| **MSG91 / Twilio** (OTP SMS) | Pay-per-use | ₹150–500 | ~₹0.15/SMS, ~1,000 OTPs/month |
| **Gmail / SendGrid** (email) | Free | ₹0 | Up to 100 emails/day free |
| **OpenStreetMap** (maps) | Free | ₹0 | Unlimited |
| **Cloudinary** (photos) | Free | ₹0 | 25 GB/month bandwidth |
| **Sentry** (monitoring) | Free | ₹0 | 5,000 errors/month |
| **Domain + SSL** | ~$1/month | ₹85 | SSL is free via Let's Encrypt |
| **Total** | | **~₹2,200–2,500/month** | ~$26–30/month |

---

### Tier 3 — Growth (500–5,000 users)

| Service | Plan | Monthly Cost (INR) | Notes |
|---|---|---|---|
| **Render** — API Server | Standard ($25) | ₹2,090 | 2 GB RAM, auto-scaling |
| **Render** — PostgreSQL | Standard ($20) | ₹1,670 | 4 GB storage, daily backups |
| **Render** — Redis | Standard ($30) | ₹2,510 | 100 MB, HA mode |
| **Expo EAS Build** | Production ($99) | ₹8,280 | Unlimited builds, priority queue |
| **Firebase** (FCM) | Spark Free | ₹0 | Unlimited push |
| **MSG91** (OTP SMS) | Pay-per-use | ₹1,000–3,000 | ~10,000–20,000 OTPs/month |
| **SendGrid** (email) | Essentials ($19.95) | ₹1,668 | 50,000 emails/month |
| **Cloudinary** (photos) | Plus ($89) | ₹7,440 | 225 GB storage + CDN |
| **Sentry** (monitoring) | Team ($26) | ₹2,175 | 50,000 errors/month |
| **Google Maps API** (optional upgrade) | Pay-per-use | ₹0–5,000 | $200 free credit/month (~28k loads) |
| **Domain + SSL** | | ₹85 | |
| **Total** | | **~₹25,000–35,000/month** | ~$300–420/month |

---

## 3. Development Cost (If Hiring)

| Role | Type | Cost Range |
|---|---|---|
| Full-stack developer (freelance) | One-time build | ₹1,50,000–4,00,000 |
| React Native developer (freelance) | One-time mobile | ₹80,000–2,00,000 |
| UI/UX Designer | One-time design | ₹30,000–80,000 |
| Full-stack developer (in-house) | Monthly salary | ₹60,000–1,20,000/month |
| **This app (built with Claude Code)** | | **~$58 (~₹4,850)** ✅ |

---

## 4. Payment Gateway — Razorpay Transaction Fees

Razorpay charges 2% per transaction (no monthly fee).

| Monthly GMV (Gross Revenue) | Razorpay Fee (2%) | Net to You |
|---|---|---|
| ₹50,000 | ₹1,000 | ₹49,000 |
| ₹1,00,000 | ₹2,000 | ₹98,000 |
| ₹5,00,000 | ₹10,000 | ₹4,90,000 |
| ₹10,00,000 | ₹20,000 | ₹9,80,000 |

> At ₹5L+ monthly volume, negotiate custom rates with Razorpay — typically drops to 1.5% or lower.

---

## 5. Scaling Cost Estimate by User Count

| Users | Monthly Infrastructure | Payment Fees (est.) | Total Monthly Burn |
|---|---|---|---|
| 0–50 | ₹0 (free tier) | ₹0 | **₹0** |
| 50–500 | ₹2,200 | ₹1,000–5,000 | **₹3,200–7,200** |
| 500–2,000 | ₹8,000 | ₹5,000–20,000 | **₹13,000–28,000** |
| 2,000–10,000 | ₹25,000 | ₹20,000–1,00,000 | **₹45,000–1,25,000** |

---

## 6. Revenue Model

| Stream | Rate | Example (500 active users) |
|---|---|---|
| Training fee commission (platform %) | 5–10% of enrollment | ₹25,000–50,000/month |
| Transport fee margin | ₹5–8/km profit margin | ₹15,000–30,000/month |
| Academy listing (premium) | ₹2,000–5,000/academy/month | ₹10,000–25,000/month |
| **Estimated Monthly Revenue** | | **₹50,000–1,05,000** |

---

## 7. Break-Even Analysis

| Scenario | Monthly Cost | Monthly Revenue | Break-Even Users |
|---|---|---|---|
| Conservative | ₹7,000 | ₹100/user | ~70 active users |
| Moderate | ₹15,000 | ₹150/user | ~100 active users |
| Optimistic | ₹25,000 | ₹200/user | ~125 active users |

---

## 8. 12-Month Budget Projection (Startup Plan)

| Month | Key Milestone | One-Time Cost | Monthly Recurring | Cumulative Spend |
|---|---|---|---|---|
| Month 1 | Launch beta, free tier | ₹15,000 (setup) | ₹0 | ₹15,000 |
| Month 2–3 | 50 beta users, upgrade Render | ₹0 | ₹2,500/mo | ₹20,000 |
| Month 4–6 | 200 users, SMS OTP live | ₹0 | ₹3,500/mo | ₹30,500 |
| Month 7–9 | 500 users, iOS app | ₹8,300 (App Store) | ₹5,000/mo | ₹53,800 |
| Month 10–12 | 1,000+ users, growth infra | ₹0 | ₹12,000/mo | ₹89,800 |
| **Year 1 Total** | | | | **~₹90,000** |

---

## 9. Cost Reduction Tips

| Tip | Saving |
|---|---|
| Use OpenStreetMap instead of Google Maps | Saves ₹5,000–15,000/month at scale |
| Use Gmail SMTP until 500+ users | Saves ₹1,668/month vs SendGrid |
| Free Expo EAS until stable releases | Saves ₹8,280/month |
| Use Render free tier for 90 days | Saves ₹2,500 during beta |
| Negotiate Razorpay rates at ₹5L+ GMV | Saves 0.5% = ₹2,500/month per ₹5L |
| Firebase FCM for push (always free) | Saves vs paid push providers |

---

## 10. Current Stack Cost Summary

| Component | Technology | Current Cost |
|---|---|---|
| Mobile App | React Native + Expo | ₹0 (open source) |
| API Server | Fastify + Node.js | ₹0 (open source) |
| Database | PostgreSQL on Render | ₹0 (free tier) |
| Cache | Redis on Render | ₹0 (free tier) |
| Maps | OpenStreetMap + Leaflet | ₹0 (free forever) |
| Push Notifications | Firebase FCM | ₹0 (free tier) |
| Payments | Razorpay | 2% per transaction |
| OTP | Gmail SMTP (stubbed) | ₹0 |
| Build System | Expo EAS | ₹0 (free tier) |
| AI Development | Claude Code | ~₹4,850 (total so far) |
| **Total Monthly** | | **₹0 (free tier)** |
| **Total to Date** | | **~₹4,850** |
