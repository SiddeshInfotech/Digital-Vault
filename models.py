from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    plan_tier = db.Column(db.String(50), default='Free Vault')
    storage_used_bytes = db.Column(db.BigInteger, default=0)
    is_2fa_enabled = db.Column(db.Boolean, default=False)
    device = db.Column(db.String(150), default="Komal's Laptop (Windows x64)")
    is_new_user = db.Column(db.Boolean, default=True)
    login_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = db.relationship('Document', backref='owner', lazy=True, cascade="all, delete-orphan")
    categories = db.relationship('Category', backref='owner', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'fullName': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'planTier': self.plan_tier,
            'storageUsedBytes': self.storage_used_bytes,
            'is2FAEnabled': self.is_2fa_enabled,
            'device': self.device,
            'isNewUser': self.is_new_user,
            'loginCount': self.login_count,
            'createdAt': self.created_at.strftime('%b %d, %Y') if self.created_at else ''
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name
        }

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(80), nullable=False, default='Others')
    file_path = db.Column(db.String(500), nullable=True)
    file_size_bytes = db.Column(db.BigInteger, nullable=False, default=0)
    mime_type = db.Column(db.String(100), nullable=True)
    extension = db.Column(db.String(20), nullable=False, default='txt')
    icon_color = db.Column(db.String(20), nullable=False, default='#3b82f6')
    is_favorite = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    file_data_base64 = db.Column(db.Text(length=16777215), nullable=True) # MediumText for preview storage if needed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shared_records = db.relationship('SharedDocument', backref='document', lazy=True, cascade="all, delete-orphan")

    def format_size(self):
        size = self.file_size_bytes
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{(size / 1024):.1f} KB"
        else:
            return f"{(size / (1024 * 1024)):.2f} MB"

    def to_dict(self):
        shares = [s.shared_with_email for s in self.shared_records]
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'date': self.created_at.strftime('%b %d, %Y') if self.created_at else '',
            'size': self.format_size(),
            'sizeBytes': self.file_size_bytes,
            'type': self.extension,
            'iconColor': self.icon_color,
            'isFavorite': self.is_favorite,
            'isDeleted': self.is_deleted,
            'sharedWith': shares,
            'fileData': self.file_data_base64
        }

class SharedDocument(db.Model):
    __tablename__ = 'shared_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.String(64), db.ForeignKey('documents.id'), nullable=False)
    shared_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    shared_with_email = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(40), default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
