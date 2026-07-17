import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const checkOnly = process.argv.includes("--check");

const manuals = [
  {
    source: "docs/manual-admin-pnpu.md",
    target: "docs/manuales-html/manual-admin-pnpu.html",
    title: "Manual del administrador PNPU",
  },
  {
    source: "docs/manual-responsables-editoriales.md",
    target: "docs/manuales-html/manual-responsables-editoriales.html",
    title: "Manual para responsables de editoriales",
  },
];

for (const manual of manuals) {
  const markdown = await readFile(manual.source, "utf8");
  const html = renderDocument(manual.title, markdown);

  if (checkOnly) {
    const current = await readFile(manual.target, "utf8").catch(() => null);

    if (current !== html) {
      throw new Error(`${manual.target} is outdated. Run npm run docs:manuals:html.`);
    }

    console.log(`Checked ${manual.target}`);
  } else {
    await mkdir(path.dirname(manual.target), { recursive: true });
    await writeFile(manual.target, html, "utf8");
    console.log(`Generated ${manual.target}`);
  }
}

function renderDocument(title, markdown) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --text: #171717;
      --muted: #525252;
      --line: #d4d4d4;
      --soft: #f5f5f5;
      --accent: #166534;
      --accent-soft: #ecfdf5;
    }
    body {
      margin: 0;
      background: #ffffff;
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
    }
    main {
      max-width: 920px;
      margin: 0 auto;
      padding: 40px 24px 56px;
    }
    h1 {
      margin: 0 0 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--accent);
      font-size: 2rem;
      line-height: 1.2;
    }
    h2 {
      margin-top: 36px;
      padding-top: 8px;
      font-size: 1.35rem;
      line-height: 1.3;
    }
    h3 {
      margin-top: 28px;
      font-size: 1.1rem;
    }
    p {
      margin: 12px 0;
    }
    ul, ol {
      padding-left: 28px;
    }
    li {
      margin: 6px 0;
    }
    table {
      width: 100%;
      margin: 18px 0;
      border-collapse: collapse;
      font-size: 0.95rem;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 9px 10px;
      vertical-align: top;
    }
    th {
      background: var(--accent-soft);
      text-align: left;
    }
    code {
      border-radius: 4px;
      background: var(--soft);
      padding: 2px 4px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.92em;
    }
    pre {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--soft);
      padding: 14px;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    .meta {
      margin-bottom: 28px;
      color: var(--muted);
      font-size: 0.95rem;
    }
    @media print {
      main {
        max-width: none;
        padding: 20mm 16mm;
      }
      h1 {
        font-size: 1.6rem;
      }
      a {
        color: inherit;
      }
    }
  </style>
</head>
<body>
  <main>
    <p class="meta">Plataforma Nacional de Publicaciones Universitarias · Documento operativo</p>
${markdownToHtml(markdown)}
  </main>
</body>
</html>
`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        flushParagraph(html, paragraph);
        paragraph = [];
        listType = closeList(html, listType);
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(html, paragraph);
      paragraph = [];
      listType = closeList(html, listType);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading !== null) {
      flushParagraph(html, paragraph);
      paragraph = [];
      listType = closeList(html, listType);
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (isTableStart(lines, index)) {
      flushParagraph(html, paragraph);
      paragraph = [];
      listType = closeList(html, listType);
      const { table, nextIndex } = readTable(lines, index);
      html.push(renderTable(table));
      index = nextIndex;
      continue;
    }

    const unordered = /^-\s+(.+)$/.exec(line);
    if (unordered !== null) {
      flushParagraph(html, paragraph);
      paragraph = [];
      if (listType !== "ul") {
        listType = closeList(html, listType);
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered !== null) {
      flushParagraph(html, paragraph);
      paragraph = [];
      if (listType !== "ol") {
        listType = closeList(html, listType);
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph(html, paragraph);
  closeList(html, listType);

  return html.map((line) => `    ${line}`).join("\n");
}

function flushParagraph(html, paragraph) {
  if (paragraph.length > 0) {
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }
}

function closeList(html, listType) {
  if (listType !== null) {
    html.push(`</${listType}>`);
  }
  return null;
}

function isTableStart(lines, index) {
  return (
    lines[index]?.trim().startsWith("|") === true &&
    lines[index + 1]?.trim().startsWith("|") === true &&
    lines[index + 1].includes("---")
  );
}

function readTable(lines, startIndex) {
  const table = [];
  let index = startIndex;

  while (lines[index]?.trim().startsWith("|") === true) {
    table.push(lines[index]);
    index += 1;
  }

  return { table, nextIndex: index - 1 };
}

function renderTable(rows) {
  const [header, , ...body] = rows.map(splitTableRow);
  const head = `<thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`;
  const bodyRows = body
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<table>${head}<tbody>${bodyRows}</tbody></table>`;
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
