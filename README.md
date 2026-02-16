# 🧪 NoteSync - Physics & Chemistry Notes

A beautiful web app for sharing and discovering Chemistry and Physics notes.

## 📱 Access on Your Phone

### Method 1: Local Network (Quick & Easy)

1. **Start the server** on your computer:
   ```bash
   cd "/Users/aari/IGCSE pooling"
   python3 -m http.server 8080
   ```

2. **Find your computer's IP address**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like `192.168.x.x`

3. **On your phone** (connected to same WiFi):
   - Open Safari or Chrome
   - Go to: `http://YOUR_IP_ADDRESS:8080/index.html`
   - Example: `http://192.168.2.146:8080/index.html`

4. **Install as App** (iOS):
   - Tap the Share button
   - Scroll down and tap "Add to Home Screen"
   - Now it works like a real app!

### Method 2: Deploy Online (Permanent Access)

#### Option A: GitHub Pages (Free)
```bash
# 1. Create a new GitHub repository
# 2. Push your files
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main

# 3. Enable GitHub Pages in repository settings
# Your app will be at: https://USERNAME.github.io/REPO_NAME
```

#### Option B: Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Done! You get a URL like `https://your-app.netlify.app`

## ✨ Features

- 📚 Upload and share study notes (PDF, images)
- 🔍 Filter by subject (Physics/Chemistry)
- 💾 Offline storage using localStorage
- 📱 Mobile-friendly responsive design
- 🎨 Beautiful glassmorphism UI
- ⚡ Progressive Web App (installable)

## 🛠️ Tech Stack

- Pure HTML, CSS, JavaScript
- No dependencies or build process
- Works offline after first load
- localStorage for data persistence

## 📝 Usage

1. Click "Upload Notes" to add new study materials
2. Fill in title, subject, and author
3. Upload PDF or image files
4. Filter notes by subject using the filter buttons
5. Download notes by clicking the download button

---

Made with 💜 by NoteSync
