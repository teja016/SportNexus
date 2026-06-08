"""
SportNexus Investor Pitch — Clean Dark Design 2025
Palette: near-black base · indigo primary · emerald accent · clean typography
"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from lxml import etree

# ── Palette (clean, disciplined) ─────────────────────────────────────────────
BG     = RGBColor(0x06, 0x07, 0x0E)   # near black
CARD   = RGBColor(0x0D, 0x14, 0x22)   # card dark
CARD2  = RGBColor(0x13, 0x1D, 0x30)   # card alt / hover
BORD   = RGBColor(0x1A, 0x27, 0x40)   # border subtle
IND    = RGBColor(0x63, 0x66, 0xF1)   # indigo-500  (primary)
IND2   = RGBColor(0x81, 0x8C, 0xF8)   # indigo-400  (lighter)
IND_DK = RGBColor(0x1E, 0x1B, 0x4B)   # indigo-950  (bg tint)
EMR    = RGBColor(0x10, 0xB9, 0x81)   # emerald-500 (positive)
EMR2   = RGBColor(0x34, 0xD3, 0x99)   # emerald-400
AMB    = RGBColor(0xF5, 0x9E, 0x0B)   # amber-500   (cost/warn)
ROSE   = RGBColor(0xF4, 0x3F, 0x5E)   # rose-500    (negative)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
SL     = RGBColor(0x94, 0xA3, 0xB8)   # slate-400   (body text)
SL2    = RGBColor(0x47, 0x5A, 0x6E)   # slate-600   (muted)

W, H = Inches(13.33), Inches(7.5)
prs = Presentation()
prs.slide_width, prs.slide_height = W, H
BLANK = prs.slide_layouts[6]

# ── XML Utilities ─────────────────────────────────────────────────────────────
def hx(c): return str(c)   # RGBColor.__str__ → 'RRGGBB'
def rc(c): return int(hx(c)[0:2], 16)
def gc(c): return int(hx(c)[2:4], 16)
def bc(c): return int(hx(c)[4:6], 16)
def dimc(c, f): return RGBColor(int(rc(c)*f), int(gc(c)*f), int(bc(c)*f))

def bg_grad(slide, c1, c2, ang=160):
    sld = slide._element; cSld = sld.find(qn('p:cSld'))
    old = cSld.find(qn('p:bg'))
    if old is not None: cSld.remove(old)
    bg = etree.Element(qn('p:bg'))
    bgPr = etree.SubElement(bg, qn('p:bgPr'))
    gf = etree.SubElement(bgPr, qn('a:gradFill'))
    gl = etree.SubElement(gf, qn('a:gsLst'))
    for pos, c in [(0, c1), (100000, c2)]:
        gs = etree.SubElement(gl, qn('a:gs')); gs.set('pos', str(pos))
        etree.SubElement(gs, qn('a:srgbClr')).set('val', hx(c))
    li = etree.SubElement(gf, qn('a:lin')); li.set('ang', str(ang*60000)); li.set('scaled','0')
    etree.SubElement(bgPr, qn('a:effectLst'))
    spt = cSld.find(qn('p:spTree')); cSld.insert(list(cSld).index(spt), bg)

def sh_grad(shape, c1, c2, ang=0):
    sp = shape._element; spPr = sp.find(qn('p:spPr'))
    for tag in [qn('a:solidFill'), qn('a:gradFill'), qn('a:noFill'), qn('a:pattFill')]:
        el = spPr.find(tag)
        if el is not None: spPr.remove(el)
    gf = etree.Element(qn('a:gradFill'))
    gl = etree.SubElement(gf, qn('a:gsLst'))
    for pos, c in [(0, c1), (100000, c2)]:
        gs = etree.SubElement(gl, qn('a:gs')); gs.set('pos', str(pos))
        etree.SubElement(gs, qn('a:srgbClr')).set('val', hx(c))
    li = etree.SubElement(gf, qn('a:lin')); li.set('ang', str(ang*60000)); li.set('scaled','0')
    pg = spPr.find(qn('a:prstGeom'))
    if pg is not None: spPr.insert(list(spPr).index(pg), gf)
    else: spPr.append(gf)

def fade_tr(slide):
    sld = slide._element; old = sld.find(qn('p:transition'))
    if old is not None: sld.remove(old)
    tr = etree.SubElement(sld, qn('p:transition')); tr.set('spd','med')
    etree.SubElement(tr, qn('p:fade'))

# ── Primitives ────────────────────────────────────────────────────────────────
def rect(sl, x, y, w, h, fill, border=None, bw=0.5):
    s = sl.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = fill
    if border: s.line.color.rgb = border; s.line.width = Pt(bw)
    else: s.line.fill.background()
    return s

def text(sl, txt, x, y, w, h, sz, bold=False, col=WHITE, align=PP_ALIGN.LEFT, italic=False):
    txb = sl.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = txb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = align
    r = p.add_run(); r.text = txt; r.font.size = Pt(sz)
    r.font.bold = bold; r.font.italic = italic; r.font.color.rgb = col
    return txb

def para(tf, txt, sz, bold=False, col=WHITE, align=PP_ALIGN.LEFT, spc=0):
    p = tf.add_paragraph(); p.alignment = align; p.space_before = Pt(spc)
    r = p.add_run(); r.text = txt; r.font.size = Pt(sz)
    r.font.bold = bold; r.font.color.rgb = col; return p

# ── Compound Components ───────────────────────────────────────────────────────
def accent_line(sl, y, c1=IND, c2=EMR):
    """Full-width gradient accent line."""
    s = rect(sl, 0, y, 13.33, 0.05, c1); sh_grad(s, c1, c2, ang=0)

def card(sl, x, y, w, h, left_accent=None):
    """Clean dark card with optional left accent stripe."""
    rect(sl, x, y, w, h, CARD, border=BORD, bw=0.75)
    if left_accent:
        rect(sl, x, y, 0.055, h, left_accent)

def header(sl, title, sub=None):
    """Minimal header: dark bar + gradient accent line."""
    rect(sl, 0, 0, 13.33, 1.2, CARD)
    accent_line(sl, 1.2)
    # Indigo left glow bar
    s = rect(sl, 0, 0, 0.32, 1.2, IND_DK); sh_grad(s, IND_DK, CARD, ang=0)
    rect(sl, 0, 0, 0.045, 1.2, IND)
    text(sl, title, 0.5, 0.1, 11, 0.68, 28, bold=True, col=WHITE)
    if sub: text(sl, sub, 0.5, 0.72, 11, 0.4, 12, col=SL)

def stat_card(sl, x, y, w, h, val, lbl, accent=IND):
    """Metric card with large value + label."""
    card(sl, x, y, w, h, left_accent=accent)
    # Accent tint bar at top
    s = rect(sl, x + 0.055, y, w - 0.055, 0.045, dimc(accent, 0.35))
    text(sl, val, x, y + 0.08, w, h * 0.52, 24, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
    text(sl, lbl, x, y + h * 0.58, w, h * 0.38, 9.5, col=SL, align=PP_ALIGN.CENTER)

def tag(sl, txt_, x, y, col=IND):
    """Small colored tag pill."""
    s = rect(sl, x, y, 1.15, 0.3, dimc(col, 0.2), border=col, bw=0.5)
    text(sl, txt_, x, y + 0.04, 1.15, 0.24, 9, bold=True, col=col, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — TITLE
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, RGBColor(0x08, 0x0C, 0x1A), ang=150)
fade_tr(sl)

# Subtle indigo glow panel (left)
s = rect(sl, 0, 0, 5.6, 7.5, IND_DK); sh_grad(s, IND_DK, BG, ang=0)
rect(sl, 0, 0, 0.055, 7.5, IND)                     # left accent bar
accent_line(sl, 7.44)                                 # bottom accent
# Subtle top accent
a = rect(sl, 0, 0, 5.6, 0.055, IND); sh_grad(a, IND, EMR, ang=0)

# Logo block
text(sl, "🏆", 1.5, 0.9, 2.6, 1.3, 66, align=PP_ALIGN.CENTER)
text(sl, "SportNexus", 0.25, 2.15, 5.1, 0.9, 42, bold=True, col=WHITE, align=PP_ALIGN.CENTER)

# Underline bar
s = rect(sl, 0.7, 3.04, 4.2, 0.045, IND); sh_grad(s, IND, EMR, ang=0)

text(sl, "Sports Academy Booking Platform", 0.25, 3.12, 5.1, 0.5, 13, col=SL, align=PP_ALIGN.CENTER)
text(sl, "Investor Pitch  ·  2025  ·  Confidential", 0.25, 3.6, 5.1, 0.38, 10.5, col=SL2, align=PP_ALIGN.CENTER, italic=True)

# Tags row
tag(sl, "Android + iOS", 0.55, 4.1, IND)
tag(sl, "500+ Users",    1.82, 4.1, EMR)
tag(sl, "Seed Stage",    3.09, 4.1, AMB)

# Right: feature cards
text(sl, "Platform Features", 5.85, 0.28, 7.0, 0.6, 20, bold=True, col=WHITE)
s = rect(sl, 5.85, 0.88, 2.0, 0.04, IND); sh_grad(s, IND, EMR, ang=0)

features = [
    ("📱", "Cross-Platform App",    "React Native + Expo SDK 52",              IND),
    ("⚡", "Production REST API",   "Fastify · Socket.IO · BullMQ",            IND2),
    ("🗄️",  "Cloud DB & Cache",     "PostgreSQL + Redis — paid plans",         EMR),
    ("💳", "Payment Gateway",       "Razorpay UPI QR + Webhooks",              EMR2),
    ("🗺️",  "Live GPS Tracking",    "OpenStreetMap + WebView + Socket.IO",     AMB),
    ("🔔", "Push Notifications",    "Firebase FCM · Daily scheduling",          AMB),
]
for i, (icon, ftitle, fsub, fcol) in enumerate(features):
    fy = 1.04 + i * 1.05
    card(sl, 5.75, fy, 7.3, 0.9, left_accent=fcol)
    text(sl, icon,   5.9,  fy + 0.2, 0.65, 0.55, 20, align=PP_ALIGN.CENTER)
    text(sl, ftitle, 6.65, fy + 0.1, 6.2,  0.36, 12, bold=True, col=WHITE)
    text(sl, fsub,   6.65, fy + 0.46, 6.2, 0.34, 9.5, col=SL)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — DEVELOPMENT COST
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=155)
fade_tr(sl)
header(sl, "Development Cost", "What it cost to build SportNexus end-to-end")

# Decorative large dim text
text(sl, "₹", 7.8, 0.6, 5.5, 5.8, 200, bold=True, col=RGBColor(0x0C, 0x10, 0x20), align=PP_ALIGN.CENTER)

# Hero highlight
hc = rect(sl, 0.4, 1.42, 12.53, 1.28, CARD2, border=IND, bw=0.75)
rect(sl, 0.4, 1.42, 0.055, 1.28, IND)
text(sl, "🏗️  Built by a Dedicated Development Team", 0.6, 1.52, 8.4, 0.48, 15, bold=True, col=WHITE)
text(sl, "Delivered in 4 months  ·  Full-stack startup team  ·  Equiv. agency cost: ₹8–20 Lakhs", 0.6, 2.0, 8.4, 0.42, 11.5, col=SL)

# Big cost number
s = rect(sl, 9.6, 1.48, 3.1, 1.16, dimc(IND, 0.15), border=IND, bw=0.75)
text(sl, "₹7,00,000", 9.6, 1.58, 3.1, 0.7, 28, bold=True, col=IND2, align=PP_ALIGN.CENTER)
text(sl, "TEAM BUILD COST", 9.6, 2.26, 3.1, 0.3, 8.5, col=SL, align=PP_ALIGN.CENTER)

# Table header
th = rect(sl, 0.4, 2.9, 12.53, 0.4, IND_DK)
for lbl, xp, wd in [("Role / Component", 0.55, 3.6), ("Traditional Agency", 4.3, 2.5), ("Freelancer", 7.0, 2.1), ("Our Team Cost", 9.3, 3.5)]:
    text(sl, lbl, xp, 2.96, wd, 0.3, 10, bold=True, col=IND2)

rows = [
    ("Full-Stack API Development",  "₹2,50,000",  "₹80,000",   "₹2,20,000"),
    ("React Native Mobile App",     "₹3,00,000",  "₹1,20,000", "₹2,40,000"),
    ("Admin Dashboard (Next.js)",   "₹1,00,000",  "₹40,000",   "₹75,000"),
    ("Database Schema & Seed Data", "₹50,000",    "₹20,000",   "₹35,000"),
    ("DevOps / Infra Setup",        "₹80,000",    "₹30,000",   "₹50,000"),
    ("UI/UX Design & Theming",      "₹1,20,000",  "₹50,000",   "₹80,000"),
    ("TOTAL",                       "₹9,00,000+", "₹3,40,000+","₹7,00,000"),
]
for i, (role, agency, free, team) in enumerate(rows):
    ry = 3.38 + i * 0.485
    is_tot = role == "TOTAL"
    bg_ = dimc(IND, 0.18) if is_tot else (CARD2 if i % 2 == 0 else CARD)
    rect(sl, 0.4, ry, 12.53, 0.46, bg_)
    if is_tot: rect(sl, 0.4, ry, 0.055, 0.46, IND)
    text(sl, role,   0.55, ry+0.1, 3.6, 0.3, 10, bold=is_tot, col=WHITE if is_tot else WHITE)
    text(sl, agency, 4.3,  ry+0.1, 2.4, 0.3, 10, col=SL2 if not is_tot else SL, align=PP_ALIGN.CENTER)
    text(sl, free,   7.0,  ry+0.1, 2.1, 0.3, 10, col=SL2 if not is_tot else SL, align=PP_ALIGN.CENTER)
    text(sl, team,   9.3,  ry+0.1, 3.5, 0.3, 10, bold=True, col=EMR if is_tot else IND2, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — TECH STACK
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=145)
fade_tr(sl)
header(sl, "Technology Stack", "Production-grade, open-source first — zero core licensing fees")

layer_data = [
    ("📱", "Mobile Layer",  IND,  ["React Native 0.76 + Expo SDK 52", "Zustand + React Query v5", "Socket.IO client · live transit", "OpenStreetMap + Leaflet"]),
    ("⚡", "API Layer",     IND2, ["Fastify (Node.js) REST + WebSocket", "BullMQ job queue · slot expiry", "Socket.IO server · transit rooms", "Zod validation + JWT RBAC"]),
    ("🗄️",  "Data Layer",  EMR,  ["PostgreSQL 16 via Prisma ORM", "Redis 7 — caching + queues", "10 tables · 4 enums · 15+ indexes", "Automated daily backups"]),
    ("☁️",  "Cloud Layer",  AMB,  ["Render.com — API + DB + Redis", "Firebase FCM push notifications", "Razorpay — UPI + QR + webhooks", "Expo EAS — APK / AAB builds"]),
]
for i, (icon, lyr_title, col_, items) in enumerate(layer_data):
    cx = 0.35 + i * 3.25
    card(sl, cx, 1.42, 3.05, 5.18, left_accent=col_)
    # Header
    s = rect(sl, cx + 0.055, 1.42, 2.995, 0.62, dimc(col_, 0.18))
    text(sl, icon,      cx + 0.18, 1.5,  0.65, 0.46, 22, align=PP_ALIGN.CENTER)
    text(sl, lyr_title, cx + 0.9,  1.54, 2.0,  0.34, 12, bold=True, col=WHITE)
    # Divider
    s = rect(sl, cx + 0.055, 2.04, 2.995, 0.04, BORD)
    for j, item in enumerate(items):
        iy = 2.18 + j * 1.06
        # Bullet dot
        s = rect(sl, cx + 0.18, iy + 0.12, 0.09, 0.09, col_)
        text(sl, item, cx + 0.35, iy + 0.03, 2.6, 0.55, 10, col=WHITE)
        if j < 3:
            rect(sl, cx + 0.18, iy + 0.82, 2.6, 0.018, BORD)

# Cost pills row
accent_line(sl, 6.72)
callouts = [
    ("₹2,090/mo", "API Server"),
    ("₹1,670/mo", "PostgreSQL"),
    ("₹2,510/mo", "Redis Cache"),
    ("₹1,500/mo", "Firebase FCM"),
    ("2% / txn",  "Razorpay"),
    ("₹1,668/mo", "SendGrid"),
]
for i, (val_, lbl_) in enumerate(callouts):
    cx = 0.35 + i * 2.16
    s = rect(sl, cx, 6.78, 2.06, 0.58, CARD2, border=BORD)
    text(sl, val_, cx, 6.82, 2.06, 0.3, 12, bold=True, col=IND2, align=PP_ALIGN.CENTER)
    text(sl, lbl_, cx, 7.08, 2.06, 0.24, 9, col=SL, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — INFRASTRUCTURE COST
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=150)
fade_tr(sl)
header(sl, "Infrastructure Cost at 500+ Users", "Monthly recurring — paid production plans + maintenance & support")

stat_card(sl, 0.35,  1.42, 3.02, 1.42, "₹30,700",  "Total Monthly (All-In)",      IND)
stat_card(sl, 3.57,  1.42, 3.02, 1.42, "₹13,700",  "Cloud Infrastructure",         IND2)
stat_card(sl, 6.79,  1.42, 3.02, 1.42, "₹12,000",  "App Maintenance & Updates",    EMR)
stat_card(sl, 10.01, 1.42, 3.02, 1.42, "₹5,000",   "Application Support & Ops",    AMB)

# Table
th = rect(sl, 0.35, 3.05, 12.63, 0.4, IND_DK)
for lbl, xp, wd in [("Service", 0.5, 2.95), ("Plan", 3.6, 1.9), ("Monthly Cost", 5.65, 2.1), ("Coverage", 7.9, 5.0)]:
    text(sl, lbl, xp, 3.11, wd, 0.3, 10, bold=True, col=IND2)

infra = [
    ("Render — API Server",    "Standard ($25)",   "₹2,090 / mo", "Always-on Node.js · 1 GB RAM · no cold starts",           IND),
    ("Render — PostgreSQL",    "Standard ($20)",   "₹1,670 / mo", "4 GB storage · automated daily backups · HA",             IND),
    ("Render — Redis",         "Standard ($30)",   "₹2,510 / mo", "100 MB persistent · BullMQ queues + API caching",         IND),
    ("Firebase",               "Blaze pay-as-go",  "₹1,500 / mo", "FCM push + Analytics + Crashlytics",                      IND2),
    ("Razorpay",               "Pay-per-use",       "2% / txn",    "UPI · QR code · webhooks — no fixed monthly base fee",    AMB),
    ("MSG91 SMS OTP",          "Business Plan",     "₹1,500 / mo", "~10,000 OTPs / month · DLT registered",                  AMB),
    ("SendGrid (Email)",       "Essentials $19.95", "₹1,668 / mo", "50,000 emails / month · delivery analytics",             IND2),
    ("Cloudinary (Media CDN)", "Plus $89",          "₹1,500 / mo", "225 GB storage + CDN · image optimisation",              IND2),
    ("Sentry (Monitoring)",    "Team $26",          "₹2,175 / mo", "50,000 errors / month · alerts · perf tracing",          IND),
    ("Domain + SSL",           "Annual",            "₹85 / mo",    "sportnexus.com + Let's Encrypt (auto-renew)",             SL),
    ("App Maintenance",        "Monthly retainer",  "₹12,000 / mo","Bug fixes · OS updates · dependency upgrades · patches",  EMR),
    ("Application Support",    "Monthly retainer",  "₹5,000 / mo", "Helpdesk · on-call monitoring · SLA · monthly reports",  EMR),
]
for i, (svc, plan, cost, desc, col_) in enumerate(infra):
    ry = 3.55 + i * 0.285
    rect(sl, 0.35, ry, 12.63, 0.28, CARD2 if i % 2 == 0 else CARD)
    rect(sl, 0.35, ry, 0.055, 0.28, col_)
    text(sl, svc,  0.5,  ry+0.04, 2.95, 0.22, 9,   col=WHITE)
    text(sl, plan, 3.6,  ry+0.04, 1.88, 0.22, 8.5, col=SL2, align=PP_ALIGN.CENTER)
    text(sl, cost, 5.65, ry+0.04, 2.1,  0.22, 9,   bold=True, col=col_, align=PP_ALIGN.CENTER)
    text(sl, desc, 7.9,  ry+0.04, 4.95, 0.22, 8,   col=SL)

ty = 3.55 + len(infra) * 0.285
s = rect(sl, 0.35, ty, 12.63, 0.4, IND_DK); sh_grad(s, IND_DK, dimc(EMR, 0.25), ang=0)
text(sl, "TOTAL  (Cloud ₹13,700 + Maintenance ₹12,000 + Support ₹5,000)", 0.5, ty+0.08, 7.6, 0.28, 11, bold=True, col=WHITE)
text(sl, "~₹30,700 / month", 9.0, ty+0.08, 3.8, 0.28, 13, bold=True, col=EMR2, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — REVENUE MODEL
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=148)
fade_tr(sl)
header(sl, "Revenue Model & Unit Economics", "Multiple streams — platform earns without owning inventory")

# 4 revenue stream cards
streams = [
    ("🎓", "Training Fee\nCommission",    "5–10%",  "per enrollment",  "₹50–300 per user/month",      IND),
    ("🚌", "Transport\nFee Margin",       "₹5–8",   "per km profit",   "₹25/km charged to families",  IND2),
    ("⭐", "Academy\nPremium Listing",    "₹2–5K",  "per academy/mo",  "Featured · Verified badge",    EMR),
    ("📊", "Analytics\nDashboard",        "₹500–1.5K","per academy/mo","Revenue reports & insights",   AMB),
]
for i, (icon, stitle, rate, unit, note, col_) in enumerate(streams):
    cx = 0.4 + i * 3.22
    card(sl, cx, 1.42, 3.05, 3.05, left_accent=col_)
    s = rect(sl, cx + 0.055, 1.42, 2.995, 0.05, dimc(col_, 0.5))
    text(sl, icon,   cx + 0.15, 1.5,  2.75, 0.65, 30, align=PP_ALIGN.CENTER)
    text(sl, stitle, cx + 0.15, 2.12, 2.75, 0.6,  13, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
    rect(sl, cx + 0.9, 2.75, 1.25, 0.04, BORD)
    text(sl, rate,   cx + 0.15, 2.82, 2.75, 0.48, 22, bold=True, col=col_, align=PP_ALIGN.CENTER)
    text(sl, unit,   cx + 0.15, 3.28, 2.75, 0.28,  9, col=SL,   align=PP_ALIGN.CENTER)
    text(sl, note,   cx + 0.15, 3.62, 2.75, 0.72,  9, col=SL2,  align=PP_ALIGN.CENTER)

# Unit economics
accent_line(sl, 4.62)
text(sl, "Unit Economics at 500 Active Users", 0.4, 4.72, 8.0, 0.38, 13, bold=True, col=WHITE)
text(sl, "Monthly",  9.2, 4.72, 1.95, 0.38, 10, bold=True, col=SL, align=PP_ALIGN.CENTER)
text(sl, "Annual",  11.2, 4.72, 1.6,  0.38, 10, bold=True, col=SL, align=PP_ALIGN.CENTER)

econ = [
    ("Training commission (500 users × ₹150 avg)",       "₹75,000",    "₹9,00,000",   EMR),
    ("Transport margin  (200 transport users × ₹400)",   "₹80,000",    "₹9,60,000",   EMR),
    ("Academy premium listings  (6 × ₹3,000)",           "₹18,000",    "₹2,16,000",   EMR),
    ("Gross Revenue",                                      "₹1,73,000",  "₹20,76,000",  IND2),
    ("Cloud infrastructure",                               "- ₹13,700",  "- ₹1,64,400", ROSE),
    ("App maintenance + support",                          "- ₹17,000",  "- ₹2,04,000", ROSE),
    ("Razorpay fees  (2% of ₹1,55,000 GMV)",             "- ₹3,100",   "- ₹37,200",   AMB),
    ("Net Profit",                                         "₹1,39,200",  "₹16,70,400",  EMR2),
]
for i, (lbl, mon, ann, col_) in enumerate(econ):
    ry = 5.2 + i * 0.285
    is_key = lbl in ("Gross Revenue", "Net Profit")
    bg_ = dimc(col_, 0.12) if is_key else (CARD2 if i % 2 == 0 else CARD)
    rect(sl, 0.4, ry, 12.53, 0.28, bg_)
    rect(sl, 0.4, ry, 0.055, 0.28, col_)
    text(sl, lbl, 0.55, ry+0.04, 8.5, 0.22, 9.5, bold=is_key, col=WHITE)
    text(sl, mon, 9.2,  ry+0.04, 1.95, 0.22, 9.5, bold=True, col=col_, align=PP_ALIGN.CENTER)
    text(sl, ann, 11.2, ry+0.04, 1.6,  0.22, 9.5, bold=True, col=col_, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — 12-MONTH PROJECTION
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=145)
fade_tr(sl)
header(sl, "12-Month Financial Projection", "Growth roadmap from zero to 500+ users")

months = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"]
rev_d  = [0, 0, 0, 5000, 15000, 28000, 45000, 68000, 95000, 130000, 155000, 173000]
cost_d = [15000,15000,18000,20000,22000,24000,26000,27000,28000,29000,30000,30700]

cx, cy, cw, ch = 0.4, 1.48, 8.3, 4.9
rect(sl, cx, cy, cw, ch, CARD, border=BORD)
max_v = 200000
bw    = 0.54
gap   = (cw - len(months)*bw) / (len(months)+1)
for i, (m, rv, ct) in enumerate(zip(months, rev_d, cost_d)):
    bx = cx + gap + i*(bw+gap)
    rh = max((rv/max_v)*(ch-0.65), 0.04)
    s = rect(sl, bx, cy+ch-0.32-rh, bw*0.52, rh, IND); sh_grad(s, IND, IND2, ang=90)
    ch_ = max((ct/max_v)*(ch-0.65), 0.04)
    rect(sl, bx+bw*0.54, cy+ch-0.32-ch_, bw*0.43, ch_, dimc(ROSE, 0.7))
    text(sl, m, bx, cy+ch-0.28, bw, 0.24, 7.5, col=SL2, align=PP_ALIGN.CENTER)

text(sl, "Revenue vs Cost (₹)", cx+0.12, cy+0.1, 4, 0.28, 10, bold=True, col=WHITE)
rect(sl, cx+5.0, cy+0.14, 0.2, 0.16, IND)
text(sl, "Revenue", cx+5.28, cy+0.1, 1.3, 0.24, 9, col=SL)
rect(sl, cx+6.4, cy+0.14, 0.2, 0.16, dimc(ROSE, 0.7))
text(sl, "Cost",    cx+6.68, cy+0.1, 0.9, 0.24, 9, col=SL)

# Milestones
rect(sl, 8.85, 1.48, 4.13, 0.42, IND_DK)
text(sl, "Key Milestones", 9.0, 1.54, 3.9, 0.3, 12, bold=True, col=IND2)

milestones = [
    ("Month 1–2",  "Beta launch, free infra",       "₹0",         IND),
    ("Month 3",    "First 25 paying users",          "₹0",         SL),
    ("Month 4",    "60 users, Render upgrade",       "₹5,000/mo",  AMB),
    ("Month 6",    "150 users, SMS OTP live",        "₹28,000/mo", AMB),
    ("Month 8",    "280 users, iOS app",             "₹68,000/mo", EMR),
    ("Month 10",   "420 users, academy partnerships","₹1,30,000/mo",EMR),
    ("Month 12",   "550 users — BREAK-EVEN",        "₹1,73,000/mo",IND2),
]
for i, (per, desc, rv_s, col_) in enumerate(milestones):
    my = 2.0 + i * 0.57
    rect(sl, 8.85, my, 4.13, 0.55, CARD2 if i%2==0 else CARD)
    rect(sl, 8.85, my, 0.055, 0.55, col_)
    text(sl, per,   8.97, my+0.04, 1.35, 0.22, 8.5, bold=True, col=col_)
    text(sl, desc,  8.97, my+0.26, 2.8,  0.22, 8,   col=WHITE)
    text(sl, rv_s,  11.6, my+0.12, 1.3,  0.3,  9,   bold=True, col=col_, align=PP_ALIGN.CENTER)

s = rect(sl, 0.4, 6.52, 12.53, 0.72, IND_DK)
sh_grad(s, IND_DK, dimc(EMR, 0.2), ang=0)
text(sl, "🎯  Break-Even ~200 users  ·  Profitable from Month 9  ·  ₹16.7L projected annual profit at 500 users", 0.6, 6.66, 12.2, 0.44, 12, bold=True, col=WHITE, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — FUNDING ASK
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, RGBColor(0x08, 0x06, 0x18), ang=155)
fade_tr(sl)
accent_line(sl, 0)
accent_line(sl, 7.44)

text(sl, "The Ask", 0.5, 0.2, 12.33, 0.8, 40, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
s = rect(sl, 4.6, 1.04, 4.13, 0.05, IND); sh_grad(s, IND, EMR, ang=0)
text(sl, "Seed funding to scale SportNexus from 50 → 5,000 users across Hyderabad", 0.5, 1.12, 12.33, 0.45, 12.5, col=SL, align=PP_ALIGN.CENTER)

# Central ask
s = rect(sl, 3.5, 1.75, 6.33, 1.5, IND_DK, border=IND, bw=1.0)
rect(sl, 3.5, 1.75, 0.055, 1.5, IND)
text(sl, "₹25 – 50 Lakhs", 3.6, 1.86, 6.13, 0.82, 36, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
text(sl, "SEED ROUND  ·  18-MONTH RUNWAY", 3.6, 2.68, 6.13, 0.42, 11, col=SL, align=PP_ALIGN.CENTER)

# 4 use-of-funds
uof = [
    ("40%\n₹10–20L", "Engineering\n& Product",   "Senior React Native + Backend dev",   IND),
    ("25%\n₹6–12L",  "Sales &\nMarketing",        "Academy partnerships · campaigns",     IND2),
    ("20%\n₹5–10L",  "Infrastructure\nScale-Up",  "Render → AWS migration at 2,000+",    EMR),
    ("15%\n₹4–7L",   "Operations\n& Legal",       "Entity registration · CS support",     AMB),
]
for i, (pct, utitle, udesc, col_) in enumerate(uof):
    ux = 0.5 + i * 3.2
    card(sl, ux, 3.55, 3.05, 2.35, left_accent=col_)
    text(sl, pct,    ux + 0.15, 3.62, 2.75, 0.72, 22, bold=True, col=col_, align=PP_ALIGN.CENTER)
    rect(sl, ux + 0.85, 4.37, 1.35, 0.04, BORD)
    text(sl, utitle, ux + 0.15, 4.46, 2.75, 0.52, 12, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
    text(sl, udesc,  ux + 0.15, 4.98, 2.75, 0.76,  9, col=SL,   align=PP_ALIGN.CENTER)

# Returns
rect(sl, 0.5, 6.06, 12.33, 0.05, BORD)
returns = [
    ("12 months", "550+ users\n₹20L ARR"),
    ("18 months", "2,000+ users\n₹80L ARR"),
    ("24 months", "5,000+ users\n₹2Cr+ ARR"),
    ("36 months", "Series A ready\n₹5Cr+ ARR"),
]
for i, (per, val_) in enumerate(returns):
    rx = 0.5 + i * 3.15
    card(sl, rx, 6.18, 3.0, 1.08, left_accent=IND if i<2 else EMR)
    text(sl, per,   rx + 0.15, 6.24, 2.7, 0.3, 10, bold=True, col=SL)
    text(sl, val_,  rx + 0.15, 6.54, 2.7, 0.6, 13, bold=True, col=WHITE)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — COMPETITIVE ADVANTAGES
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, CARD, ang=148)
fade_tr(sl)
header(sl, "Why SportNexus Wins", "Competitive moat built into the product from day one")

advs = [
    ("🗺️",  "Zero Maps Cost",      "OpenStreetMap replaces Google Maps\nSaves ₹5,000–15,000/month vs competitors\nat 1,000+ users",      IND),
    ("⚡", "10-Min Slot Hold",     "Slot reserved during payment window only\nAuto-releases if unpaid · prevents overbooking\nGhost booking rate: 0%",  IND2),
    ("🚌", "Transport Tracking",   "Live GPS driver tracking via Socket.IO\nParents watch pickup in real-time\nUnique vs all local competitors",  EMR),
    ("💳", "QR-Based UPI Payments","Bank-approved QR scan flow\nNo collect request blocks (bank policy)\nSmooth checkout = higher conversion",   EMR2),
    ("📱", "Offline-First Mobile", "Cached data works without connectivity\nLocal enrollment store in AsyncStorage\nNo data loss on poor signal",  AMB),
    ("🏗️", "Lean Dev Team",        "Delivered in 4 months by startup team\n₹7L build cost vs ₹20L+ agency\nFast iteration cycle, no bloat",       IND),
]
accs = [IND, IND2, EMR, EMR2, AMB, IND]
for i, (icon, atitle, adesc, _) in enumerate(advs):
    ax = 0.4 + (i % 3) * 4.3
    ay = 1.42 + (i // 3) * 2.8
    col_ = accs[i]
    card(sl, ax, ay, 4.1, 2.62, left_accent=col_)
    # Icon area
    s = rect(sl, ax + 0.055, ay, 0.8, 2.62, dimc(col_, 0.08))
    text(sl, icon,   ax + 0.07,  ay + 0.82, 0.74, 0.55, 26, align=PP_ALIGN.CENTER)
    text(sl, atitle, ax + 0.95,  ay + 0.2,  3.05, 0.42, 13, bold=True, col=WHITE)
    rect(sl, ax + 0.95, ay + 0.65, 3.0, 0.04, BORD)
    text(sl, adesc,  ax + 0.95,  ay + 0.82, 3.0,  1.55, 9.5, col=SL)

s = rect(sl, 0.4, 6.98, 12.53, 0.38, IND_DK)
sh_grad(s, IND_DK, dimc(EMR, 0.25), ang=0)
text(sl, "All-in monthly cost ₹30,700 at 500 users  ·  Dev cost ₹7L vs ₹20L agency  ·  Break-even at ~200 users", 0.6, 7.05, 12.2, 0.28, 10, bold=True, col=WHITE, align=PP_ALIGN.CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(BLANK)
bg_grad(sl, BG, RGBColor(0x08, 0x07, 0x16), ang=155)
fade_tr(sl)
accent_line(sl, 0)

text(sl, "Summary", 0.5, 0.12, 12.33, 0.72, 38, bold=True, col=WHITE, align=PP_ALIGN.CENTER)
s = rect(sl, 5.0, 0.9, 3.33, 0.05, IND); sh_grad(s, IND, EMR, ang=0)
text(sl, "SportNexus at a glance — numbers that matter", 0.5, 0.98, 12.33, 0.4, 12, col=SL, align=PP_ALIGN.CENTER)

metrics = [
    ("₹7 Lakhs",     "Total development cost  (vs ₹8–20L traditional)",        IND),
    ("₹30,700 /mo",  "All-in monthly cost  (cloud + maintenance + support)",     IND2),
    ("₹13,700 /mo",  "Cloud infrastructure  (paid production plans)",            IND),
    ("₹17,000 /mo",  "App maintenance + application support retainer",           EMR),
    ("~200 users",   "Break-even point",                                          AMB),
    ("₹1,73,000 /mo","Projected revenue at 500 active users",                    EMR2),
    ("₹16.7 Lakhs",  "Projected annual net profit at 500 users",                 EMR),
    ("2% / txn",     "Razorpay fee — only when revenue flows in",                 AMB),
]
for i, (val_, lbl_, col_) in enumerate(metrics):
    col_i = i % 2
    xbase = 0.5 if col_i == 0 else 6.85
    ry = 1.5 + (i // 2) * 1.38
    # Value pill
    vp = rect(sl, xbase, ry, 2.5, 1.1, dimc(col_, 0.16), border=col_, bw=0.75)
    rect(sl, xbase, ry, 0.055, 1.1, col_)
    text(sl, val_, xbase, ry + 0.28, 2.5, 0.55, 16, bold=True, col=col_, align=PP_ALIGN.CENTER)
    # Label
    lc = rect(sl, xbase + 2.6, ry, 3.65, 1.1, CARD, border=BORD)
    text(sl, lbl_, xbase + 2.72, ry + 0.35, 3.42, 0.42, 11, col=WHITE)

accent_line(sl, 7.25)
text(sl, "SportNexus  ·  Built Lean. Designed to Scale.", 0.5, 7.32, 12.33, 0.3, 12, col=SL2, italic=True, align=PP_ALIGN.CENTER)

# ── Save ──────────────────────────────────────────────────────────────────────
out = r"C:\Teja\SportNexus\docs\SportNexus_Investor_Pitch.pptx"
prs.save(out)
print(f"Saved: {out}")
