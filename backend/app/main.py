# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. Import CORSMiddleware
# from fastapi.openapi.docs import get_swagger_ui_html # for dark theme   
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from routes import auth, patients, doctors, services, billing, reports

# Lifespan context manager to handle startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(
    title="Medical Billing System API",
    lifespan=lifespan,
    # docs_url=None # For DAark Theme
)
origins = [
    "http://localhost:5173",  # Your local Vite development server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"],             
)

# Register the routes
app.include_router(auth.router)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(services.router)
app.include_router(billing.router)
app.include_router(reports.router)

# Test Route
@app.get("/")
async def root():
    return {"message": "Medical Billing API Running"}
