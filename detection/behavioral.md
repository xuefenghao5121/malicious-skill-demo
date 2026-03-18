# Behavioral Detection Patterns

## Overview

This document describes behavioral patterns that indicate malicious skill activity.

---

## Pattern 1: Unexpected Network Activity

### Detection

```typescript
// Monitor network connections from skills
const suspiciousBehavior = {
  // Skill declares file_read only but makes network requests
  undeclaredNetwork: (declared: string[], actual: string[]) => {
    return !declared.includes('network') && actual.includes('network');
  },
  
  // Connection to unknown external servers
  unknownServer: (url: string, allowlist: string[]) => {
    const domain = new URL(url).hostname;
    return !allowlist.includes(domain);
  },
  
  // Large data uploads (potential exfiltration)
  dataExfiltration: (bytesSent: number, threshold: number = 1024) => {
    return bytesSent > threshold;
  }
};
```

### Indicators

- Connection to domains not in allowlist
- POST requests with encoded data
- High volume of outbound data
- Connections at unusual times

---

## Pattern 2: Unauthorized File Access

### Detection

```typescript
const fileAccessPatterns = {
  // Accessing files outside workspace
  pathTraversal: (requestedPath: string, workspaceRoot: string) => {
    const resolved = path.resolve(workspaceRoot, requestedPath);
    return !resolved.startsWith(workspaceRoot);
  },
  
  // Reading sensitive files
  sensitiveFiles: (filePath: string) => {
    const sensitive = [
      '.env', 'credentials', 'secrets', 
      '.ssh', '.aws', '.gcloud',
      'id_rsa', 'private_key'
    ];
    return sensitive.some(s => filePath.toLowerCase().includes(s));
  },
  
  // Unusually high file read volume
  massRead: (filesRead: number, threshold: number = 100) => {
    return filesRead > threshold;
  }
};
```

### Indicators

- Accessing `~/.ssh`, `~/.aws`, `~/.gcloud`
- Reading `.env` files
- Path traversal attempts (`../`)
- Reading files outside declared scope

---

## Pattern 3: Obfuscated Code

### Detection

```typescript
const obfuscationIndicators = {
  // Hex-encoded variable names
  hexVariables: (code: string) => {
    return /_0x[a-f0-9]+/.test(code);
  },
  
  // Base64 encoded strings
  base64Strings: (code: string) => {
    return /atob\(|btoa\(|Buffer\.from\([^)]+,\s*['"]base64['"]\)/.test(code);
  },
  
  // eval or Function constructor
  dynamicCode: (code: string) => {
    return /eval\(|new\s+Function\(/.test(code);
  },
  
  // Unusual character sequences
  unusualChars: (code: string) => {
    const unusual = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
    return unusual.test(code);
  }
};
```

### Indicators

- Variable names like `_0x4f2a`, `_0x3e1b`
- Excessive use of `eval()`, `Function()`
- Large base64 encoded strings
- Minified code with unusual patterns

---

## Pattern 4: Credential Patterns

### Detection

```typescript
const credentialPatterns = {
  // API key patterns
  apiKeyPatterns: (text: string) => {
    const patterns = [
      /sk-[a-zA-Z0-9]{48,}/g,          // OpenAI
      /AIza[a-zA-Z0-9_-]{35}/g,        // Google
      /ghp_[a-zA-Z0-9]{36}/g,          // GitHub
      /xox[baprs]-[a-zA-Z0-9-]+/g,     // Slack
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) return true;
    }
    return false;
  },
  
  // Generic secret patterns
  genericSecrets: (text: string) => {
    return /(?i)(api[_-]?key|secret|token|password|credential)\s*[=:]\s*['"][^'"]+['"]/.test(text);
  }
};
```

### Indicators

- Strings matching `sk-*` pattern
- Variables named `api_key`, `token`, `secret`
- Base64 encoded credentials
- Environment variable references to secrets

---

## Pattern 5: Data Staging

### Detection

```typescript
const stagingPatterns = {
  // Collecting data before exfiltration
  dataCollection: (variables: Map<string, any>) => {
    const suspiciousVars = ['keys', 'secrets', 'creds', 'data', 'payload'];
    for (const [name, value] of variables) {
      if (suspiciousVars.some(v => name.toLowerCase().includes(v))) {
        if (Array.isArray(value) && value.length > 0) return true;
      }
    }
    return false;
  },
  
  // Temporary file creation
  tempFileCreation: (filePath: string) => {
    return filePath.includes('/tmp/') || filePath.includes('\\Temp\\');
  }
};
```

### Indicators

- Variables collecting multiple secrets
- Writing to temporary locations
- Creating archive files (`.zip`, `.tar.gz`)
- Encoding collected data

---

## Mitigation Strategies

### 1. TEE Isolation (L2+)

```
┌─────────────────────────────────────┐
│         TEE Sandbox (L2+)           │
│  ┌─────────────────────────────┐    │
│  │  Skill Execution            │    │
│  │  - No network access        │    │
│  │  - Limited file access      │    │
│  │  - All calls logged         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Hardware Enforcement:              │
│  ✅ Network blocked                 │
│  ✅ File access restricted          │
│  ✅ Audit log immutable             │
└─────────────────────────────────────┘
```

### 2. Capability Verification

```typescript
// Before skill execution
const verifyCapabilities = (skill: Skill, request: Request) => {
  const declared = skill.declaredCapabilities;
  const required = analyzeRequiredCapabilities(request);
  
  for (const cap of required) {
    if (!declared.includes(cap)) {
      throw new SecurityError(`Undeclared capability: ${cap}`);
    }
  }
};
```

### 3. Signature Verification

```bash
# Verify skill signature before loading
openssl dgst -sha256 -verify trusted_key.pem -signature skill.sig skill.ts
```

---

## References

- [Capsule Security Tests](../docs/risk-validation-report.md)
- [TEE Isolation Benefits](../docs/security-tests.md)
- [OP-TEE Documentation](https://optee.readthedocs.io/)