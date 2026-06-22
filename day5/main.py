from fastapi import FastAPI

app = FastAPI()

@app.get("/about")
def about():
    return {
        "name": "Barsarani Sahoo",
        "skills": [
            "Git & GitHub basics",
            "Python CLI scripting",
            "Docker + FastAPI basics"
        ]
    }