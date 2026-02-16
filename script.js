// --- Supabase Integration ---
const supabase = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

document.addEventListener('DOMContentLoaded', async () => {
    // --- State Management ---
    let notes = [];

    // --- DOM Elements ---
    const notesGrid = document.getElementById('notesGrid');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.querySelector('.close-modal');
    const uploadForm = document.getElementById('uploadForm');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const fileNameDisplay = document.getElementById('fileName');

    // --- Functions ---

    // Initialize Supabase Client if possible
    let supabaseClient = null;
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('⚠️ Supabase URL/Key not configured. Please check index.html');
        // Fallback to demo mode or alert user
    }

    // Fetch notes from Supabase
    async function fetchNotes() {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('notes')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            notes = data;
            renderNotes();
        } catch (error) {
            console.error('Error fetching notes:', error);
            showNotification('Sync failed. Check Supabase connection.', 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Download Handling
    window.downloadNote = (id) => {
        const note = notes.find(n => n.id === id);
        if (!note || !note.file_url) {
            alert('File not found.');
            return;
        }
        window.open(note.file_url, '_blank');
    };

    // Delete Note Handling
    window.deleteNote = async (id, title) => {
        const password = prompt(`Enter Admin Password to delete "${title}":`);
        if (!password) return;

        if (password !== ADMIN_PASSWORD) {
            showNotification('Incorrect password!', 'error');
            return;
        }

        try {
            // 1. Delete note from database
            const { error: dbError } = await supabaseClient
                .from('notes')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            showNotification(`Note "${title}" deleted.`, 'success');
            await fetchNotes();
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Failed to delete note.', 'error');
        }
    };

    function renderNotes(filter = 'all') {
        notesGrid.innerHTML = '';

        const filteredNotes = notes.filter(note => filter === 'all' ? true : note.subject === filter);

        if (filteredNotes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; grid-column: 1 / -1;';
            emptyState.innerHTML = `
                <ion-icon name="file-tray-outline" style="font-size: 64px; color: rgba(255,255,255,0.3); margin-bottom: 16px;"></ion-icon>
                <p style="color: rgba(255,255,255,0.6); font-size: 18px;">No notes found. Create your own!</p>
            `;
            notesGrid.appendChild(emptyState);
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card';
            const icon = note.subject === 'chemistry' ? 'flask' : 'magnet';
            const colorClass = note.subject;

            card.innerHTML = `
                <div class="card-header">
                    <span class="subject-badge ${colorClass}">
                        <ion-icon name="${icon}-outline" style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                        ${note.subject}
                    </span>
                    <button class="delete-btn" onclick="deleteNote(${note.id}, '${note.title.replace(/'/g, "\\'")}')" title="Delete Note">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
                <h3 class="card-title">${note.title}</h3>
                <div class="card-meta">
                    <span><ion-icon name="person-circle-outline"></ion-icon> ${note.author || 'Anonymous'}</span>
                    <span><ion-icon name="calendar-outline"></ion-icon> ${new Date(note.date).toLocaleDateString()}</span>
                </div>
                ${note.file_url ? `
                <button class="download-btn" onclick="downloadNote(${note.id})">
                    <ion-icon name="cloud-download-outline"></ion-icon> Download Note
                </button>` : ''}
            `;
            notesGrid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    const openModal = () => {
        uploadModal.style.display = 'flex';
        setTimeout(() => uploadModal.classList.add('active'), 10);
    };

    uploadBtn.addEventListener('click', openModal);
    const fabUpload = document.getElementById('fabUpload');
    if (fabUpload) fabUpload.addEventListener('click', openModal);

    function closeUploadModal() {
        uploadModal.classList.remove('active');
        setTimeout(() => uploadModal.style.display = 'none', 300);
    }

    closeModal.addEventListener('click', closeUploadModal);
    window.addEventListener('click', (e) => { if (e.target === uploadModal) closeUploadModal(); });

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNotes(btn.dataset.filter);
        });
    });

    // File Input Logic
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            dropArea.style.borderColor = '#8b5cf6';
        }
    });

    // Upload Logic
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const subject = document.getElementById('subject').value;
        const author = document.getElementById('author').value;
        const file = fileInput.files[0];

        if (!title || !subject || !file) {
            showNotification('Please fill all fields and select a file.', 'error');
            return;
        }

        try {
            // 1. Upload File to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `notes/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('notes-bucket')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('notes-bucket')
                .getPublicUrl(filePath);

            // 3. Save Record to Database
            const { error: dbError } = await supabaseClient
                .from('notes')
                .insert([{
                    title,
                    subject,
                    author: author || 'Anonymous',
                    date: new Date().toISOString(),
                    file_url: publicUrl,
                    file_name: file.name
                }]);

            if (dbError) throw dbError;

            showNotification('Note uploaded successfully! 🚀');
            uploadForm.reset();
            fileNameDisplay.textContent = '';
            closeUploadModal();
            await fetchNotes();
        } catch (error) {
            console.error('Upload failed:', error);
            showNotification('Upload failed. Check Supabase config.', 'error');
        }
    });

    // Initialize
    if (supabaseClient) {
        await fetchNotes();
        setInterval(fetchNotes, 10000); // Polling every 10s
    }
});
