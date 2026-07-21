from typing import List, Optional
from pydantic import BaseModel

class UserRegister(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = ""
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SSOLogin(BaseModel):
    provider: str
    name: str
    email: str

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    email: str
    newPassword: str

class UserProfileUpdate(BaseModel):
    fullName: str
    email: str
    phone: Optional[str] = ""

class UserPasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str

class UserResponse(BaseModel):
    id: int
    fullName: str
    email: str
    phone: Optional[str] = ""
    isNewUser: bool
    loginCount: int

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    name: str
    category: str
    date: str
    size: str
    type: str
    iconColor: str
    isFavorite: bool
    sharedWith: List[str] = []
    fileData: Optional[str] = None

    class Config:
        from_attributes = True

class ShareDocumentReq(BaseModel):
    email: str

class CategoryCreate(BaseModel):
    name: str
