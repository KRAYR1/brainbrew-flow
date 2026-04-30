// Utilities to extract text from user-uploaded study files (PDF, DOCX, TXT/MD).
// Runs entirely in the browser; only the extracted text is sent to the backend.

import * as pdfjsLib from "pdfjs-dist";
// Vite-friendly worker import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite ?url import
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: unknown) => (it as { str?: string }).str ?? "")
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n\n");
}

export async function extractDocxText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

export async function extractTextFile(file: File): Promise<string> {
  return await file.text();
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx")) return extractDocxText(file);
  if (name.endsWith(".txt") || name.endsWith(".md")) return extractTextFile(file);
  // Fallback: try as text
  return extractTextFile(file);
}
