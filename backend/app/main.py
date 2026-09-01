from fastapi import FastAPI

app = FastAPI(title="MetricMind API")


@app.get("/")
def root():
    return {
        "message": "MetricMind Backend is running"
    }