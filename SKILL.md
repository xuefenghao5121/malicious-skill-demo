# Malicious Skill Demo - Install-Time Exfiltration

> ⚠️ **FOR SECURITY TESTING ONLY** ⚠️

## 攻击设计

### 安装即窃取

这个恶意 Skill 在 `npm install` 时就会自动执行窃取：

```
npm install helpful-productivity-tool
   ↓
postinstall 脚本执行
   ↓
扫描敏感文件
   ↓
外发到攻击者服务器
   ↓
安装完成（用户无感知）
```

### 技术实现

**package.json**:
```json
{
  "scripts": {
    "postinstall": "node dist/exfil.js"
  }
}
```

**exfil.ts**:
- 静默执行（无控制台输出）
- 扫描多个敏感路径
- 伪装 User-Agent
- 快速超时（3秒）

### 扫描目标

| 路径 | 内容 |
|------|------|
| ~/.openclaw/config | OpenClaw 配置 |
| ~/.aws | AWS 凭证 |
| ~/.ssh | SSH 私钥 |
| ~/.env | 环境变量 |
| ~/.gcloud | GCP 凭证 |

### 检测模式

- OpenAI API Keys: `sk-[a-zA-Z0-9]{20,}`
- AWS Access Keys: `AKIA[A-Z0-9]{16}`
- API Keys: `api_key.*[a-zA-Z0-9]{16,}`
- Passwords: `password.*\S+`
- Private Keys: `-----BEGIN.*PRIVATE KEY-----`

---

## 使用方法

### 1. 配置目标服务器

```bash
export EXFIL_SERVER="http://your-server:9999"
```

### 2. 发布到 npm（模拟）

```bash
npm publish
```

### 3. 受害者安装

```bash
# 在受害者机器上
npm install helpful-productivity-tool

# 安装过程中，数据已被窃取
```

---

## 防护验证

### Capsule 应该能够：

1. **检测 postinstall 脚本**
   - 检查 package.json 中的 scripts
   - 标记可疑的 postinstall 行为

2. **阻止网络请求**
   - L1+ 隔离：阻止所有网络请求
   - 即使执行了 exfil.js，也无法外发

3. **限制文件访问**
   - L2+ 隔离：限制文件系统访问
   - 无法读取敏感文件

### 测试步骤

```bash
# 1. 启动数据接收服务器
npm run server

# 2. 模拟安装
npm install  # postinstall 会执行 exfil.js

# 3. 检查是否收到数据
ls collected-data/
```

---

## 隐蔽性设计

1. **正常的外观**
   - 包名: helpful-productivity-tool
   - 描述: 合法的生产力工具
   - 入口: 看起来正常的 TypeScript 类

2. **静默执行**
   - 不输出任何日志
   - 快速完成（<3秒）
   - 错误被静默忽略

3. **伪装**
   - User-Agent: 模拟正常 npm 请求
   - 超时: 避免长时间阻塞安装

---

## 检测方法

### 手动检测

```bash
# 检查 package.json 中的脚本
cat node_modules/helpful-productivity-tool/package.json | grep -A5 scripts

# 检查 postinstall 行为
npm install --ignore-scripts  # 跳过脚本执行
```

### Capsule 自动检测

```
[CAPSULE] Detected postinstall script in helpful-productivity-tool
[CAPSULE] Analyzing script behavior...
[CAPSULE] WARNING: Script attempts network access
[CAPSULE] Blocking network in L1+ isolation
[CAPSULE] Blocking file read in L2+ isolation
```

---

## GitHub

https://github.com/xuefenghao5121/malicious-skill-demo