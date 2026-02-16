# 🧪 NoteSync - Global Edition (Cloud-Powered)

This version of NoteSync uses **Supabase** (Database + Storage) and can be hosted for **FREE** on Netlify or Vercel without a credit card.

## 🚀 Step 1: Set up Supabase (100% Free)

1.  Go to [Supabase.com](https://supabase.com) and sign in with GitHub.
2.  Click **New Project** and name it `notesync`. (Set a password and remember it!)
3.  **Create the Database Table**:
    - Go to the **SQL Editor** (left sidebar).
    - Paste this code and click **Run**:
      ```sql
      create table notes (
        id bigint primary key generated always as identity,
        title text not null,
        subject text not null,
        author text,
        date timestamptz default now(),
        file_url text,
        file_name text
      );

      -- Allow anyone to read and write for this project
      alter table notes enable row level security;
      create policy "Public Access" on notes for all using (true);
      ```
4.  **Create the Storage Bucket**:
    - Go to **Storage** (mailbox icon).
    - Click **New Bucket**, name it `notes-bucket`.
    - Set it to **Public**.
    - Go to **Policies** (under Storage) and create a policy that allows "All" access to everyone (so users can upload/download files).

5.  **Get your Keys**:
    - Go to **Project Settings** (gear icon) -> **API**.
    - Copy your **Project URL** and **anon public Key**.
    - Open `index.html` on your laptop and paste them into the `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables.

## 📱 Step 2: Go Live Locally

```bash
# You don't even need Python anymore! 
# Just open index.html in your browser.
```

## 🌍 Step 3: Go Live Globally (No Credit Card)

1.  Go to [Netlify.com](https://netlify.com).
2.  Sign in with GitHub.
3.  Click **"Add new site"** -> **"Deploy manually"**.
4.  **Drag and Drop** your `IGCSE pooling` folder.
5.  **DONE.** You'll get a real URL you can send to anyone!

---

## ✨ Features
- 🔄 **Cloud Sync**: Notes stay saved even if your laptop is destroyed.
- 📁 **Cloud Files**: PDFs and Images are stored globally.
- 🛡️ **Admin Protection**: Deletions still require the password (`GOAT_SYNC_2026`).

---

Made with 💜 by NoteSync
