import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// pdf-parse v2.x exports { default: fn } via createRequire — unwrap it
const pdfModule = require("pdf-parse");
const pdf = typeof pdfModule === "function" ? pdfModule : (pdfModule.default || pdfModule);


export const parsePdfFromUrl = async (url) => {
  if (!url || !url.endsWith(".pdf")) {
    return "";
  }

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const data = await pdf(buffer);

    let text = data.text;

    // ── Step 1: Basic cleanup ──────────────────────────────────────────────
    // Remove null bytes and non-printable control characters (except newline/tab)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

    // Normalize line endings
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Remove common page number patterns (e.g., "Page 1 of 3", "1 | 3", "— 1 —")
    text = text.replace(/^\s*(page\s*\d+\s*(of\s*\d+)?|\d+\s*\|\s*\d+|—\s*\d+\s*—)\s*$/gim, "");

    // Remove repeated header/footer lines that appear on every page
    const lines = text.split("\n");
    const lineFrequency = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 2 && trimmed.length < 80) {
        lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
      }
    }
    // Lines appearing 3+ times are likely headers/footers — remove them
    const repeatedLines = new Set(
      Object.entries(lineFrequency)
        .filter(([, count]) => count >= 3 && data.numpages > 1)
        .map(([line]) => line)
    );

    text = lines
      .filter((line) => !repeatedLines.has(line.trim()))
      .join("\n");

    // ── Step 2: Collapse excessive whitespace ──────────────────────────────
    // Collapse 3+ consecutive newlines into 2
    text = text.replace(/\n{3,}/g, "\n\n");
    // Collapse multiple spaces/tabs into single space (but preserve newlines)
    text = text.replace(/[^\S\n]+/g, " ");
    text = text.trim();

    // ── Step 3: Extract structured sections ────────────────────────────────
    const sections = extractSections(text);

    // ── Step 4: Build structured output ────────────────────────────────────
    const structuredText = buildStructuredResume(sections, text);

    // Return truncated to save tokens (3000 chars is generous for most resumes)
    return structuredText.substring(0, 3000);
  } catch (error) {
    console.error("Failed to parse PDF from URL:", error.message);
    return "";
  }
};

/**
 * Extracts named sections from raw resume text using common heading patterns.
 */
function extractSections(text) {
  const sectionHeaders = "experience|education|skills|projects|certifications|awards|languages|interests|hobbies|references|summary";

  const sectionDefs = [
    {
      key: "summary",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:professional\\s+)?(?:summary|profile|about(?:\\s+me)?|objective)\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
    {
      key: "experience",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:work\\s+)?(?:experience|employment\\s+history|work\\s+history|professional\\s+experience)\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
    {
      key: "education",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:education|academic|qualifications|academic\\s+background)\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
    {
      key: "skills",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:(?:technical|core|key|professional)\\s+)?skills\\s*[:\\-]?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
    {
      key: "projects",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:projects|personal\\s+projects|key\\s+projects|portfolio)\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
    {
      key: "certifications",
      pattern: new RegExp(
        "(?:^|\\n)\\s*(?:certifications?|licenses?|credentials)\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:" + sectionHeaders + ")\\b|\\n\\n\\n|$)",
        "i"
      ),
    },
  ];

  const sections = {};
  for (const { key, pattern } of sectionDefs) {
    const match = text.match(pattern);
    if (match && match[1]) {
      sections[key] = match[1].replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  return sections;
}

/**
 * Builds a structured, readable resume string from extracted sections.
 * Falls back to cleaned raw text if no sections are detected.
 */
function buildStructuredResume(sections, rawText) {
  const parts = [];

  if (sections.summary) {
    parts.push(`SUMMARY:\n${sections.summary.slice(0, 400)}`);
  }

  if (sections.skills) {
    // Skills are often comma-separated — normalize
    const skills = sections.skills
      .replace(/[•·▪▸►]/g, ",")
      .split(/[,\n]/)
      .map((s) => s.trim().replace(/^[-–—•]\s*/, ""))
      .filter((s) => s.length > 0 && s.length < 60)
      .slice(0, 30);
    if (skills.length > 0) {
      parts.push(`SKILLS: ${skills.join(", ")}`);
    }
  }

  if (sections.experience) {
    parts.push(`EXPERIENCE:\n${sections.experience.slice(0, 800)}`);
  }

  if (sections.education) {
    parts.push(`EDUCATION:\n${sections.education.slice(0, 400)}`);
  }

  if (sections.projects) {
    parts.push(`PROJECTS:\n${sections.projects.slice(0, 500)}`);
  }

  if (sections.certifications) {
    parts.push(`CERTIFICATIONS:\n${sections.certifications.slice(0, 300)}`);
  }

  // If we extracted meaningful sections, use them; otherwise fall back to cleaned raw text
  if (parts.length >= 2) {
    return parts.join("\n\n");
  }

  // Fallback: return cleaned raw text
  return rawText;
}
