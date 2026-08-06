from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import documents, chat, features, images

app = FastAPI(title="Smart Support Assistant")

Base.metadata.create_all(bind=engine)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(features.router)
app.include_router(images.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}