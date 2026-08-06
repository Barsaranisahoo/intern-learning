import re


CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".php",
    ".rb",
    ".swift",
    ".kt",
    ".rs",
}


def _is_code(text: str) -> bool:
    """
    Detect whether the uploaded content is source code.
    """

    indicators = [
        r"\bdef\s+\w+\(",
        r"\bclass\s+\w+",
        r"\bfunction\s+\w+",
        r"\bconst\s+\w+",
        r"\blet\s+\w+",
        r"\bvar\s+\w+",
        r"\bimport\s+",
        r"\bfrom\s+",
        r"#include",
        r"\bpublic\s+class\b",
        r"\binterface\b",
        r"\bexport\s+default\b",
    ]

    matches = sum(
        bool(re.search(pattern, text))
        for pattern in indicators
    )

    return matches >= 2


def create_chunks(text, chunk_size=500, overlap=50):

    if _is_code(text):

        chunks = []

        current = []

        lines = text.splitlines()

        separators = (
            "def ",
            "class ",
            "async def ",
            "function ",
            "const ",
            "let ",
            "var ",
            "export ",
            "interface ",
            "public class ",
            "private ",
            "protected ",
        )

        for line in lines:

            if (
                current
                and any(
                    line.strip().startswith(s)
                    for s in separators
                )
            ):

                chunks.append("\n".join(current))
                current = []

            current.append(line)

        if current:
            chunks.append("\n".join(current))

        return chunks

    # Normal document chunking

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunks.append(text[start:end])

        start += chunk_size - overlap

    return chunks