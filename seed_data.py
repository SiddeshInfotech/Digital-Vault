import uuid
from datetime import datetime, timedelta
from models import db, User, Category, Document, SharedDocument

def seed_default_data(app):
    with app.app_context():
        # Check if default user exists
        user = User.query.filter_by(email='komal.patil@gmail.com').first()
        if not user:
            user = User(
                full_name='Komal Patil',
                email='komal.patil@gmail.com',
                phone='9876543210',
                plan_tier='Free Vault',
                is_new_user=False,
                login_count=1
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            print("[Seed] Created default user: komal.patil@gmail.com / password123")

        # Seed categories if missing
        default_cats = ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']
        existing_cat_names = [c.name for c in Category.query.filter_by(user_id=user.id).all()]
        
        for cat_name in default_cats:
            if cat_name not in existing_cat_names:
                db.session.add(Category(user_id=user.id, name=cat_name))
        db.session.commit()

        # Seed initial default documents if none exist for user
        doc_count = Document.query.filter_by(user_id=user.id).count()
        if doc_count == 0:
            now = datetime.utcnow()
            initial_docs = [
                {
                    "id": "1",
                    "name": "Project Proposal.pdf",
                    "category": "Proposals",
                    "size_bytes": 2516582, # 2.4 MB
                    "extension": "pdf",
                    "icon_color": "#ef4444",
                    "is_favorite": True,
                    "created_at": now - timedelta(days=2),
                    "shared": []
                },
                {
                    "id": "2",
                    "name": "Meeting Notes.docx",
                    "category": "Meetings",
                    "size_bytes": 1153433, # 1.1 MB
                    "extension": "doc",
                    "icon_color": "#3b82f6",
                    "is_favorite": False,
                    "created_at": now - timedelta(days=3),
                    "shared": ["komal.patil@gmail.com"]
                },
                {
                    "id": "3",
                    "name": "Budget Report.xlsx",
                    "category": "Finance",
                    "size_bytes": 1887436, # 1.8 MB
                    "extension": "xls",
                    "icon_color": "#10b981",
                    "is_favorite": True,
                    "created_at": now - timedelta(days=4),
                    "shared": []
                },
                {
                    "id": "4",
                    "name": "Presentation.pptx",
                    "category": "Presentations",
                    "size_bytes": 4508876, # 4.3 MB
                    "extension": "ppt",
                    "icon_color": "#f97316",
                    "is_favorite": False,
                    "created_at": now - timedelta(days=5),
                    "shared": []
                },
                {
                    "id": "5",
                    "name": "Vendor Contract.pdf",
                    "category": "Contracts",
                    "size_bytes": 3355443, # 3.2 MB
                    "extension": "pdf",
                    "icon_color": "#ef4444",
                    "is_favorite": False,
                    "created_at": now - timedelta(days=7),
                    "shared": ["team@vault.com"]
                },
                {
                    "id": "6",
                    "name": "System Architecture.png",
                    "category": "Others",
                    "size_bytes": 5347737, # 5.1 MB
                    "extension": "png",
                    "icon_color": "#8b5cf6",
                    "is_favorite": True,
                    "created_at": now - timedelta(days=10),
                    "shared": []
                }
            ]

            total_storage = 0
            for d in initial_docs:
                doc = Document(
                    id=d["id"],
                    user_id=user.id,
                    name=d["name"],
                    category=d["category"],
                    file_size_bytes=d["size_bytes"],
                    extension=d["extension"],
                    icon_color=d["icon_color"],
                    is_favorite=d["is_favorite"],
                    created_at=d["created_at"]
                )
                db.session.add(doc)
                total_storage += d["size_bytes"]

                for email_share in d["shared"]:
                    db.session.add(SharedDocument(
                        document_id=d["id"],
                        shared_by_user_id=user.id,
                        shared_with_email=email_share
                    ))

            user.storage_used_bytes = total_storage
            db.session.commit()
            print(f"[Seed] Created 6 default initial documents for {user.email}")
