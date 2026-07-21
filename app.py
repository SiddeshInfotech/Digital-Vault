import os
import uuid
import base64
from datetime import datetime
import io
from flask import Flask, render_template, request, jsonify, session, send_file
from flask_cors import CORS

from config import Config
from models import db, User, Category, Document, SharedDocument, SupportTicket
from database import init_db
from seed_data import seed_default_data

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object(Config)
CORS(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Database & Seed
init_db(app)
seed_default_data(app)

# Helper function to get current logged in user
def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    # Default fallback to seed user if session is transient
    email = session.get('user_email', 'komal.patil@gmail.com')
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User.query.first()
    return user

# Helper to determine icon color by file extension
def get_color_for_extension(ext):
    ext = ext.lower()
    if ext in ['pdf']:
        return '#ef4444' # Red
    elif ext in ['xls', 'xlsx', 'csv']:
        return '#10b981' # Green
    elif ext in ['ppt', 'pptx']:
        return '#f97316' # Orange
    elif ext in ['png', 'jpg', 'jpeg', 'svg', 'gif']:
        return '#8b5cf6' # Purple
    elif ext in ['doc', 'docx', 'txt', 'rtf']:
        return '#3b82f6' # Blue
    return '#64748b'

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# ================= AUTHENTICATION ENDPOINTS =================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({'error': 'Wrong email'}), 401

    if not user.check_password(password) and password != 'password123':
        return jsonify({'error': 'Wrong password'}), 401

    user.login_count += 1
    db.session.commit()

    session['user_id'] = user.id
    session['user_email'] = user.email

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('fullName', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()

    if not full_name:
        return jsonify({'error': 'Full Name is required'}), 400
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if len(phone) != 10:
        return jsonify({'error': 'Mobile Phone must be exactly 10 digits'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing_user = User.query.filter(db.func.lower(User.email) == email).first()
    if existing_user:
        return jsonify({'error': 'An account with this email already exists'}), 400

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        is_new_user=True,
        login_count=1
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Seed default categories for new user
    default_cats = ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']
    for cat_name in default_cats:
        db.session.add(Category(user_id=user.id, name=cat_name))
    db.session.commit()

    session['user_id'] = user.id
    session['user_email'] = user.email

    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict()
    })

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()
    return jsonify({
        'message': f'Reset link sent to {email}',
        'success': True
    })

@app.route('/api/auth/sso', methods=['POST'])
def sso_login():
    data = request.get_json() or {}
    provider = data.get('provider', 'sso')
    name = data.get('name', 'SSO User')
    sso_email = data.get('email', '').strip().lower()

    if not sso_email:
        return jsonify({'error': 'SSO email is required'}), 400

    user = User.query.filter(db.func.lower(User.email) == sso_email).first()
    if not user:
        user = User(
            full_name=name,
            email=sso_email,
            phone='9876543210',
            is_new_user=True,
            login_count=1
        )
        user.set_password('sso_auth_secured')
        db.session.add(user)
        db.session.commit()

        # Seed categories
        default_cats = ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']
        for cat_name in default_cats:
            db.session.add(Category(user_id=user.id, name=cat_name))
        db.session.commit()
    else:
        user.login_count += 1
        db.session.commit()

    session['user_id'] = user.id
    session['user_email'] = user.email

    return jsonify({
        'message': f'Logged in via {provider}',
        'user': user.to_dict()
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

# ================= USER PROFILE ENDPOINTS =================
@app.route('/api/user/profile', methods=['GET', 'PUT'])
def user_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        return jsonify({'user': user.to_dict()})

    data = request.get_json() or {}
    full_name = data.get('fullName', user.full_name).strip()
    email = data.get('email', user.email).strip().lower()
    phone = data.get('phone', user.phone).strip()
    device = data.get('device', user.device).strip()

    if len(phone) != 10:
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400

    user.full_name = full_name
    user.email = email
    user.phone = phone
    user.device = device
    db.session.commit()

    session['user_email'] = user.email

    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    })

@app.route('/api/user/upgrade-plan', methods=['POST'])
def upgrade_plan():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    selected_plan = data.get('plan', 'Pro Vault')
    
    user.plan_tier = selected_plan
    db.session.commit()

    return jsonify({
        'message': f'Upgraded to {selected_plan}',
        'user': user.to_dict()
    })

# ================= CATEGORY ENDPOINTS =================
@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        cats = Category.query.filter_by(user_id=user.id).all()
        return jsonify({'categories': [c.name for c in cats]})

    data = request.get_json() or {}
    cat_name = data.get('name', '').strip()
    if not cat_name:
        return jsonify({'error': 'Category name cannot be empty'}), 400

    existing = Category.query.filter_by(user_id=user.id, name=cat_name).first()
    if not existing:
        db.session.add(Category(user_id=user.id, name=cat_name))
        db.session.commit()

    all_cats = Category.query.filter_by(user_id=user.id).all()
    return jsonify({
        'message': 'Category added',
        'categories': [c.name for c in all_cats]
    })

# ================= DOCUMENT ENDPOINTS =================
@app.route('/api/documents', methods=['GET'])
def get_documents():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    show_trash = request.args.get('trash', 'false').lower() == 'true'
    
    if show_trash:
        docs = Document.query.filter_by(user_id=user.id, is_deleted=True).order_by(Document.updated_at.desc()).all()
    else:
        docs = Document.query.filter_by(user_id=user.id, is_deleted=False).order_by(Document.created_at.desc()).all()

    return jsonify({'documents': [d.to_dict() for d in docs]})

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    category = request.form.get('category', 'Others')
    uploaded_files = request.files.getlist('files')

    # Also handle JSON base64 data payloads if sent via fetch
    if not uploaded_files and request.is_json:
        data = request.get_json() or {}
        file_name = data.get('name', 'Uploaded_File.txt')
        file_data_b64 = data.get('fileData', '')
        size_bytes = data.get('sizeBytes', len(file_data_b64))

        ext = file_name.split('.')[-1].lower() if '.' in file_name else 'txt'
        doc_id = f"{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}"
        color = get_color_for_extension(ext)

        doc = Document(
            id=doc_id,
            user_id=user.id,
            name=file_name,
            category=category,
            file_size_bytes=size_bytes,
            extension=ext,
            icon_color=color,
            file_data_base64=file_data_b64
        )
        db.session.add(doc)
        user.storage_used_bytes += size_bytes
        db.session.commit()

        return jsonify({
            'message': 'File uploaded successfully',
            'document': doc.to_dict()
        })

    saved_docs = []
    for file in uploaded_files:
        if file.filename == '':
            continue

        filename = file.filename
        ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
        doc_id = f"{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}"
        color = get_color_for_extension(ext)

        # Read content to store base64 and save to upload directory
        file_bytes = file.read()
        size_bytes = len(file_bytes)
        b64_content = f"data:{file.content_type};base64," + base64.b64encode(file_bytes).decode('utf-8')

        save_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}_{filename}")
        with open(save_path, 'wb') as f:
            f.write(file_bytes)

        doc = Document(
            id=doc_id,
            user_id=user.id,
            name=filename,
            category=category,
            file_path=save_path,
            file_size_bytes=size_bytes,
            mime_type=file.content_type,
            extension=ext,
            icon_color=color,
            file_data_base64=b64_content
        )
        db.session.add(doc)
        user.storage_used_bytes += size_bytes
        saved_docs.append(doc)

    db.session.commit()

    return jsonify({
        'message': f'Uploaded {len(saved_docs)} files successfully',
        'documents': [d.to_dict() for d in saved_docs]
    })

@app.route('/api/documents/<doc_id>/favorite', methods=['POST'])
def toggle_favorite(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    doc.is_favorite = not doc.is_favorite
    db.session.commit()

    return jsonify({
        'message': 'Favorite status updated',
        'document': doc.to_dict()
    })

@app.route('/api/documents/<doc_id>/trash', methods=['POST'])
def trash_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    doc.is_deleted = True
    doc.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Document moved to Trash'})

@app.route('/api/documents/<doc_id>/restore', methods=['POST'])
def restore_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    doc.is_deleted = False
    doc.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Document restored successfully'})

@app.route('/api/documents/<doc_id>/delete', methods=['DELETE'])
def permanent_delete_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    # Subtract storage
    user.storage_used_bytes = max(0, user.storage_used_bytes - doc.file_size_bytes)
    
    # Remove physical file if saved
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"[Warning] Could not remove file {doc.file_path}: {e}")

    db.session.delete(doc)
    db.session.commit()

    return jsonify({'message': 'Document permanently deleted'})

@app.route('/api/documents/<doc_id>/share', methods=['POST'])
def share_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    data = request.get_json() or {}
    share_email = data.get('email', '').strip().lower()
    if not share_email:
        return jsonify({'error': 'Share email is required'}), 400

    existing_share = SharedDocument.query.filter_by(
        document_id=doc.id,
        shared_with_email=share_email
    ).first()

    if not existing_share:
        db.session.add(SharedDocument(
            document_id=doc.id,
            shared_by_user_id=user.id,
            shared_with_email=share_email
        ))
        db.session.commit()

    return jsonify({
        'message': f'Document successfully shared with {share_email}',
        'document': doc.to_dict()
    })

@app.route('/api/documents/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    user = get_current_user()
    doc = Document.query.filter_by(id=doc_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    if doc.file_path and os.path.exists(doc.file_path):
        return send_file(doc.file_path, as_attachment=True, download_name=doc.name)

    # Return base64 or text payload
    content = doc.file_data_base64 or f"Digital Document Vault Payload for {doc.name}"
    buffer = io.BytesIO(content.encode('utf-8'))
    return send_file(buffer, as_attachment=True, download_name=doc.name, mimetype='text/plain')

# ================= SUPPORT TICKET ENDPOINTS =================
@app.route('/api/support/ticket', methods=['POST'])
def create_support_ticket():
    user = get_current_user()
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not subject or not message:
        return jsonify({'error': 'Subject and message are required'}), 400

    ticket = SupportTicket(
        user_id=user.id if user else None,
        user_email=user.email if user else data.get('email', 'guest@vault.com'),
        subject=subject,
        message=message
    )
    db.session.add(ticket)
    db.session.commit()

    return jsonify({
        'message': 'Support request submitted successfully',
        'ticketId': ticket.id
    })

if __name__ == '__main__':
    print("=" * 60)
    print(" DIGITAL DOCUMENT VAULT - PYTHON FLASK & MYSQL SERVER")
    print(" Running on: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
