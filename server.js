// server.js
// Simple LaTeX → PDF compiler server using Tectonic (preferred) or pdflatex (fallback)

import express from "express";
import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Accept JSON (LaTeX text)
app.use(express.json({ limit: "5mb" }));
// Serve static files (index.html) from current folder
app.use(express.static(__dirname));

// Serve AI configuration from environment variables
app.get("/api/ai-config", (req, res) => {
  res.json({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7
  });
});

/** detect if a command exists by trying `--version` */
async function hasCmd(cmd, args = ["--version"]) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "ignore" });
    p.on("error", () => resolve(false));
    p.on("exit", (code) => resolve(code === 0));
  });
}

async function pickEngine() {
  if (await hasCmd("tectonic")) return "tectonic";
  if (await hasCmd("pdflatex")) return "pdflatex";
  return null;
}

function writeTempTree(tex) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "latex-"));
  const main = path.join(root, "main.tex");
  fs.writeFileSync(main, tex, "utf8");
  return { root, main };
}

function rmrf(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch {}
}

function runTectonic(root, main) {
  return new Promise((resolve) => {
    // Tectonic: compile into the same temp dir
    const args = ["-X", "compile", main, "--outdir", root, "--keep-logs"];
    const proc = spawn("tectonic", args, { cwd: root });
    let out = "", err = "";
    proc.stdout.on("data", d => out += d.toString());
    proc.stderr.on("data", d => err += d.toString());
    proc.on("close", (code) => {
      resolve({
        code,
        log: out + (err ? "\n" + err : ""),
        pdfPath: path.join(root, "main.pdf")
      });
    });
  });
}

function runPdfLaTeX(root, main) {
  return new Promise((resolve) => {
    // pdflatex: no shell-escape; output to root; run twice for TOC/refs if needed
    const common = ["-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "-output-directory", root, main];

    let out = "", err = "";
    const runOnce = () => new Promise((res) => {
      const proc = spawn("pdflatex", common, { cwd: root });
      let o = "", e = "";
      proc.stdout.on("data", d => o += d.toString());
      proc.stderr.on("data", d => e += d.toString());
      proc.on("close", (code) => res({ code, o, e }));
    });

    (async () => {
      const pass1 = await runOnce();
      out += pass1.o; err += pass1.e;
      if (pass1.code !== 0) {
        resolve({ code: pass1.code, log: out + (err ? "\n" + err : ""), pdfPath: path.join(root, "main.pdf") });
        return;
      }
      const pass2 = await runOnce();
      out += pass2.o; err += pass2.e;
      resolve({ code: pass2.code, log: out + (err ? "\n" + err : ""), pdfPath: path.join(root, "main.pdf") });
    })();
  });
}

app.post("/compile", async (req, res) => {
  const tex = (req.body?.tex || "").toString();
  if (!tex.trim()) {
    return res.status(400).json({ error: "Empty LaTeX input." });
  }

  const engine = await pickEngine();
  if (!engine) {
    return res.status(500).json({
      error: "No LaTeX engine found. Please install Tectonic or TeX Live.",
      howTo: {
        tectonic: "https://tectonic-typesetting.github.io/en-US/",
        texlive: "https://www.tug.org/texlive/"
      }
    });
  }

  const { root, main } = writeTempTree(tex);

  try {
    const result = engine === "tectonic"
      ? await runTectonic(root, main)
      : await runPdfLaTeX(root, main);

    const ok = result.code === 0 && fs.existsSync(result.pdfPath);
    if (!ok) {
      const logText = result.log || "Compilation failed (no log).";
      // send plain text log back
      res.status(400).json({ error: "Compilation failed", engine, log: logText });
      return;
    }

    // Stream PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="output.pdf"`);
    const stream = fs.createReadStream(result.pdfPath);
    stream.on("close", () => rmrf(root));
    stream.pipe(res);
  } catch (e) {
    rmrf(root);
    res.status(500).json({ error: "Server error during compile", details: String(e) });
  }
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`LaTeX server running: ${url}`);
  console.log(`Opening browser...`);
  
  // Open browser automatically (cross-platform)
  const platform = os.platform();
  let command;
  
  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`Could not open browser automatically. Please navigate to: ${url}`);
    }
  });
});
