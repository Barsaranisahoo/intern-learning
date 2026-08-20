import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


# ---------------------------------------------------------
# OpenRouter Configuration
# ---------------------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY is not configured."
    )


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)


# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

MAIN_MODEL = "openai/gpt-4o-mini"

FAST_MODEL = "openai/gpt-4o-mini"


# ---------------------------------------------------------
# Token / prompt limits
# ---------------------------------------------------------

MAX_PROMPT_CHARS = 14000

MAIN_MAX_TOKENS = 700
FAST_MAX_TOKENS = 150
SUGGESTION_MAX_TOKENS = 300


# ---------------------------------------------------------
# Utility
# ---------------------------------------------------------

def _trim_prompt(
    prompt: str,
    max_chars: int = MAX_PROMPT_CHARS
) -> str:

    if not prompt:
        return ""

    if len(prompt) <= max_chars:
        return prompt

    keep_start = int(max_chars * 0.65)
    keep_end = max_chars - keep_start

    return (
        prompt[:keep_start]
        + "\n\n"
        "[...middle of context omitted to reduce prompt size...]"
        "\n\n"
        + prompt[-keep_end:]
    )


# ---------------------------------------------------------
# OpenRouter Request
# ---------------------------------------------------------

def _openrouter_chat(
    prompt: str,
    model: str,
    max_tokens: int,
    system_prompt: str | None = None,
):

    messages = []

    if system_prompt:

        messages.append(
            {
                "role": "system",
                "content": system_prompt,
            }
        )

    messages.append(
        {
            "role": "user",
            "content": prompt,
        }
    )

    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.2,
        max_tokens=max_tokens,
        stream=False,
    )

    if not completion.choices:
        return ""

    message = completion.choices[0].message

    answer = message.content

    if not answer or not answer.strip():
        return ""

    return answer.strip()


# ---------------------------------------------------------
# Main LLM
# ---------------------------------------------------------

def ask_llm(prompt: str):

    prompt = _trim_prompt(prompt)

    system_prompt = """
You are Smart Support Assistant.

Rules:

- Answer general questions normally.
- Use provided document context when relevant.
- For document questions, answer ONLY from the provided document context.
- Do not invent facts that are not present in the document.
- If the requested information is not available in the provided context,
  clearly say that it is not available.
- If the content is source code, behave like a senior software engineer.
- Explain functions, classes, methods, components, APIs, imports,
  dependencies, and file relationships when supported by the context.
- Keep answers clear and reasonably concise.
- Do not unnecessarily repeat information.
- Do not provide excessively long answers unless the user asks for detail.
- Never return an empty answer.
"""

    try:

        print("\n========== OPENROUTER REQUEST ==========")
        print("MODEL:", MAIN_MODEL)
        print("PROMPT CHARACTERS:", len(prompt))
        print("========================================\n")

        answer = _openrouter_chat(
            prompt=prompt,
            model=MAIN_MODEL,
            max_tokens=MAIN_MAX_TOKENS,
            system_prompt=system_prompt,
        )

        print("\n========== OPENROUTER RESPONSE ==========")
        print(answer)
        print("==========================================\n")

        if not answer:

            return (
                "I could not generate an answer. "
                "Please try again."
            )

        return answer

    except Exception as e:

        print("OpenRouter Error:", e)

        raise


# ---------------------------------------------------------
# Fast LLM
# ---------------------------------------------------------

def ask_llm_fast(prompt: str):

    prompt = _trim_prompt(prompt)

    try:

        print("\n========== FAST OPENROUTER REQUEST ==========")
        print("MODEL:", FAST_MODEL)
        print("PROMPT CHARACTERS:", len(prompt))
        print("=============================================\n")

        answer = _openrouter_chat(
            prompt=prompt,
            model=FAST_MODEL,
            max_tokens=FAST_MAX_TOKENS,
            system_prompt=None,
        )

        if not answer:
            return ""

        return answer

    except Exception as e:

        print("Fast OpenRouter Error:", e)

        raise


# ---------------------------------------------------------
# Suggested Questions
# ---------------------------------------------------------

def generate_suggested_questions(
    document_text: str,
    previous_questions: list[str] | None = None
):

    if previous_questions is None:
        previous_questions = []

    previous = "\n".join(
        f"- {q}"
        for q in previous_questions
    )

    document_text = _trim_prompt(
        document_text,
        max_chars=10000
    )

    prompt = f"""
Read the document below.

Generate exactly 6 useful questions about the document.

IMPORTANT:

- Return ONLY questions.
- Put exactly one question on each line.
- Do not number them.
- Do not use bullets.
- Do not provide answers.
- Do not provide explanations.
- Do not use JSON.
- Each question must be under 15 words.
- Questions must be based ONLY on the document.
- Cover different parts of the document.
- Do not repeat previous questions.

Previous questions:

{previous}

DOCUMENT:

{document_text}
"""

    try:

        print("\n========== SUGGESTION REQUEST ==========")
        print("MODEL:", FAST_MODEL)
        print("DOCUMENT CHARACTERS:", len(document_text))
        print("========================================\n")

        text = _openrouter_chat(
            prompt=prompt,
            model=FAST_MODEL,
            max_tokens=SUGGESTION_MAX_TOKENS,
            system_prompt=(
                "Generate exactly six useful "
                "document-specific questions. "
                "Return one question per line "
                "and nothing else."
            ),
        )

        print(
            "\n========== RAW SUGGESTION RESPONSE =========="
        )
        print(repr(text))
        print("===============================================\n")

        if not text:

            print(
                "Suggestion model returned empty content."
            )

            return []

        questions = []

        for line in text.splitlines():

            question = line.strip()

            # Remove numbering
            if (
                len(question) >= 2
                and question[0].isdigit()
                and question[1] in [".", ")"]
            ):
                question = question[2:].strip()

            elif (
                len(question) >= 3
                and question[:2].isdigit()
                and question[2] in [".", ")"]
            ):
                question = question[3:].strip()

            # Remove bullets
            question = question.lstrip(
                "-•* "
            ).strip()

            if (
                question
                and question not in questions
            ):
                questions.append(question)

        return questions[:6]

    except Exception as e:

        print(
            "Suggestion Error:",
            e
        )

        return [
            "Summarize this document.",
            "What is the purpose of this document?",
            "What are the key points?",
            "What are the important sections?",
            "Explain the main concepts.",
            "What are the main conclusions?"
        ]