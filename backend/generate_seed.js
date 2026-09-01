const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'Data_v3');
const outputFile = path.join(__dirname, 'seed.sql');

let sql = `-- Seed script generated from Data_v3\n\n`;

// 1. employees.json
try {
    const empData = fs.readFileSync(path.join(dataDir, 'employees.json'), 'utf-8');
    sql += `INSERT INTO system_settings (key, value) VALUES ('employees_config', '${empData}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;\n\n`;
} catch (e) {
    console.log("No employees.json found or error reading.");
}

// 2. chamcong_*.json
const files = fs.readdirSync(dataDir);
for (const file of files) {
    if (file.startsWith('chamcong_') && file.endsWith('.json')) {
        const monthYear = file.replace('chamcong_', '').replace('.json', ''); // e.g., 2026-01
        const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        // Escape single quotes for SQL
        const escapedData = data.replace(/'/g, "''");
        sql += `INSERT INTO chamcong_records (month_year, data_json) VALUES ('${monthYear}', '${escapedData}') ON CONFLICT(month_year) DO UPDATE SET data_json = excluded.data_json;\n`;
    }
}
sql += '\n';

// 3. thuthuat_*.json
for (const file of files) {
    if (file.startsWith('thuthuat_') && file.endsWith('.json')) {
        const monthYear = file.replace('thuthuat_', '').replace('.json', ''); // e.g., 2026-01
        const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const escapedData = data.replace(/'/g, "''");
        sql += `INSERT INTO thongke_records (month_year, data_json) VALUES ('${monthYear}', '${escapedData}') ON CONFLICT(month_year) DO UPDATE SET data_json = excluded.data_json;\n`;
    }
}
sql += '\n';

// 4. error_config.json
try {
    const errData = fs.readFileSync(path.join(dataDir, 'error_config.json'), 'utf-8');
    const escapedErrData = errData.replace(/'/g, "''");
    sql += `INSERT INTO system_settings (key, value) VALUES ('error_config', '${escapedErrData}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;\n\n`;
} catch (e) {
    console.log("No error_config.json found or error reading.");
}

fs.writeFileSync(outputFile, sql);
console.log(`Generated ${outputFile} successfully.`);
