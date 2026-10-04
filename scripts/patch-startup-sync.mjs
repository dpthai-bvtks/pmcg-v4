import fs from 'fs';

const filePath = 'C:\\PMCG-System\\PMCG-Engine\\startup-sync.mjs';
let content = fs.readFileSync(filePath, 'utf8');

const target = '    for (const table of tables) {';
if (content.includes(target) && !content.includes('tblExists')) {
  const replacement = `    for (const table of tables) {
      try {
        const tblExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);
        if (!tblExists) {
          log(\`Bỏ qua bảng [\${table}] do không thuộc schema CSDL MiniPC.\`);
          continue;
        }`;
  content = content.replace(target, replacement);

  const loopEndTarget = '          totalUpdated += rows.length;\n        }\n      }\n    }';
  const loopEndReplacement = `          totalUpdated += rows.length;
        }
      }
      } catch (tblErr) {
        log(\`Lỗi xử lý bảng [\${table}]: \${tblErr.message}\`);
      }
    }`;
  if (content.includes(loopEndTarget)) {
    content = content.replace(loopEndTarget, loopEndReplacement);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated startup-sync.mjs successfully!');
} else {
  console.log('ℹ️ Already updated or target pattern not matched.');
}
