import os
from dotenv import load_dotenv
from google import genai
from groq import Groq

load_dotenv()

# Gemini client (Embeddings + Vision)
gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Groq client (Answer generation)
groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def ask_gemini(prompt: str):
    """
    Generates the final answer using Groq.
    """

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    return response.choices[0].message.content


def create_embedding(text: str):
    """
    Gemini embeddings.
    """

    response = gemini_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={
            "output_dimensionality": 768
        }
    )

    return response.embeddings[0].values


def analyze_image(
    image_bytes: bytes,
    mime_type: str,
    user_prompt: str = ""
):
    """
    First image upload.
    """

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": image_bytes
                }
            },
            {
                "text": f"""
You are an AI image understanding assistant.

First understand the entire image.

Then answer the user's request.

User request:

{user_prompt}

Only use information visible in the image.
Never guess.
"""
            }
        ]
    )

    return response.text


def answer_image_question(
    image_path: str,
    question: str
):
    """
    Used for follow-up questions.
    Gemini receives the ORIGINAL image again.
    """

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    extension = os.path.splitext(image_path)[1].lower()

    mime_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".avif": "image/avif"
    }

    mime_type = mime_types.get(
        extension,
        "image/jpeg"
    )

    return analyze_image(
        image_bytes=image_bytes,
        mime_type=mime_type,
        user_prompt=question
    )