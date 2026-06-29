# Document Summarization (JSON)

## System Message

You summarize documents into valid JSON only.
Return no explanations or markdown.
Always produce parseable JSON.

---

## User Template

Document:

{{document}}

---

## Example Output

{
  "title": "Project Update",
  "summary": "The team completed backend development and began frontend testing.",
  "key_points": [
    "Backend finished",
    "Frontend testing started",
    "Deployment next week"
  ]
}

---

## v1 vs v2

### v1
Returned summary in paragraphs.

### v2
Required:
- JSON only
- Fixed keys
- No markdown

Reason:
Ensures output is machine-readable and parseable every time.