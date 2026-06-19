import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/db';
import { Schedule, Attendance, Announcement } from '../types';
import { User as UserIcon, Calendar, CheckCircle, Percent, X, Bell, Clock, BookOpen } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'mading'>('schedules');
  
  // Modal state
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');

  const loadData = () => {
    if (!user) return;
    const fetchedSchedules = db.getSchedules();
    setAllSchedules(fetchedSchedules);
    const targetedSchedules = fetchedSchedules.filter(s => s.targetMajor === 'All' || (user.major && user.major.startsWith(s.targetMajor)));
    setMySchedules(targetedSchedules);

    const allAttendance = db.getAttendance();
    const myRecs = allAttendance.filter(a => a.userId === user.id);
    setMyAttendance(myRecs);

    setAnnouncements(db.getAnnouncements());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const handleMarkHadir = (scheduleId: string) => {
    if (!user) return;
    const newRecord: Attendance = {
      id: Date.now().toString(),
      userId: user.id,
      scheduleId,
      status: 'Hadir',
      timestamp: new Date().toISOString()
    };
    db.addAttendance(newRecord);
    loadData();
  };

  const openAbsenceModal = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setAbsenceReason('');
    setAbsenceModalOpen(true);
  };

  const handleMarkAbsen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedScheduleId) return;
    
    const newRecord: Attendance = {
      id: Date.now().toString(),
      userId: user.id,
      scheduleId: selectedScheduleId,
      status: 'Absen',
      reason: absenceReason,
      timestamp: new Date().toISOString()
    };
    db.addAttendance(newRecord);
    setAbsenceModalOpen(false);
    setSelectedScheduleId(null);
    setAbsenceReason('');
    loadData();
  };

  const totalMySchedules = mySchedules.length;
  const targetedScheduleIds = new Set(mySchedules.map(s => s.id));
  const totalAttended = myAttendance.filter(a => a.status === 'Hadir' && targetedScheduleIds.has(a.scheduleId)).length;
  const rawPercentage = totalMySchedules > 0 ? Math.round((totalAttended / totalMySchedules) * 100) : 0;
  const attendancePercentage = Math.min(rawPercentage, 100);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Siswa</h1>
        <p className="text-gray-500 mt-2">Pantau jadwal dan persentase kehadiran Anda.</p>
      </div>

      <div className="mb-6 border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'schedules'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('mading')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'mading'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-4 h-4" /> Mading Digital
          </button>
        </nav>
      </div>

      {activeTab === 'schedules' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <UserIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.className} • Jurusan {user.major}</p>
                <p className="text-xs text-gray-400 mt-1">NIS: {user.nisn}</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-md p-6 text-white flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-emerald-100 font-medium">Persentase Hadir</h3>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Percent className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-extrabold tracking-tight">
                {attendancePercentage}%
              </div>
              <div className="text-sm mt-2 text-emerald-100">
                ({Math.min(totalAttended, totalMySchedules)} dari {totalMySchedules} jadwal yang diwajibkan)
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Jadwal Penugasan Sholat Anda</h3>
            </div>
            
            {allSchedules.length > 0 ? (
              <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-neutral-50 text-xs uppercase text-gray-500 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Waktu Sholat</th>
                  <th className="px-6 py-4 font-semibold">Jurusan</th>
                  <th className="px-6 py-4 font-semibold">Nama Imam</th>
                  <th className="px-6 py-4 font-semibold text-center">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {allSchedules.map(schedule => {
                   const attendanceRecord = myAttendance.find(a => a.scheduleId === schedule.id);
                   const isTargeted = schedule.targetMajor === 'All' || (user?.major && user.major.startsWith(schedule.targetMajor));
                   
                   return (
                    <tr key={schedule.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{schedule.date}</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {schedule.prayerName}
                        </span>
                      </td>
                      <td className="px-6 py-4">{schedule.targetMajor === 'All' ? 'Semua (Umum)' : schedule.targetMajor}</td>
                      <td className="px-6 py-4">{schedule.imamName}</td>
                      <td className="px-6 py-4 text-center">
                        {!isTargeted ? (
                          <span className="text-gray-400 italic text-xs">Tidak diwajibkan</span>
                        ) : attendanceRecord ? (
                          attendanceRecord.status === 'Hadir' ? (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                               <CheckCircle className="w-3.5 h-3.5" /> Hadir
                             </span>
                          ) : (
                             <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium" title={attendanceRecord.reason}>
                               Absen
                             </span>
                          )
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                             <button
                               onClick={() => handleMarkHadir(schedule.id)}
                               className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition"
                             >
                               Hadir
                             </button>
                             <button
                               onClick={() => openAbsenceModal(schedule.id)}
                               className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition"
                             >
                               Absen
                             </button>
                          </div>
                        )}
                      </td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">
            Belum ada jadwal yang diposting.
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'mading' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-neutral-100 pb-4">
            <Bell className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mading Digital</h2>
          </div>
          
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">{announcement.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                  <Clock className="w-4 h-4" />
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {announcements.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-neutral-50 rounded-2xl border border-neutral-100">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium">Belum ada mading yang dipublikasikan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {absenceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Absen</h3>
              <button onClick={() => setAbsenceModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMarkAbsen} className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Ketidakhadiran
              </label>
              <textarea
                required
                value={absenceReason}
                onChange={e => setAbsenceReason(e.target.value)}
                placeholder="Misal: Sedang sakit / Izin keluarga / Haid"
                rows={3}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none mb-6 text-sm"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAbsenceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Simpan Status Absen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
