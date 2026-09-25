/**
 * ============================================================
 * T.I.M.E.S SYSTEM - MODULE QUẢN LÝ TÀI NGUYÊN (RESOURCES MODULE)
 * Quản lý Máy Móc & Phòng Bệnh (Machines & Rooms Management)
 * File: js/modules/app-resources.js
 * Phiên bản: 4.1.6-rev2 (25/09/2026)
 * ============================================================
 */

(function (window) {
    'use strict';

    // Helper nội bộ an toàn truy xuất dataCache
    function getCache() {
        return window.dataCache = window.dataCache || { pat: [], staff: [], machine: [], room: [], proc: [] };
    }

    function getEditIdx() {
        return window.editIndex = window.editIndex || { machine: -1, proc: -1, staff: -1, room: -1, pat: -1, proto: -1 };
    }

    function doCancelEdit(type) {
        if (typeof window.cancelEdit === 'function') {
            window.cancelEdit(type);
        } else {
            getEditIdx()[type] = -1;
        }
    }

    function notifyMsg(msg, type = 'success') {
        if (typeof window.notify === 'function') {
            window.notify(msg, type);
        } else if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${msg}`);
        }
    }

    function safeEscape(str) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    function emptyRowHtml(colspan, msg) {
        if (typeof window.renderEmptyRow === 'function') return window.renderEmptyRow(colspan, msg);
        return `<tr><td colspan="${colspan}" style="text-align:center; padding:20px; color:#94a3b8; font-style:italic;">${safeEscape(msg)}</td></tr>`;
    }

    function sttControlHtml(type, i, len) {
        if (typeof window.renderSttOrderControl === 'function') return window.renderSttOrderControl(type, i, len);
        return `${i + 1}`;
    }

    // ============================================================
    // ⚙️ 1. QUẢN LÝ MÁY MÓC (MACHINES MANAGEMENT)
    // ============================================================

    function renderMachinesTable() {
        const cache = getCache();
        const statEl = document.getElementById('stat-machines');
        if (statEl) statEl.innerText = (cache.machine || []).length;
        const tbody = document.getElementById('machines-list');
        if (!tbody) return;

        const procMachineSelect = document.getElementById('proc-machine');
        const searchMachineSelect = document.getElementById('search-machine-type');
        if (procMachineSelect && searchMachineSelect) {
            const types = [...new Set((cache.machine || []).map(m => String(m.tenLoai || m[1] || '').trim()))].filter(Boolean);
            procMachineSelect.innerHTML = '<option>Thủ công</option>' + types.map(t => `<option value="${safeEscape(t)}">${safeEscape(t)}</option>`).join('');
            searchMachineSelect.innerHTML = '<option>Chọn loại máy</option>' + types.map(t => `<option value="${safeEscape(t)}">${safeEscape(t)}</option>`).join('');
        }

        const typeDatalist = document.getElementById('machine-types-datalist');
        if (typeDatalist) {
            const types = [...new Set((cache.machine || []).map(m => String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || '').trim()))].filter(Boolean);
            typeDatalist.innerHTML = types.map(t => `<option value="${safeEscape(t)}">`).join('');
        }

        if (!cache.machine || !cache.machine.length) {
            tbody.innerHTML = emptyRowHtml(5, 'Chưa có thiết bị');
            return;
        }

        tbody.innerHTML = cache.machine.map((item, i) => {
            const idx = cache.machine.indexOf(item);
            const ten = String(item.tenLoai || item[1] || '').trim();
            const ma = String(item.maMay || item[2] || '').trim();
            const tt = item.trangThai || item[3] || '';
            return `<tr class="draggable-row editable-row" data-drag-idx="${i}" data-machine-index="${idx}" onclick="if(!window._isDraggingRow) editRoomMachine(parseInt(this.dataset.machineIndex))" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
                <td>${sttControlHtml("machines", i, cache.machine.length)}</td>
                <td><b>${safeEscape(ten)}</b></td>
                <td><span class="badge badge-info">${safeEscape(ma)}</span></td>
                <td><span class="status-badge ${tt === 'Sẵn sàng' ? 'status-ready' : 'status-busy'}">${safeEscape(tt)}</span></td>
                <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteMachine(${idx})">Xóa</button></td>
            </tr>`;
        }).join('');

        if (typeof renderDynamicMachineInputs === 'function') renderDynamicMachineInputs();

        if (typeof window.initTableDragAndDrop === 'function') {
            window.initTableDragAndDrop('machines-list', cache.machine, () => {
                renderMachinesTable();
                if (typeof window.saveReorderedData === 'function') {
                    window.saveReorderedData('machines', cache.machine);
                }
            });
        }
    }

    function saveMachine() {
        const cache = getCache();
        const editIdx = getEditIdx();
        const typeEl = document.getElementById('machine-type');
        const codeEl = document.getElementById('machine-code');
        const statusEl = document.getElementById('machine-status');

        const t = typeEl ? typeEl.value.trim() : '';
        const c = codeEl ? codeEl.value.trim() : '';
        const s = statusEl ? statusEl.value : 'Sẵn sàng';

        if (!t || !c) {
            alert("Vui lòng nhập đầy đủ Tên loại máy và Ký hiệu máy!");
            if (!t && typeEl) typeEl.focus();
            else if (!c && codeEl) codeEl.focus();
            return;
        }

        if (editIdx.machine > -1) {
            // Sửa thông tin máy
            const oldItem = cache.machine[editIdx.machine];
            const oldMaMay = oldItem ? String(oldItem.maMay || oldItem.ma_may || (Array.isArray(oldItem) ? oldItem[2] : '') || '').trim() : '';
            const oldId = oldItem ? oldItem.id : null;

            // Kiểm tra trùng ký hiệu với máy khác
            const isDup = (cache.machine || []).some((m, idx) => {
                if (idx === editIdx.machine) return false;
                const mCode = String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || '').trim();
                return mCode.toLowerCase() === c.toLowerCase();
            });
            if (isDup) {
                alert(`Ký hiệu máy "${c}" đã tồn tại! Vui lòng chọn ký hiệu khác.`);
                if (codeEl) codeEl.focus();
                return;
            }

            cache.machine[editIdx.machine] = { id: oldId, tenLoai: t, maMay: c, trangThai: s };

            if (typeof callApi === 'function') {
                callApi('editMayMoc', [{
                    index: editIdx.machine,
                    oldMaMay: oldMaMay,
                    id: oldId,
                    tenLoai: t,
                    maMay: c,
                    trangThai: s
                }, editIdx.machine, t, c, s, oldMaMay],
                () => notifyMsg(`Đã cập nhật máy "${c}" thành công!`, 'success'),
                e => alert('Lỗi khi cập nhật máy: ' + e));
            } else {
                notifyMsg(`Đã cập nhật máy "${c}" thành công!`, 'success');
            }

            doCancelEdit('machine');
            renderMachinesTable();
        } else {
            // Thêm mới 1 máy cụ thể (nhập tên loại máy, ký hiệu máy, trạng thái; không qua số lượng)
            const isDup = (cache.machine || []).some(m => {
                const mCode = String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || '').trim();
                return mCode.toLowerCase() === c.toLowerCase();
            });
            if (isDup) {
                alert(`Ký hiệu máy "${c}" đã tồn tại! Vui lòng chọn ký hiệu khác.`);
                if (codeEl) codeEl.focus();
                return;
            }

            cache.machine.push({ tenLoai: t, maMay: c, trangThai: s });

            if (typeof callApi === 'function') {
                callApi('addMayMoc', [{
                    tenLoai: t,
                    maMay: c,
                    soLuong: 1,
                    qty: 1,
                    trangThai: s
                }, t, c, 1, s],
                () => notifyMsg(`Đã thêm máy "${c}" (${t}) thành công!`, 'success'),
                e => alert('Lỗi khi thêm máy: ' + e));
            } else {
                notifyMsg(`Đã thêm máy "${c}" (${t}) thành công!`, 'success');
            }

            doCancelEdit('machine');
            renderMachinesTable();

            // Giữ lại Tên loại máy và focus Ký hiệu máy để người dùng nhập tiếp máy khác cùng loại nhanh chóng
            if (typeEl) typeEl.value = t;
            if (codeEl) {
                codeEl.value = '';
                codeEl.focus();
            }
        }
    }

    function editRoomMachine(index) {
        if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") {
            window.openMobileFormForEdit("machine");
        }

        const cache = getCache();
        const editIdx = getEditIdx();
        editIdx.machine = index;

        const item = cache.machine[index];
        if (!item) return;

        const tenLoai = String(item.tenLoai || item.ten_loai || (Array.isArray(item) ? item[1] : '') || '').trim();
        const maMay = String(item.maMay || item.ma_may || (Array.isArray(item) ? item[2] : '') || '').trim();
        const trangThai = item.trangThai || item.trang_thai || (Array.isArray(item) ? item[3] : '') || 'Sẵn sàng';

        const typeEl = document.getElementById('machine-type');
        const codeEl = document.getElementById('machine-code');
        const statusEl = document.getElementById('machine-status');
        const grpQty = document.getElementById('group-qty');
        const btnSave = document.getElementById('btn-save-machine');
        const btnCancel = document.getElementById('btn-cancel-machine');

        if (typeEl) typeEl.value = tenLoai;
        if (codeEl) codeEl.value = maMay;
        if (statusEl) statusEl.value = trangThai;
        if (grpQty) grpQty.style.display = 'none';
        if (btnSave) btnSave.innerText = "Lưu Sửa";
        if (btnCancel) btnCancel.style.display = "inline-block";
    }

    function deleteMachine(i) {
        const cache = getCache();
        const confirmFn = window.showCustomConfirm || ((title, msg, cb) => { if (confirm(msg)) cb(); });
        confirmFn("Xác nhận xóa máy", "Bác sĩ có chắc chắn muốn xóa máy này?", function () {
            const targetMachine = cache.machine ? cache.machine[i] : null;
            const maMay = targetMachine ? String(targetMachine.maMay || targetMachine.ma_may || (Array.isArray(targetMachine) ? targetMachine[2] : '') || targetMachine.ma || '').trim() : '';
            const machineId = targetMachine ? (targetMachine.id || null) : null;

            cache.machine.splice(i, 1);
            renderMachinesTable();

            if (typeof callApi === 'function') {
                callApi('deleteMayMoc', [{ maMay, id: machineId, index: i }, maMay, machineId],
                    () => notifyMsg('Đã xóa máy móc thành công!', 'success'),
                    e => {
                        alert('Lỗi khi xóa máy: ' + e);
                        if (typeof window.loadMachines === 'function') window.loadMachines();
                    }
                );
            }
        });
    }

    function renderDynamicMachineInputs() {
        const container = document.getElementById('dynamic-machine-inputs');
        if (!container) return;

        const cache = getCache();
        if (!cache.machine || !Array.isArray(cache.machine) || cache.machine.length === 0) {
            container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">Chưa có loại máy trong kho</div>';
            return;
        }

        const typeSet = new Set();
        const typeList = [];

        cache.machine.forEach(m => {
            if (!m) return;
            const rawName = m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '';
            const nameStr = String(rawName).trim();
            if (!nameStr || nameStr === 'undefined' || nameStr === 'null' || nameStr.toLowerCase() === 'undefined') return;

            const lowerKey = nameStr.toLowerCase();
            if (!typeSet.has(lowerKey)) {
                typeSet.add(lowerKey);
                typeList.push(nameStr);
            }
        });

        if (typeList.length === 0) {
            container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">Chưa có loại máy trong kho</div>';
            return;
        }

        container.innerHTML = typeList.map(type => `
            <div style="display:flex; justify-content:space-between; align-items:center" title="${safeEscape(type)}">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; text-transform:capitalize;">${safeEscape(type)}</span>:
                <input type="number" class="room-machine-input" data-type="${safeEscape(type.toLowerCase().trim())}" min="0" style="width:40px; padding:2px">
            </div>
        `).join('');
    }

    // ============================================================
    // 🏥 2. QUẢN LÝ PHÒNG BỆNH (ROOMS MANAGEMENT)
    // ============================================================

    function renderRoomsTable() {
        const cache = getCache();
        const tbody = document.getElementById('rooms-list');
        if (!tbody) return;

        const roomSelect = document.getElementById('pat-room');
        if (roomSelect) {
            const currentVal = roomSelect.value;
            const options = (cache.room || []).map(r => {
                const ten = String(r.tenPhong || r[1] || '').trim();
                return `<option value="${safeEscape(ten)}">${safeEscape(ten)}</option>`;
            }).join('');
            roomSelect.innerHTML = `<option value="">-- Chọn phòng --</option>` + options;
            if (currentVal) roomSelect.value = currentVal;
        }

        if (typeof renderDynamicMachineInputs === 'function') {
            renderDynamicMachineInputs();
        }

        if (!cache.room || !cache.room.length) {
            tbody.innerHTML = emptyRowHtml(7, 'Chưa có dữ liệu phòng');
            return;
        }

        tbody.innerHTML = cache.room.map((item, i) => {
            const idx = cache.room.indexOf(item);
            return `<tr class="draggable-row editable-row" data-drag-idx="${i}" onclick="if(!window._isDraggingRow) editRoom(${idx})" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
                <td>${sttControlHtml("rooms", i, cache.room.length)}</td>
                <td><strong>${safeEscape(item.tenPhong || item[1] || '')}</strong></td>
                <td>${safeEscape(item.bacSi || item[2] || '')}</td>
                <td style="font-size:11px">${safeEscape(item.ktv || item[3] || '')}</td>
                <td style="font-size:11px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${safeEscape(item.danhSachMay || item[4] || '')}">${safeEscape(item.danhSachMay || item[4] || '')}</td>
                <td style="text-align:center;">${item.soGiuong || item[5] || 0}</td>
                <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteRoom(${idx})">Xóa</button></td>
            </tr>`;
        }).join('');

        if (typeof window.filterRoomTable === 'function') window.filterRoomTable();

        if (typeof window.initTableDragAndDrop === 'function') {
            window.initTableDragAndDrop('rooms-list', cache.room, () => {
                renderRoomsTable();
                if (typeof window.saveReorderedData === 'function') {
                    window.saveReorderedData('rooms', cache.room);
                }
            });
        }
    }

    function saveRoom() {
        const cache = getCache();
        const editIdx = getEditIdx();

        const nameEl = document.getElementById('room-name');
        const bedsEl = document.getElementById('room-beds');

        const ten = nameEl ? nameEl.value.trim() : '';
        const slGiuong = bedsEl ? (parseInt(bedsEl.value) || 0) : 0;

        if (!ten) return alert("Nhập tên phòng");

        const bs = Array.from(document.querySelectorAll('.room-doc-cb:checked')).map(cb => cb.value).join(', ');
        const ktv = Array.from(document.querySelectorAll('.room-stf-cb:checked')).map(cb => cb.value).join(', ');

        const roomIdx = editIdx.room > -1 ? editIdx.room : (cache.room || []).length;

        let usedBeds = 0;
        for (let i = 0; i < roomIdx; i++) {
            usedBeds += parseInt(cache.room[i]?.soGiuong || cache.room[i]?.[5]) || 0;
        }

        const dsGiuong = Array.from({ length: slGiuong }, (_, i) => "G" + (usedBeds + i + 1)).join(', ');

        let finalMachineList = [];

        document.querySelectorAll('.room-machine-input').forEach(inp => {
            let reqQty = parseInt(inp.value) || 0;
            if (!reqQty) return;

            const typeName = (inp.getAttribute('data-type') || '').toLowerCase().trim();
            if (!typeName || typeName === 'undefined' || typeName === 'null') return;

            const machinesOfType = (cache.machine || []).filter(m => {
                if (!m) return false;
                const t = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '').toLowerCase().trim();
                return t === typeName;
            }).map(m => String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || m.ma || m.code || '').trim()).filter(Boolean);

            let usedCount = 0;

            for (let i = 0; i < roomIdx; i++) {
                const rmList = String(cache.room[i]?.danhSachMay || cache.room[i]?.[4] || '');
                rmList.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
                    const found = (cache.machine || []).find(m => {
                        if (!m) return false;
                        const mCode = String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || m.ma || m.code || '').trim();
                        return mCode.toLowerCase() === code.toLowerCase();
                    });

                    if (found) {
                        const foundType = String(found.tenLoai || found.ten_loai || (Array.isArray(found) ? found[1] : '') || found.ten || found.name || '').toLowerCase().trim();
                        if (foundType === typeName) usedCount++;
                    }
                });
            }

            const assigned = machinesOfType.slice(usedCount, usedCount + reqQty);

            if (assigned.length < reqQty) alert(`⚠️ Kho thiếu máy [${typeName.toUpperCase()}]! Còn ${machinesOfType.length - usedCount} máy rảnh.`);

            finalMachineList = finalMachineList.concat(assigned);
        });

        const dsMay = finalMachineList.join(', ');

        if (editIdx.room > -1) {
            const oldItem = cache.room[editIdx.room];
            const oldName = oldItem ? String(oldItem.tenPhong || oldItem.ten_phong || (Array.isArray(oldItem) ? oldItem[1] : '') || '').trim() : '';
            const oldId = oldItem ? oldItem.id : null;

            cache.room[editIdx.room] = { id: oldId, tenPhong: ten, bacSi: bs, ktv, danhSachMay: dsMay, soGiuong: slGiuong, danhSachGiuong: dsGiuong };

            if (oldName !== ten && cache.pat) {
                cache.pat.forEach(p => {
                    const pRoom = p.phong || p[4] || '';
                    if (String(pRoom).trim() === String(oldName).trim()) {
                        if (p.phong !== undefined) p.phong = ten;
                        if (p[4] !== undefined) p[4] = ten;
                    }
                });

                if (typeof window.renderPatientsTable === 'function') window.renderPatientsTable();
            }

            if (typeof callApi === 'function') {
                callApi('editPhong', [{
                    index: editIdx.room,
                    oldTenPhong: oldName,
                    id: oldId,
                    tenPhong: ten,
                    bacSi: bs,
                    ktv: ktv,
                    danhSachMay: dsMay,
                    soGiuong: slGiuong,
                    danhSachGiuong: dsGiuong
                }, editIdx.room, ten, bs, ktv, dsMay, slGiuong, dsGiuong, oldName]);
            }
        } else {
            cache.room.push({ tenPhong: ten, bacSi: bs, ktv, danhSachMay: dsMay, soGiuong: slGiuong, danhSachGiuong: dsGiuong });

            if (typeof callApi === 'function') {
                callApi('addPhong', [ten, bs, ktv, dsMay, slGiuong, dsGiuong]);
            }
        }

        doCancelEdit('room');
        renderRoomsTable();
    }

    function editRoom(index) {
        if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") {
            window.openMobileFormForEdit("room");
        }

        const cache = getCache();
        const editIdx = getEditIdx();
        editIdx.room = index;

        const item = cache.room[index];
        if (!item) return;

        // Luôn đảm bảo dynamic machine inputs được render đầy đủ trước khi gán giá trị
        if (typeof renderDynamicMachineInputs === 'function') {
            renderDynamicMachineInputs();
        }

        const nameEl = document.getElementById('room-name');
        const bedsEl = document.getElementById('room-beds');
        const btnSave = document.getElementById('btn-save-room');
        const btnCancel = document.getElementById('btn-cancel-room');

        if (nameEl) nameEl.value = item.tenPhong || item[1] || '';
        if (bedsEl) bedsEl.value = item.soGiuong || item[5] || 0;

        document.querySelectorAll('.room-doc-cb, .room-stf-cb').forEach(cb => cb.checked = false);

        const bacSi = item.bacSi || item[2] || '';
        if (bacSi) {
            bacSi.split(',').forEach(b => {
                const cb = document.querySelector(`.room-doc-cb[value="${b.trim()}"]`);
                if (cb) cb.checked = true;
            });
        }

        const ktv = item.ktv || item[3] || '';
        if (ktv) {
            ktv.split(',').forEach(k => {
                const cb = document.querySelector(`.room-stf-cb[value="${k.trim()}"]`);
                if (cb) cb.checked = true;
            });
        }

        document.querySelectorAll('.room-machine-input').forEach(inp => inp.value = '');

        const danhSachMay = item.danhSachMay || item[4] || '';
        if (danhSachMay && cache.machine && Array.isArray(cache.machine)) {
            danhSachMay.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
                const m = cache.machine.find(x => {
                    if (!x) return false;
                    const mCode = String(x.maMay || x.ma_may || (Array.isArray(x) ? x[2] : '') || x.ma || x.code || '').trim();
                    return mCode.toLowerCase() === code.toLowerCase();
                });

                if (m) {
                    const mType = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '').toLowerCase().trim();
                    if (mType && mType !== 'undefined' && mType !== 'null') {
                        const inp = document.querySelector(`.room-machine-input[data-type="${mType}"]`);
                        if (inp) inp.value = (parseInt(inp.value) || 0) + 1;
                    }
                }
            });
        }

        if (btnSave) btnSave.innerText = "Lưu Sửa";
        if (btnCancel) btnCancel.style.display = "inline-block";
    }

    function deleteRoom(i) {
        const cache = getCache();
        const confirmFn = window.showCustomConfirm || ((title, msg, cb) => { if (confirm(msg)) cb(); });
        confirmFn("Xác nhận xóa phòng", "Bác sĩ có chắc chắn muốn xóa phòng này không?", function () {
            const targetRoom = cache.room ? cache.room[i] : null;
            const tenPhong = targetRoom ? String(targetRoom.tenPhong || targetRoom.ten_phong || (Array.isArray(targetRoom) ? targetRoom[1] : '') || targetRoom.ten || '').trim() : '';
            const roomId = targetRoom ? (targetRoom.id || null) : null;

            cache.room.splice(i, 1);
            renderRoomsTable();

            if (typeof callApi === 'function') {
                callApi('deletePhong', [{ tenPhong, id: roomId, index: i }, tenPhong, roomId],
                    () => notifyMsg('Đã xóa phòng thành công!', 'success'),
                    e => {
                        alert('Lỗi khi xóa phòng: ' + e);
                        if (typeof window.loadRooms === 'function') window.loadRooms();
                    }
                );
            }
        });
    }

    // Export ra Window để tất cả các module và onclick HTML đều gọi được
    window.renderMachinesTable = renderMachinesTable;
    window.saveMachine = saveMachine;
    window.editRoomMachine = editRoomMachine;
    window.deleteMachine = deleteMachine;
    window.renderDynamicMachineInputs = renderDynamicMachineInputs;

    window.renderRoomsTable = renderRoomsTable;
    window.saveRoom = saveRoom;
    window.editRoom = editRoom;
    window.deleteRoom = deleteRoom;

    window.AppResources = {
        renderMachinesTable,
        saveMachine,
        editRoomMachine,
        deleteMachine,
        renderDynamicMachineInputs,
        renderRoomsTable,
        saveRoom,
        editRoom,
        deleteRoom
    };

})(typeof window !== 'undefined' ? window : this);
