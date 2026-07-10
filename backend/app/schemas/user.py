# app/schemas/user.py
from pydantic import BaseModel, EmailStr

# Schema for incoming registration requests
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Schema for outgoing responses (Notice: NO password here!)
class UserResponse(BaseModel):
    username: str
    email: EmailStr
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str    