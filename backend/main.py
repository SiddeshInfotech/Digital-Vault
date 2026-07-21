import os
import sys
import shutil
import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, get_db, Base
import models
import schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Digital Document Vault API",
    description="Python FastAPI backend with MySQL & SQLite support for Digital Document Vault",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def hash_password(password: str) -> str:
    return f"hashed_{password}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashed_password == f"hashed_{plain_password}" or hashed_password == plain_password

def seed_default_documents(user_id: int, db: Session):
    default_docs = [
        { "id": f"seed_1_{user_id}", "name": "Project Proposal.pdf", "category": "Proposals", "date": "May 20, 2024", "size": "2.4 MB", "type": "pdf", "icon_color": "#ef4444", "is_favorite": True },
        { "id": f"seed_2_{user_id}", "name": "Meeting Notes.docx", "category": "Meetings", "date": "May 19, 2024", "size": "1.1 MB", "type": "doc", "icon_color": "#3b82f6", "is_favorite": False },
        { "id": f"seed_3_{user_id}", "name": "Budget Report.xlsx", "category": "Finance", "date": "May 18, 2024", "size": "1.8 MB", "type": "xls", "icon_color": "#10b981", "is_favorite": True },
        { "id": f"seed_4_{user_id}", "name": "Presentation.pptx", "category": "Presentations", "date": "May 17, 2024", "size": "4.3 MB", "type": "ppt", "icon_color": "#f97316", "is_favorite": False },
        { "id": f"seed_5_{user_id}", "name": "Vendor Contract.pdf", "category": "Contracts", "date": "May 15, 2024", "size": "3.2 MB", "type": "pdf", "icon_color": "#ef4444", "is_favorite": False },
        { "id": f"seed_6_{user_id}", "name": "System Architecture.png", "category": "Others", "date": "May 10, 2024", "size": "5.1 MB", "type": "png", "icon_color": "#8b5cf6", "is_favorite": True }
    ]

    for d in default_docs:
        doc_obj = models.Document(
            id=d["id"],
            user_id=user_id,
            name=d["name"],
            category=d["category"],
            date=d["date"],
            size=d["size"],
            type=d["type"],
            icon_color=d["icon_color"],
            is_favorite=d["is_favorite"],
            is_trash=False
        )
        db.add(doc_obj)
    
    default_categories = ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']
    for cat_name in default_categories:
        cat_obj = models.Category(user_id=user_id, name=cat_name)
        db.add(cat_obj)

    db.commit()


@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = models.User(
        full_name=user_data.fullName,
        email=user_data.email.lower(),
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        is_new_user=True,
        login_count=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    seed_default_documents(new_user.id, db)

    return {
        "id": new_user.id,
        "fullName": new_user.full_name,
        "email": new_user.email,
        "phone": new_user.phone or "",
        "isNewUser": True,
        "loginCount": 1
    }


@app.post("/api/auth/login", response_model=schemas.UserResponse)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email.lower()).first()
    
    if not user and db.query(models.User).count() == 0:
        default_user = models.User(
            full_name="Komal Patil",
            email="komal.patil@gmail.com",
            phone="9876543210",
            password_hash=hash_password("password123"),
            is_new_user=False,
            login_count=1
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        seed_default_documents(default_user.id, db)
        
        if login_data.email.lower() == "komal.patil@gmail.com":
            user = default_user

    if not user:
        raise HTTPException(status_code=404, detail="Wrong email")
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Wrong password")

    user.login_count += 1
    db.commit()

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "isNewUser": user.is_new_user or user.login_count == 1,
        "loginCount": user.login_count
    }


@app.post("/api/auth/sso", response_model=schemas.UserResponse)
def sso_login(sso_data: schemas.SSOLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == sso_data.email.lower()).first()
    
    if not user:
        user = models.User(
            full_name=sso_data.name,
            email=sso_data.email.lower(),
            phone="9876543210",
            password_hash=hash_password("sso_authenticated"),
            is_new_user=True,
            login_count=1
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        seed_default_documents(user.id, db)
    else:
        user.login_count += 1
        db.commit()

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "isNewUser": user.is_new_user,
        "loginCount": user.login_count
    }


@app.post("/api/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordReq, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found")
    return {"message": "Verification instructions sent"}


@app.post("/api/auth/reset-password")
def reset_password(req: schemas.ResetPasswordReq, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found")
    
    user.password_hash = hash_password(req.newPassword)
    db.commit()
    return {"message": "Password reset successfully"}


@app.get("/api/user/profile")
def get_profile(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "isNewUser": user.is_new_user,
        "loginCount": user.login_count
    }


@app.put("/api/user/profile")
def update_profile(profile_data: schemas.UserProfileUpdate, current_email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == current_email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.full_name = profile_data.fullName
    user.email = profile_data.email.lower()
    user.phone = profile_data.phone
    db.commit()

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "isNewUser": user.is_new_user,
        "loginCount": user.login_count
    }


@app.put("/api/user/change-password")
def change_password(pwd_data: schemas.UserPasswordUpdate, email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(pwd_data.currentPassword, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user.password_hash = hash_password(pwd_data.newPassword)
    db.commit()
    return {"message": "Password updated successfully"}


def format_doc_response(doc: models.Document, db: Session) -> dict:
    shares = db.query(models.SharedDocument).filter(models.SharedDocument.document_id == doc.id).all()
    shared_emails = [s.shared_with_email for s in shares]
    
    return {
        "id": doc.id,
        "name": doc.name,
        "category": doc.category,
        "date": doc.date,
        "size": doc.size,
        "type": doc.type,
        "iconColor": doc.icon_color,
        "isFavorite": doc.is_favorite,
        "sharedWith": shared_emails,
        "fileData": doc.file_data
    }

@app.get("/api/documents")
def get_documents(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        return []
    
    docs = db.query(models.Document).filter(
        models.Document.user_id == user.id,
        models.Document.is_trash == False
    ).order_by(models.Document.created_at.desc()).all()

    return [format_doc_response(doc, db) for doc in docs]


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    email: str = Form(...),
    category: str = Form("Others"),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'file'
    color = '#3b82f6'
    if ext in ['pdf']: color = '#ef4444'
    if ext in ['xls', 'xlsx', 'csv']: color = '#10b981'
    if ext in ['ppt', 'pptx']: color = '#f97316'
    if ext in ['png', 'jpg', 'jpeg']: color = '#8b5cf6'

    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    size_str = f"{file_size_mb:.2f} MB" if file_size_mb >= 0.1 else f"{(len(content)/1024):.1f} KB"

    doc_id = f"doc_{int(datetime.datetime.utcnow().timestamp())}_{os.urandom(3).hex()}"
    saved_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)

    formatted_date = datetime.datetime.now().strftime("%b %d, %Y")

    new_doc = models.Document(
        id=doc_id,
        user_id=user.id,
        name=file.filename,
        category=category if category != 'All' else 'Others',
        date=formatted_date,
        size=size_str,
        type=ext,
        icon_color=color,
        file_path=file_path,
        is_favorite=False,
        is_trash=False
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return format_doc_response(new_doc, db)


@app.put("/api/documents/{doc_id}/favorite")
def toggle_favorite(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_favorite = not doc.is_favorite
    db.commit()
    return {"id": doc.id, "isFavorite": doc.is_favorite}


@app.post("/api/documents/{doc_id}/share")
def share_document(doc_id: str, share_req: schemas.ShareDocumentReq, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    existing_share = db.query(models.SharedDocument).filter(
        models.SharedDocument.document_id == doc_id,
        models.SharedDocument.shared_with_email == share_req.email.lower()
    ).first()

    if not existing_share:
        new_share = models.SharedDocument(
            document_id=doc_id,
            shared_with_email=share_req.email.lower()
        )
        db.add(new_share)
        db.commit()

    return {"message": f"Document shared with {share_req.email}"}


@app.delete("/api/documents/{doc_id}")
def move_to_trash(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_trash = True
    db.commit()
    return {"message": "Document moved to trash"}


@app.get("/api/documents/{doc_id}/download")
def download_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.file_path and os.path.exists(doc.file_path):
        return FileResponse(path=doc.file_path, filename=doc.name)
    
    return JSONResponse(
        status_code=200,
        content={"message": "Document record active", "name": doc.name, "category": doc.category}
    )


@app.get("/api/trash")
def get_trash(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        return []
    
    trash_docs = db.query(models.Document).filter(
        models.Document.user_id == user.id,
        models.Document.is_trash == True
    ).all()

    return [format_doc_response(doc, db) for doc in trash_docs]


@app.post("/api/trash/{doc_id}/restore")
def restore_doc(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_trash = False
    db.commit()
    return {"message": "Document restored from trash"}


@app.delete("/api/trash/{doc_id}/permanent")
def permanent_delete(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document permanently deleted"}


@app.get("/api/categories")
def get_categories(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        return ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']

    cats = db.query(models.Category).filter(models.Category.user_id == user.id).all()
    cat_names = [c.name for c in cats]

    default_cats = ['Proposals', 'Meetings', 'Finance', 'Presentations', 'Contracts', 'Others']
    for dc in default_cats:
        if dc not in cat_names:
            cat_names.append(dc)

    return cat_names


@app.post("/api/categories")
def create_category(cat: schemas.CategoryCreate, email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.Category).filter(
        models.Category.user_id == user.id,
        models.Category.name == cat.name.strip()
    ).first()

    if not existing:
        new_cat = models.Category(user_id=user.id, name=cat.name.strip())
        db.add(new_cat)
        db.commit()

    return {"name": cat.name.strip()}


@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Digital Document Vault Backend",
        "docs_url": "/docs"
    }
