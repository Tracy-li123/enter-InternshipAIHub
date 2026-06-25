# 智能搜索精准化：直接搜公司官网

## 问题
当前 Tavily 全网搜索 `字节跳动 实习 招聘 岗位`，返回任何提到字节的页面（吉林大学就业网、51job 等），不准确。

## 方案：公司官网映射 + Tavily 域内搜索

Tavily 支持 `include_domains` 参数，可以把搜索限制在指定域名内。
结合预先维护的"公司→官方招聘域名"映射表，实现精准搜索。

### 改动文件
- `supabase/functions/search-company-jobs/index.ts`（仅这一个文件）

### 实现逻辑

**Step 1：公司→官方域名映射表（约 20 家主流互联网公司）**
```
字节跳动 / ByteDance  → jobs.bytedance.com
美团 / Meituan        → campus.meituan.com
腾讯 / Tencent        → join.qq.com
阿里巴巴 / Alibaba    → talent.alibaba.com
京东 / JD             → campus.jd.com
小红书 / REDnote      → job.xiaohongshu.com
快手 / Kuaishou       → campus.kuaishou.cn
网易 / NetEase        → campus.163.com
百度 / Baidu          → talent.baidu.com
滴滴 / DiDi           → campus.didiglobal.com
华为 / Huawei         → career.huawei.com
B站 / Bilibili        → jobs.bilibili.com
蚂蚁 / Ant Group      → talent.antgroup.com
拼多多 / Pinduoduo    → careers.pinduoduo.com
商汤 / SenseTime      → hr.sensetime.com
```

**Step 2：搜索逻辑**
- 若公司在映射表中 → Tavily 搜索时加 `include_domains: [官方域名]`，搜索词只用岗位类型（不带公司名）
- 若公司不在映射表 → Tavily 全网搜索，但加 `exclude_domains` 排除学校就业网、聚合招聘平台（51job、智联、boss 等），且要求 AI 只保留来自官方域名的结果

**Step 3：AI 过滤（不变）**
- 从 Tavily 结果中提取岗位信息
- 确保 URL 是有效的官方链接

## 效果对比
| | 之前 | 之后 |
|--|--|--|
| 搜字节跳动 | 全网结果，吉大就业网都来 | 只搜 jobs.bytedance.com |
| 未知公司 | 全网，质量差 | 排除聚合平台，质量好一些 |
| 代码改动 | - | 只改 Edge Function，前端不动 |

## 验证
1. 搜索「字节跳动 + 产品实习」→ 结果全是 jobs.bytedance.com 的链接
2. 搜索一个不在列表里的公司 → 结果不含 51job/zhilian 等聚合平台
