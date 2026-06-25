# Plan: Fast URL Import for Known Companies

## Context
URL import is slow (30-60s) because:
1. **Jina Reader** waits for JS rendering (5-15s), but major Chinese tech companies use SPAs that Jina can't render — ByteDance returns only 399 bytes of nav content
2. **kimi-k2.5 AI** processes up to 20,000 chars with 4,000 max_tokens (10-30s)
3. AI is already relying on its training knowledge since Jina returns useless content for SPAs

## Key Insight
For known company domains (ByteDance, Meituan, Tencent, Alibaba, etc.), Jina is **wasting 5-15s returning nav-only content**. AI produces the same quality result with just the URL + company name.

## Implementation Plan

### File to Modify
`supabase/functions/import-job-from-url/index.ts`

### Changes

**1. Company Domain Map** (instant lookup)
```typescript
const COMPANY_MAP: Record<string, string> = {
  "bytedance.com": "字节跳动",
  "feishu.cn": "字节跳动",       // Feishu jobs
  "meituan.com": "美团",
  "tencent.com": "腾讯",
  "qq.com": "腾讯",
  "alibaba.com": "阿里巴巴",
  "taobao.com": "阿里巴巴",
  "alipay.com": "蚂蚁集团",
  "antgroup.com": "蚂蚁集团",
  "xiaohongshu.com": "小红书",
  "xhs.cn": "小红书",
  "jd.com": "京东",
  "baidu.com": "百度",
  "didi.com": "滴滴",
  "kuaishou.com": "快手",
  "bilibili.com": "哔哩哔哩",
  "pinduoduo.com": "拼多多",
  "netease.com": "网易",
  "iqiyi.com": "爱奇艺",
};
```

**2. Two-tier fetch strategy**
```
Known company domain?
  YES → Skip Jina entirely
        content = "公司: {company}\n链接: {url}"
        AI prompt: "公司已知为{company}，根据链接和你的知识提取岗位信息"
  
  NO  → Try direct HTML fetch first (< 1s)
        If useful content found (>500 chars) → use HTML, no Jina
        Else → Jina (existing), reduce timeout to 5s, content limit 4000 chars
```

**3. AI optimization for both paths**
- Reduce `content.substring(0, 20000)` → `4000`
- Reduce `max_tokens: 4000` → `800`
- For known companies: inject company name in prompt so AI only needs to find title/location

**Expected Result**
| Path | Before | After |
|------|--------|-------|
| Known company (ByteDance/Meituan/Tencent/Alibaba) | 30-60s | 3-8s |
| Unknown site (SSR pages) | 30-60s | 8-15s |

## Verification
1. Import a ByteDance URL → should complete in < 10s
2. Import a Meituan URL → should complete in < 10s
3. Import an unknown SSR site (e.g., shixiseng.com) → verify accuracy maintained
4. Result should still be "basically correct" (company, title, location)
