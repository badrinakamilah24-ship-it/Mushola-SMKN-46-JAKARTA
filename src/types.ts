export type Role = 'admin' | 'user';
export type Major = 'BR' | 'AKL' | 'DKV' | 'RPL' | 'MP' | 'AKL 1' | 'AKL 2' | 'BR 1' | 'BR 2' | 'MP 1' | 'MP 2' | 'DKV 1' | 'DKV 2' | 'RPL 1' | 'RPL 2' | string;

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  nisn: string; // Used as username for students
  className: string;
  major: Major | '';
  role: Role;
  password?: string; // In a real app, never send this to the client
}

export interface Schedule {
  id: string;
  prayerName: string; // Dzuhur, Ashar, Jumat
  date: string; // ISO Date string
  targetMajor: Major | 'All';
  imamName: string;
  createdBy: string;
}

export interface Attendance {
  id: string;
  userId: string;
  scheduleId: string;
  status: 'Hadir' | 'Absen';
  reason?: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
