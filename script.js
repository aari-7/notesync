// API Configuration
const API_URL = window.location.origin; // Automatically uses the current server

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

    // Fetch notes from server
    async function fetchNotes() {
        try {
            const response = await fetch(`${API_URL}/api/notes`);
            notes = await response.json();
            renderNotes();
        } catch (error) {
            console.error('Error fetching notes:', error);
            showNotification('Failed to load notes. Please check your connection.', 'error');
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
        if (!note) return;

        if (!note.fileUrl) {
            alert('This note does not have a file attached.');
            return;
        }

        // Download the file
        const link = document.createElement('a');
        link.href = `${API_URL}${note.fileUrl}`;
        link.download = note.fileName || `${note.title}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Delete Note Handling
    window.deleteNote = async (id, title) => {
        const password = prompt(`Enter Admin Password to delete "${title}":`);
        if (!password) return;

        try {
            const response = await fetch(`${API_URL}/api/notes/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Password': password
                }
            });
            const result = await response.json();

            if (result.success) {
                showNotification(`Note "${title}" deleted.`, 'success');
                await fetchNotes();
            } else {
                showNotification(result.error || 'Failed to delete note.', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Error connecting to server.', 'error');
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
                <p style="color: rgba(255,255,255,0.6); font-size: 18px;">No notes uploaded yet. Be the first!</p>
            `;
            notesGrid.appendChild(emptyState);
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card';

            // Determine icon based on subject
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
                <button class="download-btn" onclick="downloadNote(${note.id})">
                    <ion-icon name="cloud-download-outline"></ion-icon> Download Note
                </button>
            `;

            notesGrid.appendChild(card);
        });
    }

    // --- Event Listeners ---

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic
            renderNotes(btn.dataset.filter);
        });
    });

    // Modal Logic
    const openModal = () => {
        uploadModal.style.display = 'flex';
        setTimeout(() => uploadModal.classList.add('active'), 10);
    };

    uploadBtn.addEventListener('click', openModal);

    const fabUpload = document.getElementById('fabUpload');
    if (fabUpload) {
        fabUpload.addEventListener('click', openModal);
    }

    function closeUploadModal() {
        uploadModal.classList.remove('active');
        setTimeout(() => uploadModal.style.display = 'none', 300);
    }

    closeModal.addEventListener('click', closeUploadModal);

    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeUploadModal();
    });

    // File Input Logic
    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            dropArea.style.borderColor = '#8b5cf6';
            dropArea.style.background = 'rgba(139, 92, 246, 0.1)';
        }
    });

    // Drag and drop
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '#8b5cf6';
        dropArea.style.background = 'rgba(139, 92, 246, 0.1)';
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.style.borderColor = '';
        dropArea.style.background = '';
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '';
        dropArea.style.background = '';

        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileNameDisplay.textContent = e.dataTransfer.files[0].name;
            dropArea.style.borderColor = '#8b5cf6';
            dropArea.style.background = 'rgba(139, 92, 246, 0.1)';
        }
    });

    // Upload Logic
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const subject = document.getElementById('subject').value;
        const author = document.getElementById('author').value;
        const file = fileInput.files[0];

        if (!title || !subject) {
            showNotification('Please fill in all required fields (Title, Subject).', 'error');
            return;
        }

        if (!file) {
            showNotification('Please select a file to upload.', 'error');
            return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('author', author);
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/api/notes`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Note uploaded successfully! 🎉', 'success');

                // Reset form
                uploadForm.reset();
                fileNameDisplay.textContent = '';
                dropArea.style = '';
                closeUploadModal();

                // Refresh notes
                await fetchNotes();

                // Reset filter to 'All'
                filterBtns.forEach(b => b.classList.remove('active'));
                document.querySelector('[data-filter="all"]').classList.add('active');
                renderNotes('all');
            } else {
                showNotification('Failed to upload note. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Failed to upload note. Please check your connection.', 'error');
        }
    });

    // Initialize - Fetch notes from server
    await fetchNotes();

    // Auto-refresh every 5 seconds to sync with other devices
    setInterval(fetchNotes, 5000);
});
