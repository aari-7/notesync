document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const STORAGE_KEY = 'playground_db';

    // Initial Seed Data
    const initialData = [];

    // Load Data
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData;

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

    // --- Download Handling ---
    window.downloadNote = (id) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        if (!note.fileData) {
            alert('Item content unavailable.');
            return;
        }

        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = note.fileData;
        link.download = `${note.title || 'item'}.pdf`; // Default to PDF for this demo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    function renderNotes(filter = 'all') {
        notesGrid.innerHTML = '';

        const filteredNotes = notes.filter(note => filter === 'all' ? true : note.subject === filter);

        if (filteredNotes.length === 0) {
            document.getElementById('emptyState').style.display = 'flex'; // Ensure flex for centering
            return;
        }

        filteredNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'note-card';

            // Determine icon based on category
            let icon = 'cube';
            let colorClass = 'cat1';

            if (note.subject === 'idea') {
                icon = 'bulb';
                colorClass = 'cat1';
            } else if (note.subject === 'proto') {
                icon = 'construct';
                colorClass = 'cat2';
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="subject-badge ${colorClass}">
                        <ion-icon name="${icon}-outline" style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                        ${note.subject === 'idea' ? 'Idea' : 'Prototype'}
                    </span>
                </div>
                <h3 class="card-title">${note.title}</h3>
                <div class="card-meta">
                    <span><ion-icon name="person-circle-outline"></ion-icon> ${note.author || 'Anonymous'}</span>
                    <span><ion-icon name="calendar-outline"></ion-icon> ${new Date(note.date).toLocaleDateString()}</span>
                </div>
                <button class="download-btn" onclick="downloadNote(${note.id})">
                    <ion-icon name="cloud-download-outline"></ion-icon> View Item
                </button>
            `;

            notesGrid.appendChild(card);
        });
    }

    function saveNotes() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        renderNotes();
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
        // Trigger reflow for animation
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

    // Upload Logic
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const subject = document.getElementById('subject').value;
        const author = document.getElementById('author').value;
        const file = fileInput.files[0];

        if (!title || !subject) {
            alert('Please fill in all required fields (Title, Subject).');
            return;
        }

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        // Basic File Reader to simulate upload
        const reader = new FileReader();
        reader.onload = function (event) {
            const newNote = {
                id: Date.now(),
                title,
                subject,
                author,
                date: new Date().toISOString(),
                fileData: event.target.result // Store base64 string
            };

            notes.unshift(newNote); // Add to beginning
            saveNotes();

            // Reset form
            uploadForm.reset();
            fileNameDisplay.textContent = '';
            dropArea.style = '';
            closeUploadModal();

            // Remove 'active' from all filters and set 'All' to active
            filterBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');

            renderNotes('all'); // Show all to see new note
        };

        // Error handling for large files (LocalStorage limit)
        if (file.size > 2000000) { // 2MB limit check for demo
            alert('File is too large for this demo (Max 2MB). Title and metadata will be saved without the file content.');
            const newNote = {
                id: Date.now(),
                title,
                subject,
                author,
                date: new Date().toISOString(),
                fileData: null
            };
            notes.unshift(newNote);
            saveNotes();
            uploadForm.reset();
            closeUploadModal();
            renderNotes();
        } else {
            reader.readAsDataURL(file);
        }
    });

    // Initialize
    renderNotes();
});
