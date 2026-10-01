# DESIGN.md — Perpustakaan Metland School

> Design Direction & Identity Guidelines  
> Standard: Contemporary Scholastic & Clean Editorial  
> Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

---

## 1. Product Identity & Purpose

- **Product:** Sistem Informasi Perpustakaan Metland School (Metland School Library System).
- **Core Purpose:** An authentic scholastic e-library supporting two distinct core user groups:
  1. **Students (Siswa):** Fast catalog discovery, real-time availability checks, overdue countdowns, clear borrowing workflows, and student library card.
  2. **Librarians / Administrators:** High-speed desk operations (quick returns, overdue triage, inventory cataloging, member lookup).
- **Design Metaphor:** Modern Academic Reading Room. Calm, dignified, tactile, and clear. Not a crypto dashboard, not an e-commerce storefront.

---

## 2. Dials & Liveliness Settings

- **ENERGY: 2 (Balanced)**  
  Clean, authoritative, and welcoming. High clarity with dignified scholastic character.
- **RHYTHM: 2 (Consistent with structured variation)**  
  Varied section densities: scannable quick-triage alert bars, structured book grids, and clean tabular registers.
- **MOTION: 1 (Hover states and state transitions only)**  
  No looping pulses, no perpetual radar pings, no 3D mouse tilts. Transitions limited to fast (150-200ms) ease-out feedback on hover, focus, and state reveals.

---

## 3. Color & Materials Palette

Active palette restricted to 2 core neutrals + 1 brand primary + semantic status tokens (WCAG AA compliant across all states):

- **Background & Canvas:**
  - Page Background: `#FBFBF9` (Parchment Paper Ivory)
  - Card & Container Surface: `#FFFFFF` (Bone White)
  - Sub-surface / Inset: `#F5F5F0` (Warm Cream Stone)
- **Borders & Dividers:**
  - Hairline Border: `#E7E5E4` (Stone 200)
  - Elevated Border: `#D6D3D1` (Stone 300)
- **Ink & Typography:**
  - Primary Text: `#0F172A` (Deep Slate Ink, 14.5:1 contrast against white)
  - Secondary Text: `#475569` (Slate 600, 6.8:1 contrast)
  - Muted Label Text: `#64748B` (Slate 500, 4.6:1 contrast)
- **Brand Primary:**
  - Metland Scholastic Navy: `#1E3A8A` (Deep Blue 900) & `#2563EB` (Royal Blue 600) used for key primary actions.
- **Semantic Status Tokens:**
  - **Available / Returned (Green):** Text `#166534`, Background `#F0FDF4`, Border `#BBF7D0`
  - **Borrowed / Due Soon (Amber):** Text `#92400E`, Background `#FFFBEB`, Border `#FDE68A`
  - **Overdue / Out of Stock (Red):** Text `#991B1B`, Background `#FEF2F2`, Border `#FECACA`
  - **Neutral / Draft (Gray):** Text `#334155`, Background `#F1F5F9`, Border `#E2E8F0`

*Banned Visual Artifacts:*
- No full-page blue/purple radial glow gradients.
- No 3D card tilt with mouse-tracking glares (`Tilt3DCard` is deprecated).
- No arbitrary colored left border stripes on cards.
- No perpetual pulsing dots (`animate-ping`) on static tags.
- No decorative emojis in interface labels.

---

## 4. Typography Hierarchy

- **Interface & Form Controls:** `Plus Jakarta Sans`, system-ui, sans-serif.
- **Scholastic Display & Book Titles:** Font stack with literary serif styling (`Georgia, 'Times New Roman', serif` or refined font tokens) for catalog headings, book detail titles, and library badges.
- **Bibliographic & Tabular Data:** Tabular monospace (`ui-monospace, monospace`) for ISBN, Call Numbers, NIS, fine amounts, and timestamps.

---

## 5. Mobile & Responsive Layout

- **Minimum Hit Target:** 44px × 44px for all buttons, pagination triggers, and table actions.
- **Table Containment:** All tabular data wrapped in self-contained horizontal scroll containers with visual fading cues and compact mobile card alternatives where appropriate.
- **Bottom Navigation Clearance:** Bottom navigation pinned with safe-area inset reservation (`pb-24 md:pb-8`) so no buttons or content are trapped underneath.

---

## 6. Official Brand Assets & Logo

- **Official Metland School Crest (`/logo.png`):**
  The official Metland School crest (shield emblem with globe and scholastic banner) is mandatory and must NEVER be replaced with generic stock icons or placeholder graphics.
  - **Required Touchpoints:**
    - Admin Sidebar Brand Header ([`AdminSidebar.js`](file:///d:/Project/SchoolLibraryMetland/src/components/layout/AdminSidebar.js))
    - Student Navbar Brand Header ([`SiswaNav.js`](file:///d:/Project/SchoolLibraryMetland/src/components/layout/SiswaNav.js))
    - Authentication Portals ([`login/page.js`](file:///d:/Project/SchoolLibraryMetland/src/app/login/page.js) & [`register/page.js`](file:///d:/Project/SchoolLibraryMetland/src/app/register/page.js))
    - Official Student Member Card ([`siswa/profil/page.js`](file:///d:/Project/SchoolLibraryMetland/src/app/siswa/profil/page.js))
    - Application Favicon & Metadata ([`layout.js`](file:///d:/Project/SchoolLibraryMetland/src/app/layout.js))

