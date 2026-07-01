import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
prompt_path = os.path.join(BASE_DIR, "prompts", "document-summary-json.md")

with open(prompt_path, "r", encoding="utf-8") as f:
    prompt_template = f.read()
import sys
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("ERROR: Missing GEMINI_API_KEY")
    sys.exit(1)

# Configure Gemini
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="You return ONLY valid JSON. No markdown, no backticks."
)

# Read file safely
def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"ERROR: File not found -> {path}")
        sys.exit(1)

# Ensure input argument is provided
if len(sys.argv) < 2:
    print("Usage: python demo.py input.txt")
    sys.exit(1)

# Read input document
document = read_file(sys.argv[1])



# Inject document into prompt
prompt = prompt_template.replace("{{document}}", document)

try:
    response = model.generate_content(prompt)

    # ✅ SAFE JSON CLEANING (IMPORTANT FIX)
    cleaned = (
        response.text
        .strip()
        .replace("```json", "")
        .replace("```", "")
    )

    data = json.loads(cleaned)

    print("\nParsed Output:\n")
    print(json.dumps(data, indent=2))

except json.JSONDecodeError:
    print("ERROR: Model returned invalid JSON")

except Exception as e:
    print("ERROR:", str(e))