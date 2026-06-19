import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { User, Schedule, Announcement, Major } from '../types';
import { Users, Calendar, Megaphone, Plus, Trash2, Shield, CalendarCheck, Edit2, X, ChevronDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'users' | 'announcements'>('schedules');

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-emerald-900 text-white flex-shrink-0 border-r border-emerald-800 shadow-xl z-10 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
             <Shield className="w-6 h-6 text-emerald-300" /> Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition font-medium ${
              activeTab === 'schedules' ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Kelola Jadwal
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition font-medium ${
              activeTab === 'users' ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Kelola Jamaah
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition font-medium ${
              activeTab === 'announcements' ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            Mading & Info
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-8">
        <div className="w-full">
          {activeTab === 'schedules' && <ManageSchedules />}
          {activeTab === 'users' && <ManageUsers />}
          {activeTab === 'announcements' && <ManageAnnouncements />}
        </div>
      </div>
    </div>
  );
}

// ========================
// Manage Schedules CRUD
// ========================
function ManageSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isExportAttendanceConfirmOpen, setIsExportAttendanceConfirmOpen] = useState(false);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(schedules.map(s => ({
      'Tanggal': s.date,
      'Waktu Sholat': s.prayerName,
      'Nama Imam': s.imamName,
      'Target Jurusan': s.targetMajor
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Sholat");
    XLSX.writeFile(wb, "Data_Jadwal_Sholat.xlsx");
    setIsExportConfirmOpen(false);
  };

  const handleExportAttendanceExcel = () => {
    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
    if (!selectedSchedule) return;

    const attendances = db.getAttendance().filter(a => a.scheduleId === selectedScheduleId);
    const allUsers = db.getUsers();
    
    const attendanceData = allUsers.filter(u => u.role === 'user').map(student => {
      const isTargeted = selectedSchedule.targetMajor === 'All' || (student.major && student.major.startsWith(selectedSchedule.targetMajor));
      if (!isTargeted) return null;
      const record = attendances.find(a => a.userId === student.id);
      return {
        'Nama Siswa': student.name,
        'Kelas (Jurusan)': student.className,
        'Status': record ? record.status : 'Absen (Belum Ada Keterangan)',
        'Keterangan/Alasan': record?.reason || '-'
      };
    }).filter(Boolean);

    if (attendanceData.length === 0) {
      alert("Tidak ada data siswa yang diwajibkan hadir pada jadwal ini.");
      setIsExportAttendanceConfirmOpen(false);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(attendanceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kehadiran");
    XLSX.writeFile(wb, `Data_Kehadiran_${selectedSchedule.date}.xlsx`);
    setIsExportAttendanceConfirmOpen(false);
  };

  // Form states
  const [prayerName, setPrayerName] = useState('Dzuhur');
  const [date, setDate] = useState('');
  const [targetMajor, setTargetMajor] = useState<Major | 'All'>('AKL');
  const [imamName, setImamName] = useState('');

  const loadSchedules = () => setSchedules(db.getSchedules());

  useEffect(() => { loadSchedules(); }, []);

  const openForm = (schedule?: Schedule) => {
    if (schedule) {
      setEditingId(schedule.id);
      setPrayerName(schedule.prayerName);
      setDate(schedule.date);
      setTargetMajor(schedule.targetMajor);
      setImamName(schedule.imamName);
    } else {
      setEditingId(null);
      setPrayerName('Dzuhur');
      setDate('');
      setTargetMajor('AKL');
      setImamName('');
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updatedSchedule: Schedule = {
        id: editingId,
        prayerName,
        date,
        targetMajor,
        imamName,
        createdBy: '1'
      };
      db.updateSchedule(editingId, updatedSchedule);
    } else {
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        prayerName,
        date,
        targetMajor,
        imamName,
        createdBy: '1' // mock admin id
      };
      db.addSchedule(newSchedule);
    }
    closeForm();
    loadSchedules();
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      db.deleteSchedule(deleteConfirmId);
      setDeleteConfirmId(null);
      loadSchedules();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 pb-2 inline-block">Jadwal Sholat & Imam</h1>
          <p className="text-gray-500 text-sm mt-2">Otoritas penjadwalan sholat dan penunjukan Imam.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExportConfirmOpen(true)}
            className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition"
          >
            <Download className="w-5 h-5"/> Cetak Laporan
          </button>
          <button 
            onClick={() => openForm()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5"/> Buat Jadwal Baru
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Jadwal Sholat' : 'Buat Jadwal Baru'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Waktu Sholat</label>
                  <div className="relative">
                    <select value={prayerName} onChange={e=>setPrayerName(e.target.value)} required className="w-full px-4 py-3 pr-10 appearance-none bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700 cursor-pointer">
                      <option value="Dzuhur">Dzuhur</option>
                      <option value="Ashar">Ashar</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Dhuha">Dhuha (Kajian)</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Tanggal</label>
                  <input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Nama Imam / Khotib</label>
                  <input type="text" required value={imamName} onChange={e=>setImamName(e.target.value)} placeholder="Contoh: Ust. Ahmad" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Target Jurusan (Wajib Hadir)</label>
                  <div className="relative">
                    <select value={targetMajor} onChange={e=>setTargetMajor(e.target.value as (Major|'All'))} className="w-full px-4 py-3 pr-10 appearance-none bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700 cursor-pointer">
                      <option value="AKL">AKL</option>
                      <option value="BR">BR</option>
                      <option value="MP">MP</option>
                      <option value="DKV">DKV</option>
                      <option value="RPL">RPL</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                <button type="button" onClick={closeForm} className="px-6 py-2.5 font-semibold text-gray-600 hover:bg-neutral-100 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-emerald-500 transition shadow-sm">
                  {editingId ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Nama Imam</th>
              <th className="px-6 py-4">Target Jurusan</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {schedules.map(s => (
              <tr key={s.id} onClick={() => {
                if (['Dzuhur', 'Ashar', 'Jumat'].includes(s.prayerName)) {
                  setSelectedScheduleId(s.id);
                }
              }} className={`hover:bg-neutral-50 ${['Dzuhur', 'Ashar', 'Jumat'].includes(s.prayerName) ? 'cursor-pointer' : ''}`}>
                <td className="px-6 py-4 text-sm font-medium">{s.date}</td>
                <td className="px-6 py-4 text-sm"> <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-semibold">{s.prayerName}</span></td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{s.imamName}</td>
                <td className="px-6 py-4 text-sm">{s.targetMajor === 'All' ? 'Semua (Umum)' : s.targetMajor}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openForm(s); }} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition" title="Edit">
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(s.id); }} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition" title="Hapus">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada jadwal.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Jadwal?</h3>
            <p className="text-sm text-gray-500 mb-6">Jadwal ini akan dihapus secara permanen. Anda tidak dapat mengembalikan tindakan ini.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cetak Laporan Jadwal?</h3>
            <p className="text-sm text-gray-500 mb-6">File Excel berisi seluruh data jadwal sholat akan diunduh ke perangkat Anda.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsExportConfirmOpen(false)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExportExcel}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportAttendanceConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cetak Laporan Kehadiran?</h3>
            <p className="text-sm text-gray-500 mb-6">File Excel berisi data kehadiran jamaah pada jadwal ini akan diunduh ke perangkat Anda.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsExportAttendanceConfirmOpen(false)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExportAttendanceExcel}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedScheduleId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-neutral-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                Detail Kehadiran Jamaah
              </h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsExportAttendanceConfirmOpen(true)}
                  className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition text-sm"
                >
                  <Download className="w-4 h-4"/> Cetak Laporan
                </button>
                <button onClick={() => setSelectedScheduleId(null)} className="text-gray-400 hover:text-gray-600 transition p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-4 py-3 font-semibold">Kelas (Jurusan)</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(() => {
                    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
                    const attendances = db.getAttendance().filter(a => a.scheduleId === selectedScheduleId);
                    const allUsers = db.getUsers();
                    const attendanceData = allUsers.filter(u => u.role === 'user').map(student => {
                      const isTargeted = selectedSchedule?.targetMajor === 'All' || (student.major && student.major.startsWith(selectedSchedule?.targetMajor || ''));
                      if (!isTargeted) return null;
                      const record = attendances.find(a => a.userId === student.id);
                      return {
                        student,
                        status: record ? record.status : 'Absen (Belum Ada Keterangan)',
                        reason: record?.reason
                      }
                    }).filter(Boolean) as {student: User, status: string, reason?: string}[];

                    if (attendanceData.length === 0) {
                      return <tr><td colSpan={3} className="text-center py-6 text-gray-500">Tidak ada data siswa yang diwajibkan hadir pada jadwal ini.</td></tr>;
                    }

                    return attendanceData.map((data, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{data.student.name}</td>
                        <td className="px-4 py-3 text-gray-600">{data.student.className}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                            data.status === 'Hadir' ? 'bg-green-100 text-green-800' : 
                            data.status.includes('Absen') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {data.status}
                          </span>
                          {data.reason && <p className="text-xs text-gray-500 mt-1">{data.reason}</p>}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Manage Users
// ========================
function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  
  useEffect(() => { setUsers(db.getUsers()); }, []);

  const handleExportExcel = () => {
    const data = users.filter(u => u.role === 'user').map(u => ({
      'Nama': u.name,
      'NISN': u.nisn,
      'Kelas (Jurusan)': u.className || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Data_Jamaah_Siswa.xlsx");
    setIsExportConfirmOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 pb-2 inline-block">Data Jamaah Siswa</h1>
            <p className="text-gray-500 text-sm mt-2">Daftar siswa SMKN 46 dan jurusannya.</p>
          </div>
          <button 
            onClick={() => setIsExportConfirmOpen(true)}
            className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition"
          >
            <Download className="w-5 h-5"/> Cetak Laporan
          </button>
       </div>

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cetak Laporan Data Siswa?</h3>
            <p className="text-sm text-gray-500 mb-6">File Excel berisi seluruh data jamaah siswa akan diunduh ke perangkat Anda.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsExportConfirmOpen(false)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExportExcel}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}

       <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Nama Siswa</th>
              <th className="px-6 py-4">NIS</th>
              <th className="px-6 py-4">Kelas</th>
              <th className="px-6 py-4">Jurusan</th>
              <th className="px-6 py-4 text-center">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map(u => (
               <tr key={u.id} className="hover:bg-neutral-50 text-sm">
                 <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                 <td className="px-6 py-4">{u.nisn}</td>
                 <td className="px-6 py-4">{u.className || '-'}</td>
                 <td className="px-6 py-4">
                   {u.major ? <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">{u.major}</span> : '-'}
                 </td>
                 <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${u.role==='admin'?'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
       </div>
    </div>
  );
}

// ========================
// Manage Announcements
// ========================
function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadAnnouncements = () => setAnnouncements(db.getAnnouncements());
  useEffect(() => { loadAnnouncements(); }, []);

  const handleExportExcel = () => {
    const data = announcements.map(a => ({
      'Judul Mading': a.title,
      'Isi Pengumuman': a.content,
      'Tanggal Dibuat': new Date(a.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mading Pengumuman");
    XLSX.writeFile(wb, "Data_Mading_Pengumuman.xlsx");
    setIsExportConfirmOpen(false);
  };

  const openForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setIsFormOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      db.updateAnnouncement(editingId, { title, content });
    } else {
      db.addAnnouncement({ id: Date.now().toString(), title, content, createdAt: new Date().toISOString() });
    }
    closeForm();
    loadAnnouncements();
  };

  const confirmDelete = () => {
    if(deleteConfirmId) {
      db.deleteAnnouncement(deleteConfirmId);
      setDeleteConfirmId(null);
      loadAnnouncements();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 pb-2 inline-block">Mading & Pengumuman</h1>
          <p className="text-gray-500 text-sm mt-2">Publikasi info kegiatan kajian dan kerohanian.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExportConfirmOpen(true)}
            className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
          >
            <Download className="w-5 h-5"/> Cetak Laporan
          </button>
          <button 
            onClick={openForm}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5"/> Tulis Mading
          </button>
        </div>
      </div>

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cetak Laporan Mading?</h3>
            <p className="text-sm text-gray-500 mb-6">File Excel berisi seluruh data pengumuman dan mading akan diunduh ke perangkat Anda.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsExportConfirmOpen(false)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExportExcel}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Mading' : 'Tulis Mading'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Judul Pengumuman</label>
                <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Isi Pesan</label>
                <textarea required value={content} onChange={e=>setContent(e.target.value)} rows={5} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-700 resize-none" />
              </div>
              <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                <button type="button" onClick={closeForm} className="px-6 py-2.5 font-semibold text-gray-600 hover:bg-neutral-100 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-emerald-500 transition shadow-sm">
                  {editingId ? 'Simpan Perubahan' : 'Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 relative">
             <h3 className="font-bold text-lg text-gray-900 pr-20">{a.title}</h3>
             <p className="text-gray-600 text-sm mt-2 line-clamp-3">{a.content}</p>
             <div className="mt-4 text-xs font-semibold text-gray-400">
               {new Date(a.createdAt).toLocaleDateString()}
             </div>
             <div className="absolute top-4 right-4 flex gap-2">
               <button onClick={() => handleEdit(a)} className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-lg transition" title="Edit">
                 <Edit2 className="w-4 h-4"/>
               </button>
               <button onClick={() => setDeleteConfirmId(a.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg transition" title="Hapus">
                 <Trash2 className="w-4 h-4"/>
               </button>
             </div>
          </div>
        ))}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Mading?</h3>
            <p className="text-sm text-gray-500 mb-6">Mading ini akan dihapus secara permanen. Anda tidak dapat mengembalikan tindakan ini.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
