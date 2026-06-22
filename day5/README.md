# Day 5 - Dockerized FastAPI Endpoint

## Overview
A simple FastAPI application containerized using Docker.

## Build

```bash
docker build -t day5-api .
```

## Run

```bash
docker run -p 8000:8000 day5-api
```

If port 8000 is already in use:

```bash
docker run -p 8001:8000 day5-api
```

## Test

Open:

```text
http://localhost:8000/docs
```

or

```text
http://localhost:8000/about
```

## Sample Response

```json
{
  "name": "Barsarani Sahoo",
  "skills": [
    "Git & GitHub basics",
    "Python CLI scripting",
    "Docker + FastAPI basics"
  ]
}
```

## Day 5 Update

- Built a FastAPI backend API and Dockerized it
- Created `/about` endpoint returning JSON response
- Learned FastAPI routing and basic API development
- Containerized application using Docker and understood port mapping...

