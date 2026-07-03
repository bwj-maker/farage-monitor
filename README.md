# Farage Money Monitor — how to put this on the internet

This folder is a complete website. It needs no database and no server —
the register data is saved in `data.json` and the sign-up form is handled
by the free hosting service (Netlify).

## Put it online (about 15 minutes, all free, no coding)

### Step 1 — put the folder on GitHub

1. Go to **github.com** and create a free account.
2. Click the **+** in the top-right → **New repository**. Name it
   `farage-monitor`, leave everything else as-is, click **Create repository**.
3. On the next page click **"uploading an existing file"**.
4. Open this `farage-web` folder in Finder and drag **everything inside it**
   into the browser window. (One folder is hidden: press **Cmd+Shift+.** in
   Finder to reveal the `.github` folder and drag that in too — it's what
   keeps the data updating itself.)
5. Click **Commit changes**.

### Step 2 — connect it to Netlify

1. Go to **netlify.com** → **Sign up** → choose **Sign up with GitHub**.
2. Click **Add new site** → **Import an existing project** → **GitHub**
   → pick `farage-monitor`.
3. Don't change any settings, just click **Deploy**.
4. After a minute you'll get a live address like
   `https://something.netlify.app` — your site is on the internet.
5. To use your own address (e.g. faragemoneymonitor.co.uk): buy the domain
   anywhere (~£10/yr), then in Netlify go to
   **Domain settings → Add custom domain** and follow the prompts.

### Step 3 — switch on the sign-up box

1. In Netlify, go to your site → **Forms** → **Enable form detection**,
   then redeploy (Deploys → Trigger deploy).
2. Sign-ups now appear under **Forms → stop-reform**. To get an email
   every time someone signs up: **Forms → Form notifications**.
3. Free plan includes 100 sign-ups a month.

## How the data stays fresh

Twice a day, GitHub automatically fetches the latest register data and
updates the site (that's the `.github` folder's job). You never need to
touch it. You can also trigger it by hand: GitHub → your repo →
**Actions** → **Update register data** → **Run workflow**.

## Updating the data on your own computer (optional)

    cd farage-web
    node build.js

That rewrites `data.json` with the latest register entries.

## A note on the sign-ups (important)

Names, emails and postcodes are personal data. Under UK GDPR you should:
only use them for what the form promises (connecting people with local
organising), keep them safe, delete them if someone asks, and if the
list becomes a serious campaign tool, register with the ICO (£40/yr for
most small organisations — ico.org.uk).
