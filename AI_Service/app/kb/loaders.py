"""Document ingestion: every .md / .txt / .pdf under knowledge/docs becomes retrievable chunks.

Chunking strategy
* Markdown: split on "## " / "### " headings (one topic per chunk, so a citation points at one rule).
* PDF / plain text: split on blank-line paragraphs.
* Any section longer than ``max_chars`` is split on sentence boundaries with a one-sentence overlap,
  so a fact that straddles the cut is still retrievable from both sides.
Chunk ids are stable ("guide:<file>:<section>[-n]"), so incremental re-indexing only re-embeds what changed.
"""

import re
from pathlib import Path

from app.kb.documents import KnowledgeDoc
from app.text import normalize

DOCS_DIR = Path(__file__).resolve().parents[2] / "knowledge" / "docs"
_SENTENCE_END = re.compile(r"(?<=[.!?…])\s+")


def _slug(text: str) -> str:
    return normalize(text).replace(" ", "-")[:60] or "section"


def split_by_size(text: str, max_chars: int = 900) -> list[str]:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text] if text else []
    sentences = _SENTENCE_END.split(text)
    chunks, current = [], []
    for sentence in sentences:
        if current and len(" ".join(current + [sentence])) > max_chars:
            chunks.append(" ".join(current))
            current = [current[-1]]  # one-sentence overlap
        current.append(sentence)
    if current:
        chunks.append(" ".join(current))
    return chunks


def _markdown_sections(text: str) -> tuple[str | None, list[tuple[str, str]]]:
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    title_match = re.search(r"^# (.+)$", text, flags=re.M)
    title = title_match.group(1).strip() if title_match else None
    sections = []
    for block in re.split(r"^#{2,3} ", text, flags=re.M)[1:]:
        heading, _, body = block.partition("\n")
        sections.append((heading.strip(), body))
    return title, sections


def _plain_sections(text: str) -> list[tuple[str, str]]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return [(f"Phần {i + 1}", p) for i, p in enumerate(paragraphs)]


def _read_pdf(path: Path) -> str:
    from pypdf import PdfReader  # optional dependency, only needed when PDFs are present

    return "\n\n".join(page.extract_text() or "" for page in PdfReader(path).pages)


def load_guide_docs(directory: Path = DOCS_DIR, max_chars: int = 900) -> list[KnowledgeDoc]:
    docs: list[KnowledgeDoc] = []
    if not directory.exists():
        return docs
    for path in sorted(directory.rglob("*")):
        suffix = path.suffix.lower()
        if suffix not in {".md", ".txt", ".pdf"}:
            continue
        if suffix == ".md":
            title, sections = _markdown_sections(path.read_text("utf-8"))
        else:
            raw = _read_pdf(path) if suffix == ".pdf" else path.read_text("utf-8")
            title, sections = None, _plain_sections(raw)
        title = title or path.stem.replace("-", " ").capitalize()
        file_id = _slug(path.stem)
        for heading, body in sections:
            for i, piece in enumerate(split_by_size(body, max_chars)):
                doc_id = f"guide:{file_id}:{_slug(heading)}" + (f"-{i + 1}" if i else "")
                docs.append(KnowledgeDoc(doc_id, "GUIDE", None, f"{title} › {heading}", piece,
                                         {"file": str(path.relative_to(directory)), "section": heading}))
    return docs
