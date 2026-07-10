# app/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# 1. Initialize the client and database reference ONCE globally at the module level
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

async def connect_to_mongo():
    """
    This function should ONLY verify that the pre-initialized connection is healthy.
    Do NOT instantiate client or db again here.
    """
    try:
        # A simple ping tells us if our credentials in .env are working
        await client.admin.command('ping')
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        raise e

async def close_mongo_connection():
    # Since client is global at the top level, we can close it safely here
    if client:
        client.close()
        print("Closed MongoDB connection.")

# # app/database.py
# import os
# from motor.motor_asyncio import AsyncIOMotorClient
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# MONGODB_URL = os.getenv("MONGODB_URL")
# DATABASE_NAME = os.getenv("DATABASE_NAME")

# # Initialize the client globally
# client = AsyncIOMotorClient(MONGODB_URL)
# db = client[DATABASE_NAME]

# async def connect_to_mongo():
#     global client, db
#     client = AsyncIOMotorClient(MONGODB_URL)
#     db = client[DATABASE_NAME]
#     print("Connected to MongoDB!")

# async def close_mongo_connection():
#     global client
#     if client:
#         client.close()
#         print("Closed MongoDB connection.")