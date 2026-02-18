// --- NoteSync Supabase Edition ---
// The following script handles all cloud database and storage logic.

document.addEventListener('DOMContentLoaded', async () => {
    // --- State Management ---
    let notes = [];
    let currentView = 'note'; // 'note' or 'test'

    // --- DOM Elements ---
    // --- DOM Elements ---
    const notesGrid = document.getElementById('notesGrid');
    const uploadFAB = document.getElementById('uploadFAB');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.querySelector('.close-modal');
    const uploadForm = document.getElementById('uploadForm');
    const subjectFilter = document.getElementById('subjectFilter');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const fileNameDisplay = document.getElementById('fileName');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const submitBtn = document.getElementById('submitBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const docTypeInput = document.getElementById('docType');

    // --- Subject Icon Mapping ---
    const subjectIcons = {
        'mathematics': 'calculator',
        'biology': 'leaf',
        'chemistry': 'flask',
        'physics': 'magnet',
        'english_lang': 'language',
        'english_lit': 'book',
        'geography': 'earth',
        'history': 'time',
        'economics': 'stats-chart',
        'comp_sci': 'code-working',
        'business': 'briefcase',
        'gp': 'globe'
    };

    // --- Functions ---

    // Initialize Supabase Client if possible
    let supabaseClient = null;
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('⚠️ Supabase URL/Key not configured. Please check index.html');
    }

    // --- Auth Logic ---
    async function checkUser() {
        if (!supabaseClient) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        updateAuthUI(user);
    }

    function updateAuthUI(user) {
        if (user) {
            googleLoginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userAvatar.src = user.user_metadata.avatar_url || 'https://via.placeholder.com/32';
        } else {
            googleLoginBtn.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }

    googleLoginBtn.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('OAuth error:', error);
            if (error.message.includes('not enabled')) {
                showNotification('Google Auth is NOT enabled in your Supabase dashboard yet!', 'error');
            } else {
                showNotification('Login failed: ' + error.message, 'error');
            }
        }
    });

    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) showNotification('Logout failed', 'error');
        else window.location.reload();
    });

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

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;

            // Reset filters when switching views
            filterBtns.forEach(b => b.classList.remove('active'));
            if (filterBtns[0]) filterBtns[0].classList.add('active'); // "All" button
            if (subjectFilter) subjectFilter.selectedIndex = 0;
            if (searchInput) searchInput.value = '';

            renderNotes();
        });
    });

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
            showNotification('File not found.', 'error');
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

    function renderNotes(filter = 'all', searchTerm = '') {
        notesGrid.innerHTML = '';

        // First filter by current view (note vs test)
        // Assume existing notes without a 'type' property are 'note' (backward compatibility)
        let filteredNotes = notes.filter(note => {
            const type = note.type || 'note';
            return type === currentView;
        });

        // Then filter by subject
        if (filter !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.subject === filter);
        }

        // Finally filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredNotes = filteredNotes.filter(note =>
                note.title.toLowerCase().includes(term) ||
                (note.description && note.description.toLowerCase().includes(term)) ||
                (note.subject && note.subject.toLowerCase().includes(term)) ||
                (note.author && note.author.toLowerCase().includes(term))
            );
        }

        if (filteredNotes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; grid-column: 1 / -1;';
            const emptyMsg = currentView === 'note' ? 'No notes found.' : 'No tests found.';
            emptyState.innerHTML = `
                <ion-icon name="file-tray-outline" style="font-size: 64px; color: rgba(255,255,255,0.3); margin-bottom: 16px;"></ion-icon>
                <p style="color: rgba(255,255,255,0.6); font-size: 18px;">${emptyMsg}</p>
            `;
            notesGrid.appendChild(emptyState);
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card';
            const iconName = subjectIcons[note.subject] || 'document-text';
            const colorClass = note.subject;

            card.innerHTML = `
                <div class="card-header">
                    <span class="subject-badge ${colorClass}">
                        <ion-icon name="${iconName}-outline" style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                        ${note.subject.replace('_', ' ')}
                    </span>
                    <button class="delete-btn" onclick="deleteNote(${note.id}, '${note.title.replace(/'/g, "\\'")}')" title="Delete Note">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
                <h3 class="card-title">${note.title}</h3>
                <p class="card-description">${note.description || 'No description provided.'}</p>
                <div class="card-meta">
                    <span><ion-icon name="person-circle-outline"></ion-icon> ${note.author || 'Anonymous'}</span>
                    <span><ion-icon name="calendar-outline"></ion-icon> ${new Date(note.date).toLocaleDateString()}</span>
                </div>
                ${note.file_url ? `
                <button class="download-btn" onclick="downloadNote(${note.id})">
                    <ion-icon name="cloud-download-outline"></ion-icon> Download ${currentView === 'note' ? 'Note' : 'Test'}
                </button>` : ''}
            `;
            notesGrid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    if (uploadFAB) {
        uploadFAB.addEventListener('click', async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                uploadModal.style.display = 'flex';
                setTimeout(() => uploadModal.classList.add('active'), 10);
            } else {
                showNotification('Please Sign In with Google to upload notes!', 'warning');
            }
        });
    }

    function closeUploadModal() {
        uploadModal.classList.remove('active');
        setTimeout(() => uploadModal.style.display = 'none', 300);
    }

    closeModal.addEventListener('click', closeUploadModal);
    window.addEventListener('click', (e) => { if (e.target === uploadModal) closeUploadModal(); });

    // Filter Logic
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (subjectFilter) subjectFilter.selectedIndex = 0; // Reset "More" dropdown
                renderNotes(btn.dataset.filter);
            });
        });
    }

    if (subjectFilter) {
        subjectFilter.addEventListener('change', (e) => {
            filterBtns.forEach(b => b.classList.remove('active')); // Reset primary buttons
            renderNotes(e.target.value);
        });
    }

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
        const docType = document.getElementById('docType').value;
        const description = document.getElementById('description').value;
        const author = document.getElementById('author').value;
        const file = fileInput.files[0];

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            showNotification('You must be logged in to upload.', 'error');
            return;
        }

        // --- Basic Moderation ("Rubbish Prevention") ---
        if (title.length < 5) {
            showNotification('Title is too short (min 5 chars).', 'error');
            return;
        }
        if (description.length < 10) {
            showNotification('Description is too short (min 10 chars).', 'error');
            return;
        }

        if (!title || !subject || !file) {
            showNotification('Please fill all fields and select a file.', 'error');
            return;
        }

        try {
            submitBtn.innerHTML = '<ion-icon name="sync-outline" class="rotate"></ion-icon> Uploading...';
            submitBtn.disabled = true;

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
                    type: docType,
                    description,
                    author: author || user.user_metadata.full_name || 'Anonymous',
                    user_id: user.id,
                    date: new Date().toISOString(),
                    file_url: publicUrl,
                    file_name: file.name
                }]);

            if (dbError) throw dbError;

            showNotification(`${docType.charAt(0).toUpperCase() + docType.slice(1)} uploaded successfully! 🚀`);
            uploadForm.reset();
            fileNameDisplay.textContent = '';
            closeUploadModal();
            await fetchNotes();
        } catch (error) {
            console.error('Upload failed:', error);
            showNotification('Upload failed. ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Upload';
            submitBtn.disabled = false;
        }
    });

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            renderNotes(activeFilter, e.target.value);
        });
    }

    // Initialize
    if (supabaseClient) {
        await checkUser();
        await fetchNotes();

        // Listener for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            updateAuthUI(session?.user);
        });

        setInterval(fetchNotes, 30000); // Polling every 30s
    }
});
