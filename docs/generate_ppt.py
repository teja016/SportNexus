from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# ── Palette ──────────────────────────────────────────────────────────────────
TEAL      = RGBColor(0x0D, 0x94, 0x88)
NAVY      = RGBColor(0x1E, 0x3A, 0x5F)
D_NAVY    = RGBColor(0x0D, 0x1F, 0x3C)
GREEN     = RGBColor(0x10, 0xB9, 0x81)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
LGRAY     = RGBColor(0xF1, 0xF5, 0xF9)
DTEXT     = RGBColor(0x1F, 0x29, 0x37)
MUTED     = RGBColor(0x6B, 0x72, 0x80)
AMBER     = RGBColor(0xF5, 0x9E, 0x0B)
YELLOW    = RGBColor(0xFB, 0xBF, 0x24)
INDIGO    = RGBColor(0x63, 0x66, 0xF1)
RED       = RGBColor(0xEF, 0x44, 0x44)
SLATE     = RGBColor(0x47, 0x56, 0x69)
BORDER    = RGBColor(0xE2, 0xE8, 0xF0)
PURPLE    = RGBColor(0x7C, 0x3A, 0xED)
TEAL_DIM  = RGBColor(0x0D, 0x40, 0x3C)
TEAL_DIM2 = RGBColor(0x0D, 0x35, 0x32)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

# ── Helpers ───────────────────────────────────────────────────────────────────

def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])

def rect(slide, l, t, w, h, fill=None, lc=None, lw=0.5):
    s = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    if fill:
        s.fill.solid(); s.fill.fore_color.rgb = fill
    else:
        s.fill.background()
    if lc:
        s.line.color.rgb = lc; s.line.width = Pt(lw)
    else:
        s.line.fill.background()
    return s

def oval(slide, l, t, w, h, fill):
    s = slide.shapes.add_shape(9, Inches(l), Inches(t), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = fill
    s.line.fill.background()
    return s

def txt(slide, text, l, t, w, h, sz=11, bold=False, color=DTEXT,
        align=PP_ALIGN.LEFT, italic=False, font='Calibri'):
    box = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = align
    r = p.add_run()
    r.text = text; r.font.size = Pt(sz); r.font.bold = bold
    r.font.color.rgb = color; r.font.italic = italic; r.font.name = font
    return box

def header(slide, title, sub=None):
    rect(slide, 0, 0, 13.33, 1.05, fill=NAVY)
    rect(slide, 0, 1.05, 0.07, 6.45, fill=TEAL)
    txt(slide, title, 0.28, 0.12, 10, 0.55, sz=24, bold=True, color=WHITE, font='Calibri')
    if sub:
        txt(slide, sub, 0.28, 0.65, 10, 0.34, sz=11, color=RGBColor(0x9B,0xC8,0xC4))

def card(slide, l, t, w, h, accent=TEAL):
    rect(slide, l, t, w, h, fill=WHITE, lc=BORDER, lw=0.4)
    rect(slide, l, t, w, 0.06, fill=accent)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — COVER
# ═══════════════════════════════════════════════════════════════════════════════
def s_cover(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=D_NAVY)
    rect(sl, 0, 0, 0.55, 7.5, fill=TEAL)
    oval(sl, 9.3, -1.2, 4.8, 4.8, fill=TEAL_DIM)
    oval(sl, 10.2, 4.6, 3.5, 3.5, fill=TEAL_DIM2)

    rect(sl, 0.9, 1.15, 2.5, 0.44, fill=TEAL)
    txt(sl, 'SPORTNEXUS', 0.95, 1.2, 2.4, 0.36, sz=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    txt(sl, 'Development', 0.9, 1.85, 9, 1.0, sz=50, bold=True, color=WHITE, font='Calibri Light')
    txt(sl, 'Investment Proposal', 0.9, 2.72, 10, 1.0, sz=50, bold=True, color=TEAL, font='Calibri Light')

    txt(sl, 'Production-Ready  ·  Sports Academy Booking Platform  ·  iOS & Android', 0.9, 3.85, 10, 0.45, sz=14, color=RGBColor(0x9B,0xC0,0xD0))

    rect(sl, 0.9, 4.5, 5.5, 0.05, fill=TEAL)

    txt(sl, '₹ 25,00,000', 0.9, 4.7, 7, 0.85, sz=40, bold=True, color=YELLOW, font='Calibri')
    txt(sl, 'Total Investment  ·  6 Months Delivery  ·  7-Member Expert Team', 0.9, 5.52, 9, 0.4, sz=12, color=RGBColor(0x9B,0xC0,0xD0))

    txt(sl, 'Prepared: April 2026', 0.9, 6.65, 5, 0.38, sz=10, color=RGBColor(0x55,0x70,0x80), italic=True)
    txt(sl, 'Confidential  ·  For Internal Use Only', 7.5, 6.65, 5.5, 0.38, sz=10, color=RGBColor(0x45,0x60,0x70), align=PP_ALIGN.RIGHT, italic=True)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
def s_exec(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Executive Summary', 'SportNexus Platform at a Glance')

    kpis = [
        ('₹25,00,000', 'Total Investment',        TEAL,  '💰'),
        ('6 Months',   'End-to-End Delivery',     NAVY,  '📅'),
        ('7 Experts',  'Dedicated Team',           GREEN, '👥'),
        ('3 Products', 'Mobile · API · Admin',     AMBER, '🚀'),
    ]
    for i, (v, l, c, ic) in enumerate(kpis):
        x = 0.38 + i * 3.22
        card(sl, x, 1.2, 3.0, 1.55, c)
        txt(sl, ic, x+0.18, 1.32, 0.55, 0.48, sz=20)
        txt(sl, v,  x+0.18, 1.82, 2.7, 0.48, sz=20, bold=True, color=c)
        txt(sl, l,  x+0.18, 2.27, 2.7, 0.34, sz=10, color=MUTED)

    card(sl, 0.38, 3.0, 12.56, 4.18)
    rect(sl, 0.38, 3.0, 0.07, 4.18, fill=TEAL)
    txt(sl, 'Project Overview', 0.62, 3.1, 12, 0.4, sz=13, bold=True, color=NAVY)

    pts = [
        '•   SportNexus is a production-grade sports academy booking platform enabling parents and students to discover, enroll, pay, and track training — all from a mobile app.',
        '•   Comprises a React Native mobile app (iOS + Android), a Fastify REST API with PostgreSQL/Redis/Socket.IO, and a Next.js admin dashboard — three integrated products.',
        '•   Core capabilities: GPS-based academy discovery, Razorpay online payments, live transport tracking, Firebase push notifications, admin analytics, and RBAC security.',
        '•   Built on PostgreSQL 16 with 12 data models, 22 indexes, Redis caching, BullMQ workers, HMAC webhook verification, and CI/CD pipelines — production-grade architecture.',
        '•   Total scope: 16 mobile screens, 28+ API endpoints, 7 admin pages, 12 DB tables, real-time Socket.IO, full DevOps setup, security audit, and 30-day post-launch support.',
    ]
    for i, p in enumerate(pts):
        txt(sl, p, 0.62, 3.62 + i*0.68, 12.2, 0.55, sz=10.5, color=SLATE)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — PLATFORM COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════
def s_platforms(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Platform Components', 'Three integrated products delivered as one cohesive system')

    platforms = [
        ('📱', 'Mobile Application',  'React Native 0.76 · Expo SDK 52', TEAL,
         ['16 fully designed screens', 'iOS & Android support', 'Zustand state management',
          'React Query v5 data layer', 'Socket.IO real-time sync', 'Firebase push notifications',
          'QR code & payment receipts', 'Offline-tolerant local store']),
        ('⚙️', 'API Server',           'Fastify · Node.js · PostgreSQL 16', NAVY,
         ['8 REST API route domains', 'JWT auth + RBAC guards', 'Razorpay payment gateway',
          'Socket.IO transit rooms', 'BullMQ background workers', 'Redis caching (5 & 10 min TTL)',
          'Zod input validation', 'HMAC webhook verification']),
        ('🖥️', 'Admin Dashboard',      'Next.js 14 · Tailwind CSS · Recharts', GREEN,
         ['7 management pages', 'Enrollment monitoring', 'Revenue analytics charts',
          'Academy & slot management', 'Daily transit operations', 'Role-based access control',
          'Recharts data visualisations', 'Vercel one-click deploy']),
    ]

    bgs = [RGBColor(0xE6,0xFD,0xF8), RGBColor(0xEF,0xF4,0xFF), RGBColor(0xEC,0xFD,0xF5)]
    for i, (ic, ti, tech, c, pts) in enumerate(platforms):
        x = 0.35 + i * 4.33
        card(sl, x, 1.2, 4.15, 6.05, c)
        rect(sl, x, 1.26, 4.15, 0.88, fill=bgs[i])
        txt(sl, ic,   x+0.18, 1.32, 0.55, 0.52, sz=24)
        txt(sl, ti,   x+0.75, 1.33, 3.2, 0.44, sz=13, bold=True, color=c)
        txt(sl, tech, x+0.75, 1.73, 3.2, 0.34, sz=9, color=MUTED, italic=True)
        for j, p in enumerate(pts):
            txt(sl, f'✓  {p}', x+0.22, 2.27+j*0.5, 3.8, 0.44, sz=10, color=SLATE)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — CORE FEATURES
# ═══════════════════════════════════════════════════════════════════════════════
def s_features(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Core Features & Capabilities', 'Comprehensive feature set engineered for production use')

    feats = [
        ('🔍', 'Smart Academy Discovery',    TEAL,   'GPS-based search with sport, distance, rating, transport & fee filters. Redis-cached results.'),
        ('📋', 'Multi-Step Enrollment Flow', NAVY,   'Slot selection → duration → transport option → payment → booking confirmation with QR code.'),
        ('💳', 'Online Payment Gateway',     GREEN,  'Razorpay integration — order creation, HMAC-SHA256 webhook verification, receipts & refunds.'),
        ('🚌', 'Live Transport Tracking',    AMBER,  'Real-time driver location via Socket.IO. ETA, pickup stop order (TSP algorithm), status updates.'),
        ('🔔', 'Push Notifications',         INDIGO, 'Firebase Cloud Messaging. BullMQ scheduled alerts dispatched before slot time each morning.'),
        ('⭐', 'Reviews & Ratings',           RED,    'Per-academy 1–5 star reviews. Aggregate rating recalculated on every new review submission.'),
        ('📊', 'Admin Analytics',            PURPLE, 'Revenue charts, enrollment trends, slot utilisation, daily transit ops — all in one dashboard.'),
        ('🔐', 'Security & Auth',            SLATE,  'JWT + bcrypt refresh rotation, RBAC (5 roles), rate limiting, Zod validation, OWASP hardening.'),
    ]
    for i, (ic, ti, c, desc) in enumerate(feats):
        col = i % 4; row = i // 4
        x = 0.35 + col * 3.25
        y = 1.28 + row * 2.85
        card(sl, x, y, 3.1, 2.6, c)
        txt(sl, ic,   x+0.18, y+0.16, 0.55, 0.5,  sz=22)
        txt(sl, ti,   x+0.72, y+0.18, 2.25, 0.55, sz=11, bold=True, color=c)
        txt(sl, desc, x+0.18, y+0.82, 2.82, 1.6,  sz=9.5, color=SLATE)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — TECHNOLOGY STACK
# ═══════════════════════════════════════════════════════════════════════════════
def s_tech(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Technology Stack', 'Industry-standard, battle-tested technologies — no proprietary lock-in')

    cats = [
        ('Mobile',        TEAL,  ['React Native 0.76 / Expo 52', 'TypeScript 5.x', 'Zustand (state mgmt)', 'TanStack Query v5', 'React Navigation v6', 'Expo Location + Notifs', 'React Native Maps', 'Socket.IO Client']),
        ('Backend API',   NAVY,  ['Node.js 20 + Fastify', 'TypeScript + Zod', 'PostgreSQL 16 (Prisma)', 'Redis 7 + BullMQ', 'Socket.IO (real-time)', 'Firebase Admin SDK', 'Razorpay SDK', 'JWT + bcrypt']),
        ('Admin Panel',   GREEN, ['Next.js 14 App Router', 'Tailwind CSS v3', 'TypeScript', 'Recharts analytics', 'React Hook Form', 'Axios + SWR', 'shadcn/ui', 'Vercel deploy']),
        ('Infrastructure',AMBER, ['Docker Compose (dev)', 'Render.com (hosting)', 'PostgreSQL managed', 'Redis managed', 'Firebase Cloud Msg', 'Razorpay gateway', 'EAS Build (APK/IPA)', 'GitHub Actions CI/CD']),
    ]
    for i, (cat, c, items) in enumerate(cats):
        x = 0.35 + i * 3.25
        card(sl, x, 1.2, 3.1, 6.05, c)
        rect(sl, x, 1.26, 3.1, 0.45, fill=c)
        txt(sl, cat, x+0.18, 1.32, 2.75, 0.36, sz=13, bold=True, color=WHITE)
        for j, item in enumerate(items):
            bg = LGRAY if j % 2 == 0 else WHITE
            rect(sl, x+0.12, 1.82+j*0.57, 2.86, 0.5, fill=bg)
            txt(sl, f'  {item}', x+0.18, 1.86+j*0.57, 2.78, 0.42, sz=10, color=SLATE)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — DEVELOPMENT SCOPE
# ═══════════════════════════════════════════════════════════════════════════════
def s_scope(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Development Scope', 'Complete deliverables included in this proposal')

    pillars = [
        ('📱  Mobile App', TEAL, [
            ('Screens designed & built', '16'),
            ('Navigation stacks',        '3'),
            ('Zustand state stores',     '3'),
            ('Custom React hooks',       '4'),
            ('Modal components',         '4'),
            ('Platform targets',    'iOS + Android'),
        ]),
        ('⚙️  API Server', NAVY, [
            ('REST API domains',         '8'),
            ('API endpoints',            '28+'),
            ('Socket.IO events',         '5'),
            ('BullMQ workers',           '2'),
            ('Redis cache TTLs',         '5 min & 10 min'),
            ('Rate limit rules',         '2 (global + auth)'),
        ]),
        ('🖥️  Admin + DB', GREEN, [
            ('Admin dashboard pages',    '7'),
            ('Recharts dashboards',      '3'),
            ('PostgreSQL tables',        '12'),
            ('Database indexes',         '22'),
            ('FK relationships',         '16'),
            ('Enum domain types',        '5'),
        ]),
        ('🔧  DevOps + QA', AMBER, [
            ('Docker services',          '3 (API, PG, Redis)'),
            ('CI/CD pipelines',          '2'),
            ('EAS build profiles',       '3'),
            ('Environment configs',      '3 (dev/preview/prod)'),
            ('Security checks',          'OWASP Top 10'),
            ('Test types',               'Unit + Integration'),
        ]),
    ]
    for i, (title, c, rows) in enumerate(pillars):
        x = 0.35 + i * 3.25
        card(sl, x, 1.2, 3.1, 6.05, c)
        rect(sl, x, 1.26, 3.1, 0.45, fill=c)
        txt(sl, title, x+0.18, 1.32, 2.75, 0.36, sz=12, bold=True, color=WHITE)
        for j, (label, val) in enumerate(rows):
            y = 1.84 + j * 0.84
            rect(sl, x+0.14, y, 2.82, 0.72, fill=LGRAY, lc=BORDER, lw=0.3)
            txt(sl, label, x+0.24, y+0.07, 1.9, 0.3, sz=9, color=MUTED)
            txt(sl, val,   x+0.24, y+0.38, 2.5, 0.28, sz=11, bold=True, color=DTEXT)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — TEAM COMPOSITION
# ═══════════════════════════════════════════════════════════════════════════════
def s_team(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Project Team Composition', 'Dedicated specialist team required for production-grade delivery')

    team = [
        ('👨‍💻', 'Senior Full-Stack\nDeveloper',   '₹1,80,000/mo', '6 months', 'React Native + Fastify + PostgreSQL leadership', TEAL),
        ('📱', 'Mobile Developer',              '₹1,50,000/mo', '5 months', 'Expo, React Native, animations, Socket.IO',       NAVY),
        ('🔧', 'Backend Developer',             '₹1,40,000/mo', '5 months', 'Fastify, PostgreSQL, Redis, BullMQ workers',      GREEN),
        ('🎨', 'UI/UX Designer',                '₹1,20,000/mo', '4 months', 'Figma, design system, all 16 screen flows',       AMBER),
        ('🔍', 'QA Engineer',                   '₹90,000/mo',  '3 months', 'Mobile + API testing, performance, security',     INDIGO),
        ('☁️', 'DevOps Engineer',               '₹1,20,000/mo', '2 months', 'Docker, CI/CD, cloud infra, EAS builds',          RED),
        ('📊', 'Project Manager',               '₹1,10,000/mo', '6 months', 'Agile delivery, sprint planning, stakeholders',   SLATE),
    ]
    positions = [
        (0.35, 1.28), (3.6, 1.28), (6.85, 1.28), (10.1, 1.28),
        (1.97, 4.12), (5.22, 4.12), (8.47, 4.12),
    ]
    for idx, (ic, role, rate, dur, skills, c) in enumerate(team):
        x, y = positions[idx]
        card(sl, x, y, 3.05, 2.9, c)
        txt(sl, ic,     x+0.18, y+0.18, 0.55, 0.52, sz=22)
        txt(sl, role,   x+0.72, y+0.2,  2.15, 0.65, sz=11, bold=True, color=c)
        rect(sl, x+0.18, y+0.95, 2.68, 0.38, fill=LGRAY)
        txt(sl, rate,   x+0.24, y+0.98, 2.55, 0.3,  sz=11, bold=True, color=TEAL)
        txt(sl, f'Duration: {dur}', x+0.18, y+1.45, 2.68, 0.3, sz=9.5, color=MUTED)
        txt(sl, skills, x+0.18, y+1.8,  2.68, 0.9,  sz=9,   color=SLATE, italic=True)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — PROJECT TIMELINE
# ═══════════════════════════════════════════════════════════════════════════════
def s_timeline(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Project Timeline', '6-month phased delivery — from discovery to go-live')

    phases = [
        ('Phase 1', 'Discovery\n& Design',       'Wks 1–3',   TEAL,
         ['Requirements workshop', 'UI/UX wireframes', 'DB schema design', 'API contract spec']),
        ('Phase 2', 'Core\nDevelopment',          'Wks 4–12',  NAVY,
         ['All 16 mobile screens', 'API server + auth', 'Admin dashboard', 'DB setup & seed']),
        ('Phase 3', 'Integrations',               'Wks 13–16', GREEN,
         ['Razorpay payments', 'Firebase FCM', 'Socket.IO transit', 'Maps & geolocation']),
        ('Phase 4', 'Testing &\nQA',              'Wks 17–20', AMBER,
         ['Unit & API tests', 'Performance load test', 'Security audit', 'Bug-fix sprints']),
        ('Phase 5', 'Deployment\n& Launch',       'Wks 21–22', INDIGO,
         ['CI/CD pipelines', 'Cloud deployment', 'App store submit', 'Go-live support']),
        ('Phase 6', 'Handover\n& Support',        'Wks 23–24', SLATE,
         ['Documentation', 'Code walkthrough', '30-day warranty', 'Knowledge transfer']),
    ]

    rect(sl, 0.4, 2.22, 12.55, 0.07, fill=RGBColor(0xCC,0xD8,0xE4))
    for i, (ph, ti, pd, c, tasks) in enumerate(phases):
        x = 0.4 + i * 2.1
        # milestone dot
        dot = sl.shapes.add_shape(9, Inches(x+0.86), Inches(2.0), Inches(0.42), Inches(0.42))
        dot.fill.solid(); dot.fill.fore_color.rgb = c; dot.line.fill.background()
        # card below
        card(sl, x+0.12, 2.58, 1.9, 4.65, c)
        txt(sl, ph, x+0.22, 2.64, 1.7, 0.3, sz=9,  bold=True, color=c,     align=PP_ALIGN.CENTER)
        txt(sl, ti, x+0.15, 2.92, 1.8, 0.65,sz=11, bold=True, color=DTEXT, align=PP_ALIGN.CENTER)
        txt(sl, pd, x+0.15, 3.52, 1.8, 0.3, sz=9,  color=MUTED, italic=True, align=PP_ALIGN.CENTER)
        rect(sl, x+0.18, 3.88, 1.74, 0.04, fill=BORDER)
        for j, t in enumerate(tasks):
            txt(sl, f'• {t}', x+0.22, 4.0+j*0.56, 1.72, 0.48, sz=9, color=SLATE)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — COST BREAKDOWN
# ═══════════════════════════════════════════════════════════════════════════════
def s_cost(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Detailed Cost Breakdown', 'Line-item pricing — effort hours × market rate')

    # column config: (header, x, w, align)
    cols = [
        ('Deliverable / Component',    0.38, 5.1,  PP_ALIGN.LEFT),
        ('Effort (hrs)',               5.48, 1.62, PP_ALIGN.CENTER),
        ('Rate (₹/hr)',                7.1,  1.62, PP_ALIGN.CENTER),
        ('Amount (₹)',                 8.72, 2.22, PP_ALIGN.CENTER),
    ]
    for hdr, cx, cw, al in cols:
        rect(sl, cx, 1.18, cw-0.05, 0.4, fill=NAVY)
        txt(sl, hdr, cx+0.1, 1.23, cw-0.18, 0.3, sz=10, bold=True, color=WHITE, align=al)

    rows = [
        ('Mobile App — 16 screens (React Native / Expo SDK 52)',  '400',  '₹1,500', '₹ 6,00,000'),
        ('API Server — 8 domains, Socket.IO, BullMQ workers',     '320',  '₹1,500', '₹ 4,80,000'),
        ('Admin Dashboard — Next.js 14, 7 pages, Recharts',       '160',  '₹1,500', '₹ 2,40,000'),
        ('UI/UX Design — all screens, design system, Figma',      '200',  '₹1,200', '₹ 2,40,000'),
        ('Database Design — 12 models, 22 indexes, seed data',     '80',  '₹1,500', '₹ 1,20,000'),
        ('QA & Testing — unit, integration, performance tests',   '160',  '₹1,000', '₹ 1,60,000'),
        ('DevOps & CI/CD — Docker, cloud deployment, pipelines',   '80',  '₹1,500', '₹ 1,20,000'),
        ('Project Management — agile planning, delivery tracking', '120',  '₹1,200', '₹ 1,44,000'),
        ('Security Audit — OWASP Top 10, pen testing, hardening',  '60',  '₹1,500', '₹ 90,000'),
        ('Third-party Integrations — Razorpay, Firebase, Maps',    '80',  '₹1,500', '₹ 1,20,000'),
        ('Technical Documentation & Knowledge Transfer',           '60',  '₹1,000', '₹ 60,000'),
        ('Deployment, Go-Live Support & App Store Submission',      '40',  '₹1,500', '₹ 60,000'),
    ]
    for i, (comp, hrs, rate, amt) in enumerate(rows):
        y = 1.62 + i * 0.37
        bg = WHITE if i % 2 == 0 else LGRAY
        for (hdr, cx, cw, al), val in zip(cols, [comp, hrs, rate, amt]):
            rect(sl, cx, y, cw-0.05, 0.35, fill=bg, lc=BORDER, lw=0.25)
            bold = (al == PP_ALIGN.CENTER and val.startswith('₹') and len(val) > 8)
            color = TEAL if bold else (DTEXT if al == PP_ALIGN.LEFT else MUTED)
            txt(sl, val, cx+0.1, y+0.04, cw-0.18, 0.28, sz=9.5, bold=bold, color=color, align=al)

    # Subtotal
    y_s = 1.62 + 12 * 0.37
    for (hdr, cx, cw, al) in cols[:-1]:
        rect(sl, cx, y_s, cw-0.05, 0.38, fill=RGBColor(0xE8,0xF0,0xF8), lc=BORDER, lw=0.3)
    rect(sl, 8.72, y_s, 2.17, 0.38, fill=NAVY)
    txt(sl, 'Sub-total (Development)', 0.48, y_s+0.07, 4.9, 0.28, sz=10, bold=True, color=NAVY)
    txt(sl, '₹ 24,34,000', 8.76, y_s+0.06, 2.1, 0.28, sz=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — INVESTMENT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
def s_investment(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Total Investment Summary', 'All-inclusive pricing — no hidden costs')

    # Left card
    card(sl, 0.38, 1.2, 7.3, 6.06)
    rect(sl, 0.38, 1.2, 0.07, 6.06, fill=TEAL)
    txt(sl, 'Cost Breakdown', 0.62, 1.3, 7, 0.42, sz=14, bold=True, color=NAVY)

    items = [
        ('Development & Engineering',              '₹24,34,000', TEAL),
        ('Cloud Infrastructure & Hosting (1 yr)',  '₹  60,000',  NAVY),
        ('App Stores, SSL & Domain (1 yr)',         '₹  35,000',  GREEN),
        ('Buffer & Contingency Reserve (3%)',       '₹  71,000',  AMBER),
    ]
    for i, (label, amount, c) in enumerate(items):
        y = 1.88 + i * 1.0
        rect(sl, 0.55, y, 6.95, 0.78, fill=LGRAY, lc=BORDER, lw=0.3)
        rect(sl, 0.55, y, 0.06, 0.78, fill=c)
        txt(sl, label,  0.74, y+0.1,  4.5, 0.3,  sz=11, color=SLATE)
        txt(sl, amount, 0.74, y+0.42, 6.5, 0.3,  sz=13, bold=True, color=c, align=PP_ALIGN.RIGHT)

    rect(sl, 0.55, 5.95, 6.95, 0.05, fill=NAVY)
    rect(sl, 0.55, 6.05, 6.95, 0.9,  fill=NAVY)
    txt(sl, 'TOTAL INVESTMENT',  0.75, 6.12, 5,    0.38, sz=13, bold=True, color=WHITE)
    txt(sl, '₹ 25,00,000',      0.75, 6.5,  6.55, 0.42, sz=24, bold=True, color=YELLOW, align=PP_ALIGN.RIGHT)

    # Right card
    card(sl, 7.95, 1.2, 5.02, 6.06, NAVY)
    rect(sl, 7.95, 1.2, 5.02, 0.5, fill=NAVY)
    txt(sl, "What's Included", 8.15, 1.28, 4.65, 0.38, sz=14, bold=True, color=WHITE)

    inclusions = [
        '✅  16-screen mobile app — iOS & Android',
        '✅  Full API with 28+ endpoints & RBAC',
        '✅  Admin dashboard with analytics',
        '✅  Razorpay payment gateway (live)',
        '✅  Real-time transport tracking (Socket.IO)',
        '✅  Firebase push notification system',
        '✅  OWASP security audit & hardening',
        '✅  CI/CD pipelines + cloud deployment',
        '✅  Complete source code & IP transfer',
        '✅  30-day post-launch warranty support',
    ]
    for i, line in enumerate(inclusions):
        txt(sl, line, 8.15, 1.85+i*0.5, 4.65, 0.44, sz=10.5, color=RGBColor(0xC0,0xE8,0xE0))

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — VALUE PROPOSITION
# ═══════════════════════════════════════════════════════════════════════════════
def s_value(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=LGRAY)
    header(sl, 'Why This Investment Is Justified', 'Production-ready platform vs. a basic prototype')

    # Basic col
    card(sl, 0.38, 1.18, 6.1, 5.35, RED)
    rect(sl, 0.38, 1.18, 6.1, 0.5, fill=RED)
    txt(sl, '✗  Basic Prototype',    0.58, 1.24, 3.5, 0.38, sz=13, bold=True, color=WHITE)
    txt(sl, '₹6–8 Lakhs',           0.58, 1.24, 5.7, 0.38, sz=13, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    basic_pts = [
        'Single developer, 3 months',
        'No automated testing — bugs reach production',
        'Hardcoded data, no real database design',
        'Mock / demo payments only',
        'No real-time features (polling at best)',
        'Manual deployment, no CI/CD',
        'No security audit — OWASP vulnerabilities',
        'No documentation or knowledge transfer',
    ]
    for i, p in enumerate(basic_pts):
        txt(sl, f'✗   {p}', 0.55, 1.85+i*0.56, 5.8, 0.48, sz=10.5, color=RGBColor(0xAA,0xAA,0xAA))

    # Production col
    card(sl, 6.85, 1.18, 6.1, 5.35, TEAL)
    rect(sl, 6.85, 1.18, 6.1, 0.5, fill=TEAL)
    txt(sl, '✓  SportNexus — Production Ready',  7.05, 1.24, 4.0, 0.38, sz=13, bold=True, color=WHITE)
    txt(sl, '₹25 Lakhs', 7.05, 1.24, 5.7, 0.38, sz=13, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    prod_pts = [
        '7-member specialist team, 6 months',
        'Unit + integration tests, load testing',
        '12-table PostgreSQL schema, 22 indexes',
        'Live Razorpay with HMAC webhook verification',
        'Socket.IO real-time driver tracking',
        'CI/CD pipelines + cloud infra (Docker, Render)',
        'OWASP Top 10 audit, JWT + bcrypt security',
        'Full documentation + 30-day warranty support',
    ]
    for i, p in enumerate(prod_pts):
        txt(sl, f'✓   {p}', 7.0, 1.85+i*0.56, 5.8, 0.48, sz=10.5, color=SLATE)

    # Bottom callout
    rect(sl, 0.38, 6.65, 12.57, 0.58, fill=RGBColor(0xFE,0xF9,0xC3))
    rect(sl, 0.38, 6.65, 0.07,  0.58, fill=AMBER)
    txt(sl, '💡  The ₹25L investment builds a platform you can launch commercially — not a demo. Real users, real transactions, real-time features, production infrastructure.',
        0.55, 6.72, 12.2, 0.44, sz=10.5, color=RGBColor(0x78,0x5B,0x09))

# ═══════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — THANK YOU
# ═══════════════════════════════════════════════════════════════════════════════
def s_thankyou(prs):
    sl = blank(prs)
    rect(sl, 0, 0, 13.33, 7.5, fill=D_NAVY)
    rect(sl, 0, 0, 0.55, 7.5, fill=TEAL)
    oval(sl, 9.3, -1.0, 4.8, 4.8, fill=TEAL_DIM)
    oval(sl, 10.2, 4.6, 3.5, 3.5, fill=TEAL_DIM2)

    rect(sl, 0.9, 1.15, 2.5, 0.44, fill=TEAL)
    txt(sl, 'SPORTNEXUS', 0.95, 1.2, 2.4, 0.36, sz=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    txt(sl, 'Thank You', 0.9, 2.1, 9, 1.1, sz=56, bold=True, color=WHITE, font='Calibri Light')

    rect(sl, 0.9, 3.45, 5.5, 0.06, fill=TEAL)

    txt(sl, 'Ready to build the future of sports training in India.', 0.9, 3.68, 9.5, 0.48, sz=15, color=RGBColor(0x9B,0xC0,0xD0))
    txt(sl, '₹25,00,000  ·  6 Months  ·  7-Member Team  ·  Production-Ready', 0.9, 4.32, 9.5, 0.48, sz=13, bold=True, color=YELLOW)

    # 3 summary stats
    sums = [('₹25L', 'Investment'), ('6 Mo', 'Delivery'), ('3', 'Platforms')]
    for i, (v, l) in enumerate(sums):
        x = 0.9 + i * 2.6
        rect(sl, x, 5.1, 2.3, 0.9, fill=RGBColor(0x18,0x30,0x52))
        txt(sl, v, x, 5.14, 2.3, 0.5, sz=20, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
        txt(sl, l, x, 5.6,  2.3, 0.35,sz=10, color=RGBColor(0x9B,0xC0,0xD0), align=PP_ALIGN.CENTER)

    txt(sl, 'Questions? Let\'s align on the roadmap and get started.',  0.9, 6.25, 9.5, 0.42, sz=12, color=RGBColor(0x9B,0xC0,0xD0), italic=True)
    txt(sl, 'Prepared: April 2026  ·  Confidential  ·  For Internal Use Only', 0.9, 6.75, 9.5, 0.38, sz=9.5, color=RGBColor(0x45,0x60,0x70), italic=True)

# ═══════════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════════
s_cover(prs)
s_exec(prs)
s_platforms(prs)
s_features(prs)
s_tech(prs)
s_scope(prs)
s_team(prs)
s_timeline(prs)
s_cost(prs)
s_investment(prs)
s_value(prs)
s_thankyou(prs)

out = r'C:\Teja\SportNexus\docs\SportNexus_Investment_Proposal.pptx'
prs.save(out)
print(f'Saved -> {out}')
print(f'Slides: {len(prs.slides)}')
