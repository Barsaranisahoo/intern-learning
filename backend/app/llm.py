import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env")

client = Groq(api_key=api_key)


def ask_llm(prompt: str):
    try:
        print("\n========== PROMPT SENT TO GROQ ==========")
        print(prompt)
        print("=========================================\n")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """
You are Smart Support Assistant, an AI assistant that can answer
questions about documents, images, and source code.

Rules:

- Answer general questions normally.
- Use the provided context whenever it is relevant.
- If the uploaded content is source code, behave like a senior software engineer.
- Explain functions, classes, methods, components, and APIs clearly.
- Mention important relationships between files if the context contains them.
- Keep code formatting intact when quoting snippets.
- Do not invent code that is not present in the uploaded content.
- If the answer cannot be found in the uploaded document or code,
  clearly say that the information is not available.
- Never return an empty answer.
"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1024
        )

        # Debug Groq complete response
        print("======================")
        print("GROQ FULL RESPONSE:")
        print(response)
        print("======================")

        answer = response.choices[0].message.content

        print("======================")
        print("GROQ TEXT RESPONSE:")
        print(answer)
        print("======================")

        if not answer or answer.strip() == "":
            return "I could not generate an answer. Please try again."

        return answer.strip()

    except Exception as e:
        print("Groq Error:", e)
        raise
def generate_suggested_questions(
    document_text: str,
    previous_questions: list[str] | None = None
):
    """
    Generate document-specific suggested questions.

    Returns:
        List[str]
    """

    if previous_questions is None:
        previous_questions = []

    previous = "\n".join(
        f"- {q}" for q in previous_questions
    )

    prompt = f"""
You are an AI assistant that helps users explore documents.

Read the uploaded document and generate EXACTLY 6 useful questions.

Rules:
- Questions MUST be based ONLY on the document.
- Make them natural.
- Make them useful.
- Keep each question under 15 words.
- Cover different parts of the document.
- Do NOT number the questions.
- Do NOT use bullets.
- Do NOT explain anything.
- Return ONE question per line.
- Do NOT repeat these previous questions:

{previous}

Document:

{document_text}
"""

    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Generate only document-specific questions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_tokens=256
        )

        text = response.choices[0].message.content.strip()

        questions = [
            line.strip("-• ").strip()
            for line in text.splitlines()
            if line.strip()
        ]

        # Remove duplicates
        unique = []

        for q in questions:

            if q not in unique:
                unique.append(q)

        return unique[:6]

    except Exception as e:

        print("Suggestion Error:", e)

        return [
            "Summarize this document.",
            "What is the purpose of this document?",
            "Explain the key points.",
            "What should I pay attention to?",
            "Explain this simply.",
            "What are the conclusions?"
        ]