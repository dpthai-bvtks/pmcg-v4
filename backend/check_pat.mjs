import { createClient } from '@libsql/client';
import path from 'path';

const url = 'file:C:/PRIVATE-DPT/PM-DPT/PM-xeplich/PM-chinh/ban_web/v4-thuongmai/backend/data/app.db';
const client = createClient({ url });

async function run() {
    const res = await client.execute("SELECT * FROM patients WHERE is_deleted = 0");
    console.log('Total patients in DB:', res.rows.length);

    const rooms = {};
    res.rows.forEach(p => {
        const rm = String(p.room || p.phong || 'Chưa xếp phòng').trim();
        rooms[rm] = (rooms[rm] || 0) + 1;
    });
    console.log('Patients by room:', rooms);

    // Kiểm tra xem có bệnh nhân nào không có thủ thuật không
    const noProcs = res.rows.filter(p => !p.procedures && !p.thu_thuat && !p.thuThuat);
    console.log('Patients without procedures:', noProcs.map(p => ({ name: p.name, room: p.room })));

    // Kiểm tra tên và năm sinh
    const keys = {};
    res.rows.forEach(p => {
        const k = `${p.name}|${p.birth_year || p.nam_sinh || p.ns}`;
        keys[k] = (keys[k] || 0) + 1;
    });
    console.log('Dupes:', Object.entries(keys).filter(([k, v]) => v > 1));
}

run().catch(console.error);
