from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
import models

app = FastAPI()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/about")
def about():
    return {
        "name": "Barsarani Sahoo",
        "skills": [" Python", "FastAPI", "SQLAlchemy", "MySQL", "REST APIs"],
    }


@app.post("/add-user")
def add_user(name: str, skill: str, db: Session = Depends(get_db)):
    user = models.User(name=name, skill=skill)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.put("/users/{id}")
def update_user(id: int):
    return {"message": "User updated"}

@app.delete("/users/{id}")
def delete_user(id: int):
    return {"message": "User deleted"}


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()