#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXPECTED = 'wx143fcc95db3e4303';
const TOURIST = 'touristappid';

const files = [
  'project.config.json',
  'project.private.config.json',
  'app/project.config.json',
  'app/project.private.config.json',
  'app/dist/project.config.json',
];

let hasError = false;

console.log('微信小程序 AppID 检查\n');

for (const rel of files) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    console.log(`  · ${rel}（不存在，可忽略）`);
    continue;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.log(`  ✗ ${rel} JSON 解析失败`);
    hasError = true;
    continue;
  }
  const appid = json.appid;
  if (!appid) {
    console.log(`  · ${rel} 未设置 appid`);
    continue;
  }
  if (appid === TOURIST) {
    console.log(`  ✗ ${rel} appid = touristappid（游客模式）`);
    hasError = true;
  } else if (appid !== EXPECTED) {
    console.log(`  ! ${rel} appid = ${appid}（与预期 ${EXPECTED} 不一致）`);
    hasError = true;
  } else {
    console.log(`  ✓ ${rel} appid = ${appid}`);
  }
}

console.log('\n建议：');
console.log('  1. 删除项目根目录的 project.private.config.json（若存在且 appid 不对）');
console.log('  2. 微信开发者工具 → 删除项目 → 重新导入仓库根目录 vocabulary/');
console.log('  3. 详情 → 基本信息 → AppID 确认为 wx143fcc95db3e4303');
console.log('  4. 登录微信号须为该小程序在 mp.weixin.qq.com 的成员\n');

if (hasError) {
  process.exit(1);
}
