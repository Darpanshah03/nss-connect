# NSS Connect

Modern, mobile-responsive management portal for College **National Service Scheme (NSS)** units — volunteer rosters, 2-year tenure lifecycles, core team head promotions, event postings with capacity limits (First-Come-First-Serve), attendance marking & verified hours ledger, and the Achievements Wall.

---

## 🏛️ Three-Tier Account System

| Role | Badge & Highlight | Capabilities |
| :--- | :--- | :--- |
| **Official Account (Admin)** | 🛡️ `Official Admin` (Red Badge) | • Manage event postings (FCFS limits, hours value, category, dates)<br>• Mark attendance and credit verified hours to volunteer ledgers<br>• Volunteer roster management: onboard, edit info, promote to Core Head<br>• Manage 2-year tenure lifecycle: promote Year 1 → Year 2, mark **Graduated/Completed**, or remove volunteers<br>• Post & manage the **Achievements Wall** (Unit accolades & individual spotlights)<br>• *Note: Administrative account (no hours counter)* |
| **Core Team (Heads)** | ⭐ `General Secretary`, `Joint Secretary`, etc. (Highlighted Gold Badge) | • Special elevated access to view attendee rosters for all events<br>• View past events and attendance records<br>• Standard volunteer privileges: browse & register for upcoming events (FCFS), attend events, track personal verified hours, view Achievements Wall and NSS Team Directory |
| **Normal Volunteers** | 👤 `Year 1 Volunteer` / `Year 2 Volunteer` / `🎓 Graduated` | • Personal dashboard with total verified NSS hours and completed events history<br>• Browse upcoming events and secure spots on a First-Come-First-Serve basis (real-time capacity counter)<br>• View the NSS Achievements Wall (unit honors & spotlights)<br>• View the NSS Team Directory and leadership roster<br>• Self-manage volunteer profile details |

---

## ⏳ 2-Year Volunteer Tenure Lifecycle

- **Year 1**: New volunteers register and earn verified NSS hours by attending community service events.
- **Year 2**: After 1 year, outstanding volunteers can be selected by the Official Admin as **Core Team Heads** (e.g. *General Secretary*, *Event Head*, *Media & PR Head*, *Technical Head*, *Logistics Head*, or custom titles). Other volunteers continue as senior Year 2 volunteers.
- **Graduation**: When the 2-year tenure is complete, the Official Admin marks the account as **Graduated / Completed**. Their verified hours and achievements remain on permanent record.
- **Removal**: Admin can deactivate/remove any volunteer from the active roster at any time.

---

## 📱 Mobile-First Responsive Design

- **Mobile Navigation**: Sticky top identity bar with role badges + touch-friendly bottom navigation bar with iOS/Android safe area support.
- **Desktop Sidebar**: Full sidebar navigation with instant profile metrics and role switch indicators.
- **Progressive Web App (PWA)**: Installable on home screen via `manifest.json`.

---

## 🚀 Getting Started & Setup

### 1. Supabase Database Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** → **New Query**, paste the full contents of `supabase/schema.sql`, and run it.
3. In **Authentication → Providers**, make sure **Email** is enabled (magic link passwordless sign-in).

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Promote Your Official (Admin) Account
Every account initially registers as a volunteer. To promote your NSS unit account to **Official Admin**:
1. Sign in through `/login` using your official unit email (e.g. `nssunit.college@gmail.com`).
2. Run this query in the Supabase SQL Editor:
```sql
update roles set role = 'official'
where user_id = (select id from auth.users where email = 'nssunit.college@gmail.com');
```
3. Sign out and sign back in — you will have full administrative access!

