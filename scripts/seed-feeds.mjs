const BASE = 'http://localhost:3000/api/feeds';
const HOUR = 3600;
const now = Math.floor(Date.now() / 1000);

const items = [
  {
    meta: { channel: 'tech', type: 'activity', priority: 'normal', timestamp: now - HOUR },
    content: {
      title: '动态流后端补齐了分页、软删除和点赞落库',
      summary: '列表接口现在默认过滤 deleted，点赞不再只是前端内存状态。',
      body: '把领域逻辑收进了 lib/services/feeds.ts，Route Handler 只做参数解析和响应封装。\n\n新增：\n- PATCH /api/feeds/:id 局部更新\n- DELETE 软删除，?hard=1 彻底删除，?restore=1 恢复\n- POST /api/feeds/:id/likes 点赞落库，按访客 id 去重\n- GET /api/feeds/options 聚合频道、标签、类型分布\n\n搜索关键词做了正则转义，之前 . 和 * 会被当成正则直接用。',
      author: { name: '飞小RAN' },
      tags: ['Next.js', 'MongoDB', '后端'],
    },
  },
  {
    meta: { channel: 'tech', type: 'system', priority: 'high', timestamp: now - 5 * HOUR },
    content: {
      title: '注意：写接口目前没有鉴权',
      body: 'ADMIN_TOKEN 未配置时，POST/PATCH/DELETE 是完全开放的。上线前必须补真实登录态，不能只靠一个环境变量。',
      author: { name: '系统' },
      tags: ['安全', '待办'],
    },
  },
  {
    meta: { channel: 'life', type: 'other', timestamp: now - 26 * HOUR },
    content: {
      title: '凌晨两点的键盘声比任何白噪音都助眠',
      body: '重构了三个小时，最后发现是 CSS 的 sticky 撞上了 overflow。记录下来免得下次再踩。',
      author: { name: '夜行动物' },
      tags: ['日常', '吐槽'],
    },
  },
  {
    meta: { channel: 'announce', type: 'transaction', priority: 'urgent', timestamp: now - 3 * 24 * HOUR },
    content: {
      title: '社区规则草案：关于动态与文章的边界',
      body: '短内容进动态流，长内容进文章画廊，两者可以在动态里互相引用。这条是给自己看的备忘。',
      author: { name: '飞小RAN' },
      tags: ['公告', '规划'],
    },
  },
  {
    meta: { channel: 'tech', type: 'interaction', timestamp: now - 9 * 24 * HOUR },
    content: {
      title: 'antd 6 把 Spin 的 tip 改名成了 description',
      body: '类似的还有一批：Drawer 的 bodyStyle 改 styles.body、Timeline 的 label 改 title、Space 的 direction 改 orientation。升级时容易漏，因为旧的还能编译只是 deprecated。',
      author: { name: '迁移受害者' },
      tags: ['Antd', '前端', '踩坑'],
    },
  },
];

let created = 0;
for (const item of items) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const json = await res.json();
  if (json.success) {
    created += 1;
    console.log('OK  ', json.data._id, item.content.title);
  } else {
    console.log('FAIL', res.status, json.message);
  }
}
console.log(`\n共写入 ${created} 条`);
