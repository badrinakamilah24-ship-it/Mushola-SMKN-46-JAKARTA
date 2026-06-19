import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { Schedule, Announcement } from '../types';
import { Calendar, Clock, MapPin, Bell, User as UserIcon, BookOpen } from 'lucide-react';

export default function LandingPage() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadData = () => {
    const allSchedules = db.getSchedules();

    // Sort schedules by date ascending
    const sortedSchedules = [...allSchedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Display all schedules since user expects all posted schedules to appear
    setTodaySchedules(sortedSchedules);

    setAnnouncements(db.getAnnouncements());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 w-full bg-white">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path fill="#ffffff" fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Selamat Datang di<br className="hidden sm:block" /> Mushola SMKN 46 JAKARTA
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto">
            Sistem Informasi Jadwal Sholat Berjamaah, Khotib, dan Kegiatan Kajian Digital Siswa.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-white text-emerald-900 font-bold rounded-lg shadow-lg hover:bg-emerald-50 transition transform hover:-translate-y-1">
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Jadwal Sholat Board */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8 border-b pb-4">
              <Clock className="w-8 h-8 text-emerald-600" />
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Jadwal Sholat Terbaru</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todaySchedules.map((schedule) => (
                <div key={schedule.id} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-neutral-100 hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                      {schedule.prayerName}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {schedule.date}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nama Imam / Khotib</p>
                        <p className="text-lg font-bold text-gray-900">{schedule.imamName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Wajib Hadir (Jurusan)</p>
                        <p className="text-lg font-bold text-gray-900">
                          {schedule.targetMajor === 'All' ? 'Semua Jurusan (Umum)' : `Khusus ${schedule.targetMajor}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {todaySchedules.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-medium">Belum ada jadwal sholat yang tercatat.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mading Digital */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 rounded-3xl p-6 md:p-8 border border-neutral-200 h-full">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mading Digital</h2>
              </div>
              
              <div className="space-y-6">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p>Mading kosong.</p>
                  </div>
                )}

                {announcements.length > 3 && (
                  <div className="text-center mt-6">
                    <Link to="/login" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition">
                      Lihat Selengkapnya <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
