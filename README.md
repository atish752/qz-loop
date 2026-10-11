# Qz Loop — Mobile-First, Infinite-Scroll Competitive Quiz App

> **Tagline:** Scroll. Solve. Improve. Repeat.

A fast, social, text-first practice platform for Indian students preparing for competitive examinations (starting with **SSC CGL: Maths, Reasoning, English, General Knowledge**).

Inspired by the interaction patterns of Instagram Reels, **Qz Loop** is built around one simple habit:
**Open the app → scroll → solve a question → see the result → scroll again.**

---

## 🚀 Key Features

1. **Reels-Style Infinite Feed (`/`)**
   - Distraction-free question cards with smooth vertical snapping and swipe continuity.
   - Persistent horizontal subject filters: `All | Maths | Reasoning | English | GK`.
   - **Active Question Timer:** Starts only when the question becomes active and visible.
   - **Community Metrics Row:** Attempts, accuracy %, average speed, and fastest correct answers visible *before* answering.
   - **Answer Interaction:** Prominent "Answer Question" button reveals options, stops timer, records response time securely, highlights correct answers, and renders step-by-step "Quick Proof" explanations.
   - **"I Know This · Hide":** Instantly excludes known questions without altering correctness statistics, and smoothly advances to the next question.

2. **Personal Performance Matrix (`/matrix`)**
   - Real data calculated using the `Asia/Kolkata` (IST) timezone.
   - 4 time periods: **Today | Week | Month | Lifetime**.
   - Solved count, Accuracy %, Avg response time, Fastest correct speed.
   - Weekly practice consistency rhythm bars (Mon–Sun).
   - Subject breakdown matrix with color-coded status badges: `Strong` (Green), `OK` (Yellow/Gray), `Practise more` (Red).
   - Achievement sharing via the native Web Share API or clipboard copy fallback.

3. **User-Generated Questions & Duplicate Prevention (`/create`)**
   - Clean single-screen question authoring flow for Maths, Reasoning, English, and GK.
   - Full support for **English** and **Hindi Unicode characters** (`हिंदी`).
   - Built-in math notation shortcuts (e.g., `x²`, `√`, `₹`).
   - **Layer 1 Exact Duplicate Detection:** Normalizes whitespace, punctuation, and casing to block exact duplicates at submission time.
   - **Layer 2 Trigram Similarity:** Calculates $n$-gram similarity to flag paraphrased questions ($s \ge 0.42$).
   - **Layer 3 Warning Callout & Preview:** Displays existing match details, author, and metrics with a 1-tap view action.

4. **Transparent Competitive Leaderboard (`/leaderboard`)**
   - **Weekly** and **Monthly** standings cycles.
   - Top 3 podium distinction with 🥇, 🥈, 🥉 badges, AIR rank, and daily streaks.
   - Transparent, deterministic scoring formula documented in the UI and server:
     $$\text{Score} = (\text{Correct Solves} \times 25) + (\text{Accuracy } \% \times 8) + \min(\text{Speed Bonus}, 200)$$
   - Minimum participation threshold (5 attempts) to prevent gaming.

5. **Profile & Retention (`/profile`)**
   - Daily practice streak indicator (flame icon with Asia/Kolkata calendar tracking).
   - Non-blocking daily goal target tracker (`X / 10 questions today`).
   - **Hidden Questions Manager:** Full list of questions marked "I Know This" with an instant 1-tap "Restore" button.
   - Demo aspirant profile switcher (Rahul S., Amit Sharma, Priya K., Vikram Patel, Ananya Roy) for rapid multi-user testing.
   - PWA installation prompt and status.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS with the custom Material 3 / Google Stitch design color palette.
- **Backend & Database:** PostgreSQL with Supabase (RLS policies, Trigram extension, database triggers).
- **Offline / Local Dev Fallback:** Seamless unified data store with seed data for instantaneous development without live Supabase credentials required.
- **PWA:** Web App Manifest (`manifest.json`), service icons, and install prompts.

---

## 📐 Key Algorithms & Business Logic

### 1. Spaced Repetition & Question Eligibility
The feed applies a priority hierarchy to determine question order:
1. Exclude questions hidden by the current user.
2. Exclude questions already served in the active session.
3. Prioritize eligible questions the user has never attempted.
4. Spaced repetition for previously answered questions:
   - **Incorrect answers:** Eligible again after $\approx 24$ hours.
   - **Slow correct answers ($> 1.3\times$ avg):** Eligible again after $\approx 3$ days.
   - **Fast correct answers:** Eligible again after $\approx 7$ days.
5. Randomize eligible questions to keep the practice feed engaging and unpredictable.
6. **Security:** `correct_option_id` is stripped from feed network payloads before delivery to the browser.

### 2. Duplicate Detection Architecture
- **Normalization:** Strip all whitespace, casing, and punctuation (`[^\p{L}\p{N}]/gu`), generating a canonical fingerprint.
- **Trigram Similarity:** Deconstructs strings into 3-character shingles and computes Jaccard/Dice set overlap:
  $$\text{Similarity}(A, B) = \frac{|\text{Trigrams}(A) \cap \text{Trigrams}(B)|}{|\text{Trigrams}(A) \cup \text{Trigrams}(B)|}$$
- Questions with similarity $\ge 0.42$ trigger a pre-publication warning modal.
- Exact fingerprint matches ($1.0$) are blocked from duplicate insertion.

---

## 💻 Local Setup & Development

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.12.0)
- npm 9+

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd "qz look new"

# Install dependencies
npm install
```

### 3. Run the Automated Test Suite
```bash
npm test
```
All 13 acceptance test suites will run and validate feed filtering, timer bounds, submit logic, duplicate detection, Hindi Unicode, Matrix analytics, and Leaderboard scoring.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🗄️ Supabase Configuration & Migrations

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `supabase/migrations/20261011_init.sql` and click **Run**.
   - This creates tables: `examinations`, `subjects`, `profiles`, `questions`, `question_attempts`, `hidden_questions`, `question_reports`.
   - Enables `pg_trgm` and `uuid-ossp`.
   - Sets up Row Level Security (RLS) policies.
   - Configures the trigger `update_question_community_metrics()`.
4. Copy your project credentials into `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

---

## 🚢 Vercel Deployment

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), select **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application.

---

## ✅ Acceptance Criteria Verification Checklist

| Scenario | Requirement | Status |
|---|---|:---:|
| 1 | Student opens feed for SSC CGL and sees eligible questions | Passed |
| 2 | Subject filtering between All, Maths, Reasoning, English, GK | Passed |
| 3 | Question timer begins ONLY when card becomes active | Passed |
| 4 | "Answer Question" reveals choices; selection locks and stops timer | Passed |
| 5 | Instant result (supportive green / red) and author's explanation | Passed |
| 6 | Community performance metrics visible *before* answering | Passed |
| 7 | Next question loads without full page reload (peek card continuity) | Passed |
| 8 | "I Know This · Hide" excludes question from student's future feed | Passed |
| 9 | Hidden questions can be restored from the Profile screen | Passed |
| 10 | Authenticated student creates and publishes new questions | Passed |
| 11 | Exact duplicate question detection blocks duplicate publishing | Passed |
| 12 | Paraphrased similar question triggers a similarity warning modal | Passed |
| 13 | Hindi Unicode characters render accurately in questions and choices | Passed |
| 14 | Matrix dashboard calculates Today, Week, Month, Lifetime in IST | Passed |
| 15 | Weekly and Monthly Leaderboard with deterministic scoring | Passed |
| 16 | Practice achievements and app sharing actions work natively | Passed |
| 17 | PWA manifest, meta tags, and installable experience | Passed |
