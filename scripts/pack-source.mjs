/**
 * pack-source.mjs
 * Script tự động đóng gói các tệp mã nguồn quan trọng thành pmcg-v4-source-code.zip
 * Tự động loại bỏ node_modules, .git, .wrangler, file nhị phân lớn và thư viện minified bên thứ ba.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const zipFileName = 'pmcg-v4-source-code.zip';
const targetZipPath = path.join(rootDir, zipFileName);

// Tạo thư mục tạm
const tempDir = path.join(rootDir, '.temp_zip_pack');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

function copyFileSafe(srcRel) {
  const src = path.join(rootDir, srcRel);
  if (!fs.existsSync(src)) return;
  const dest = path.join(tempDir, srcRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDirSafe(srcRel, filterFn = null) {
  const srcDir = path.join(rootDir, srcRel);
  if (!fs.existsSync(srcDir)) return;
  
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = path.join(srcRel, entry.name);
    if (filterFn && !filterFn(relPath, entry)) continue;

    if (entry.isDirectory()) {
      copyDirSafe(relPath, filterFn);
    } else if (entry.isFile()) {
      copyFileSafe(relPath);
    }
  }
}

console.log('📦 Đang thu thập các file mã nguồn cốt lõi...');

// 1. Các file cấu hình & tài liệu gốc
const rootFiles = [
  'RULES.md',
  'PM-xeplich-v4.md',
  'package.json',
  'manifest.json',
  'sw.js',
  'version.json',
  'main.js',
  'hdsd.html',
  'sitemap.xml',
  'robots.txt'
];
rootFiles.forEach(copyFileSafe);

// 2. Thư mục css
copyDirSafe('css');

// 3. Thư mục js (bỏ minified thư viện lớn và font)
copyDirSafe('js', (relPath, entry) => {
  if (entry.isFile()) {
    if (entry.name.endsWith('.min.js')) return false;
    if (entry.name === 'vfs_fonts.js') return false;
  }
  return true;
});

// 4. Thư mục backend (bỏ node_modules, .wrangler, .dev.vars)
copyDirSafe('backend', (relPath, entry) => {
  if (entry.isDirectory()) {
    if (entry.name === 'node_modules' || entry.name === '.wrangler') return false;
  }
  if (entry.isFile()) {
    if (entry.name === '.dev.vars' || entry.name === 'package-lock.json') return false;
  }
  return true;
});

// 5. Thư mục local-solver (bỏ node_modules, __pycache__)
copyDirSafe('local-solver', (relPath, entry) => {
  if (entry.isDirectory()) {
    if (entry.name === 'node_modules' || entry.name === '__pycache__') return false;
  }
  if (entry.isFile()) {
    if (entry.name === 'package-lock.json') return false;
  }
  return true;
});

// 6. Thư mục scripts
copyDirSafe('scripts');

console.log('🗜️  Đang nén thành:', zipFileName);

// Xóa file zip cũ nếu có
if (fs.existsSync(targetZipPath)) {
  fs.unlinkSync(targetZipPath);
}

// Dùng PowerShell nén file
const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${targetZipPath}' -CompressionLevel Optimal"`;
execSync(psCmd, { stdio: 'inherit' });

// Dọn dẹp temp
fs.rmSync(tempDir, { recursive: true, force: true });

const stats = fs.statSync(targetZipPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
const sizeKB = (stats.size / 1024).toFixed(1);
console.log(`✅ Đã đóng gói thành công: ${zipFileName} (${sizeKB} KB / ${sizeMB} MB)`);
