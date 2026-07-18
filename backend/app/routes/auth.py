# app/routes/auth.py
from fastapi import APIRouter, HTTPException, status, Depends, Form
from app.schemas.user import UserCreate, UserResponse, UserLogin  # Added UserLogin
from app.schemas.token import Token
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    # 1. Check if user already exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )

    # 2. Convert Pydantic model to dict and hash password
    user_dict = user.model_dump()
    hashed_password = get_password_hash(user_dict.pop("password"))
    
    # 3. Prepare database document
    db_user = {
        "username": user_dict["username"],
        "email": user_dict["email"],
        "password_hash": hashed_password,
        "role": "staff" # Default role
    }

    # 4. Insert into database
    await db["users"].insert_one(db_user)
    
    # 5. Return response (FastAPI will use UserResponse schema to format this)
    return db_user

# @router.post("/login", response_model=Token)
# async def login(credentials: UserLogin):


    # 1. Find the user by email (OAuth2 maps 'username' to our email)
    # user = await db["users"].find_one({"email": credentials.email})
    
    # # 2. Verify user exists and password is correct using your bcrypt function
    # if not user or not verify_password(credentials.password, user["password_hash"]):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect email or password",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    
    # # 3. Generate JWT token
    # access_token = create_access_token(
    #     data={"sub": user["email"], "role": user.get("role", "staff")}
    # )
    
    # # 4. Return token
    # return {"access_token": access_token, "token_type": "bearer"}   


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),  # Swagger form-data sends 'username' for email mapping
    password: str = Form(...)
):
    # Find user using the form field value
    user = await db["users"].find_one({"email": username})
    
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "staff")}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}