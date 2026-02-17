from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time

app = Flask(__name__)
CORS(app)

# Configuration for Cloud
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
NOTES_FILE = os.environ.get('NOTES_FILE', 'notes.json')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'GOAT_SYNC_2026') # Your secret key!

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Initial seed data
initial_data = [
    {
        "id": 1,
        "title": "Organic Chemistry: Alkanes & Alkenes",
        "subject": "chemistry",
        "description": "Comprehensive guide to hydrocarbon bonding and reactions.",
        "author": "Sarah Jenkins",
        "date": "2023-10-15T00:00:00Z",
        "fileUrl": None
    },
    {
        "id": 2,
        "title": "Newtonian Mechanic Formulas",
        "subject": "physics",
        "description": "Quick reference for F=ma, momentum, and energy conservation.",
        "author": "David Chen",
        "date": "2023-11-02T00:00:00Z",
        "fileUrl": None
    },
    {
        "id": 3,
        "title": "Electrolysis Summary Sheet",
        "subject": "chemistry",
        "description": "Electrolytic cell diagrams and half-equation practice.",
        "author": "Priya Patel",
        "date": "2023-12-05T00:00:00Z",
        "fileUrl": None
    }
]

def load_notes():
    if not os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, 'w') as f:
            json.dump(initial_data, f)
        return initial_data
    
    try:
        with open(NOTES_FILE, 'r') as f:
            return json.load(f)
    except:
        return initial_data

def save_notes(notes):
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes, f)

# Serve the static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    if os.path.exists(os.path.join('.', path)):
        return send_from_directory('.', path)
    return "File not found", 404

@app.route('/uploads/<path:filename>')
def uploaded_files(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# API Routes
@app.route('/api/notes', methods=['GET'])
def get_notes():
    return jsonify(load_notes())

@app.route('/api/notes', methods=['POST'])
def add_note():
    try:
        title = request.form.get('title')
        subject = request.form.get('subject')
        author = request.form.get('author', 'Anonymous')
        file = request.files.get('file')

        file_url = None
        file_name = None

        if file:
            # Clean filename
            cleaned_name = file.filename.replace(" ", "_")
            filename = f"{int(time.time())}_{cleaned_name}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            file_url = f"/uploads/{filename}"
            file_name = file.filename

        notes = load_notes()
        new_note = {
            "id": int(time.time() * 1000),
            "title": title,
            "subject": subject,
            "description": request.form.get('description', ''),
            "author": author,
            "date": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "fileUrl": file_url,
            "fileName": file_name
        }

        notes.insert(0, new_note)
        save_notes(notes)

        return jsonify({"success": True, "note": new_note})
    except Exception as e:
        print(f"Error adding note: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    # Security Check
    provided_password = request.headers.get('X-Admin-Password')
    if provided_password != ADMIN_PASSWORD:
        return jsonify({"success": False, "error": "Unauthorized: Incorrect Admin Password"}), 401
        
    notes = load_notes()
    note_to_delete = next((n for n in notes if n['id'] == note_id), None)
    
    if note_to_delete:
        if note_to_delete.get('fileUrl'):
            file_path = os.path.join(UPLOAD_FOLDER, os.path.basename(note_to_delete['fileUrl']))
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass # Ignore if file already deleted
        
        notes = [n for n in notes if n['id'] != note_id]
        save_notes(notes)
        return jsonify({"success": True})
    
    return jsonify({"success": False, "error": "Note not found"}), 404

if __name__ == '__main__':
    # Use the PORT assigned by the cloud (Render/Heroku) or default to 3000
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)
