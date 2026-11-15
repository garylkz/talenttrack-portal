# TalentTrack: Job Application Status Portal

## Solution Story

After submitting a job application, candidates are often left waiting without visibility into where they stand, which leads to anxiety and repeated follow-up emails. At the same time, many hiring teams do not need a complex enterprise tracking system just to keep applicants informed.

**TalentTrack** solves this with a fast, transparent, and serverless application status portal powered by **Next.js**, **Google Cloud Firestore**, and **Google Cloud Run** (`asia-southeast1`). Candidates can check their real-time hiring progress at any time without creating an account, seeing a clear visual timeline from `Applied → Screening → Interview → Offer → Hired` (or `Rejected` / Closed), along with personalized next steps from the recruiting team. On the back end, recruiters have a dedicated, lightweight dashboard to add candidates, update stages in one click, and share direct status links.

---

## How to Use

### 1. Recruiter Flow (`/admin`)
1. Open `/admin` and sign in with your admin password (the `ADMIN_PASSWORD` you set).
2. Click **Seed Sample Data** to load four example applicants into Firestore, or click **Add Applicant** to create a new candidate record (an ID such as `APP-2026-XXXX` is generated automatically).
3. Change any candidate's stage from the dropdown, add candidate-visible notes via the **Edit** button, or click **Link** to copy a direct status URL (`/?id=...&email=...`) to send to the applicant.

### 2. Applicant Flow (`/`)
1. Open `/` (or open the direct link shared by the recruiter).
2. Enter an **Application ID** and **Email** (for example, `APP-2026-1042` and `sarah.tan@example.com` after seeding), then click **View Application Status**.
3. View the visual progress timeline, recruiter updates, and full stage history.

---

## Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` for the applicant portal and `http://localhost:3000/admin` for the recruiter dashboard (default local password: `admin123`).

---

## Redeploying to Google Cloud Run (`asia-southeast1`)

```bash
chmod +x deploy.sh
./deploy.sh YOUR_GCP_PROJECT_ID YOUR_SECURE_ADMIN_PASSWORD
```
