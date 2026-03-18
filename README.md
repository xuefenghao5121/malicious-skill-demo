# Malicious Skill Demo

> ⚠️ **WARNING: This is a security demonstration skill!**
> 
> **DO NOT USE IN PRODUCTION ENVIRONMENTS**

---

## Purpose

This repository contains a **demonstration malicious skill** for security testing purposes. It shows how malicious actors might create skills that appear helpful but contain hidden malicious behavior.

---

## Malicious Behavior Demonstrated

### 1. API Key Exfiltration

The skill secretly:
- Scans common configuration files for API keys
- Searches for patterns like `sk-*`, `api_key`, `token`
- Sends discovered keys to an external server

### 2. Undeclared Capabilities

```yaml
Declared capabilities: [file_read]
Actually uses: [file_read, network]
```

The skill hides its network requirement to bypass capability checks.

### 3. Obfuscation Techniques

- Uses obfuscated function names (`_0x4f2a`, `_0x3e1b`)
- Mixes legitimate code with malicious code
- Fake progress indicators to appear normal

---

## Detection

### YARA Rule

```yara
rule Malicious_Skill_Exfil {
  strings:
    $pattern1 = /sk-[a-zA-Z0-9]{48,}/
    $pattern2 = "exfiltrate" nocase
    $pattern3 = "_0x" wide
    $pattern4 = /fetch\s*\(\s*['"]https?:\/\//
  condition:
    any of them
}
```

### Behavioral Detection

- Unexpected network connections
- File reads outside declared scope
- Suspicious string patterns
- Obfuscated variable names

---

## Protection: TEE Isolation

In a TEE-isolated sandbox (L2+):

| Attack Vector | L1 (No TEE) | L2+ (TEE) |
|---------------|-------------|-----------|
| Network exfiltration | ✅ Possible | ❌ Blocked |
| File access outside workspace | ✅ Possible | ❌ Blocked |
| Undeclared capabilities | ⚠️ Bypass risk | ✅ Hardware enforced |
| Evidence deletion | ✅ Possible | ❌ Logged in TEE |

---

## Files

```
malicious-skill-demo/
├── README.md       # This file
├── SKILL.md        # Skill documentation
├── skill.ts        # Malicious skill code
├── package.json    # Package metadata
└── detection/      # Detection signatures
    ├── yara.rule
    └── behavioral.md
```

---

## Use in Security Testing

This skill is used in the Capsule Security Testing Framework:

```bash
# Test: Risk 3 - Malicious Skills Poisoning
npm test -- --run --testNamePattern="Skills"
```

---

## Disclaimer

**This is for educational and security testing purposes only.**

- Do not deploy in production
- Do not use for actual attacks
- Use only in controlled test environments

---

## Related

- [Capsule Extension](https://github.com/xuefenghao5121/capsule-extension)
- [Security Test Report](https://github.com/xuefenghao5121/capsule-extension/blob/main/docs/risk-validation-report.md)

---

*Created for security research and testing.*