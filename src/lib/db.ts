import { User, Schedule, Attendance, Announcement, Major } from '../types';

const USERS_KEY = 'mushola_users_v2';
const SCHEDULES_KEY = 'mushola_schedules_v2';
const ATTENDANCE_KEY = 'mushola_attendance_v2';
const ANNOUNCEMENTS_KEY = 'mushola_announcements_v2';

export const seedDatabase = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers: User[] = [
      { 
        id: '1', 
        name: 'Admin Utama', 
        firstName: 'Admin',
        lastName: 'Utama',
        email: 'admin@skanpatnam.id',
        nisn: 'admin@skanpatnam.id', // using email as NISN/Username for login
        className: '', 
        major: '', 
        role: 'admin', 
        password: '4dm1n_Mush0l4_46!' 
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(SCHEDULES_KEY)) {
    const today = new Date().toISOString().split('T')[0];
    const defaultSchedules: Schedule[] = [
      { id: '1', prayerName: 'Dzuhur', date: today, targetMajor: 'All', imamName: 'Ust. Admin', createdBy: '1' }
    ];
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(defaultSchedules));
  }

  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([]));
  }
};

export const getItems = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setItem = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const db = {
  getUsers: () => getItems<User>(USERS_KEY),
  addUser: (user: User) => {
    const users = db.getUsers();
    setItem(USERS_KEY, [...users, user]);
  },
  
  getSchedules: () => getItems<Schedule>(SCHEDULES_KEY),
  addSchedule: (schedule: Schedule) => {
    const schedules = db.getSchedules();
    setItem(SCHEDULES_KEY, [...schedules, schedule]);
  },
  updateSchedule: (id: string, updatedSchedule: Schedule) => {
    const schedules = db.getSchedules();
    setItem(SCHEDULES_KEY, schedules.map(s => s.id === id ? updatedSchedule : s));
  },
  deleteSchedule: (id: string) => {
    const schedules = db.getSchedules();
    setItem(SCHEDULES_KEY, schedules.filter(s => s.id !== id));
  },
  
  getAttendance: () => getItems<Attendance>(ATTENDANCE_KEY),
  addAttendance: (attendance: Attendance) => {
    const records = db.getAttendance();
    setItem(ATTENDANCE_KEY, [...records, attendance]);
  },
  
  getAnnouncements: () => getItems<Announcement>(ANNOUNCEMENTS_KEY),
  addAnnouncement: (announcement: Announcement) => {
    const announcements = db.getAnnouncements();
    setItem(ANNOUNCEMENTS_KEY, [...announcements, announcement]);
  },
  updateAnnouncement: (id: string, updated: Partial<Announcement>) => {
    const announcements = db.getAnnouncements();
    setItem(ANNOUNCEMENTS_KEY, announcements.map(a => a.id === id ? { ...a, ...updated } : a));
  },
  deleteAnnouncement: (id: string) => {
    const records = db.getAnnouncements();
    setItem(ANNOUNCEMENTS_KEY, records.filter(a => a.id !== id));
  }
};
