import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/db';
import { Lock, User as UserIcon, Mail, ChevronDown, ArrowLeft } from 'lucide-react';
import { Major, User } from '../types';

export default function LoginPage({ isRegister = false }: { isRegister?: boolean }) {
  const [isLogin, setIsLogin] = useState(!isRegister);
  
  // Update state when prop changes
  React.useEffect(() => {
    setIsLogin(!isRegister);
  }, [isRegister]);

  // Form State
  const [nisn, setNisn] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState<Major | ''>('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600));
    
    if (isLogin) {
      const users = db.getUsers();
      const user = users.find(u => u.nisn === nisn && u.password === password);
      
      if (user) {
        login(user);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        setError('NIS atau kata sandi salah.');
      }
    } else {
      // Registration
      const users = db.getUsers();
      if (users.find(u => u.nisn === nisn)) {
        setError('NIS sudah terdaftar.');
        setIsLoading(false);
        return;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        nisn,
        email,
        className,
        major,
        role: 'user',
        password
      };
      
      db.addUser(newUser);
      setSuccessMsg('Pendaftaran berhasil! Silakan login.');
      setIsLogin(true);
      setPassword('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-neutral-50 relative overflow-hidden py-12">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-neutral-100 p-8 relative z-10 w-full">
        <button
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition"
          onClick={() => navigate('/')}
          type="button"
          title="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{isLogin ? 'Masuk' : 'Daftar Akun'}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {isLogin ? 'Masuk ke sistem akademik mushola' : 'Buat akun siswa baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
              <div className="mt-0.5">⚠️</div>
              <div>{error}</div>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 flex items-start gap-2">
              <div className="mt-0.5">✅</div>
              <div>{successMsg}</div>
            </div>
          )}
          
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Depan</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Budi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Belakang</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kelas</label>
                  <div className="relative">
                    <select
                      required
                      value={className}
                      onChange={e => setClassName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none appearance-none"
                    >
                      <option value="" disabled>Pilih</option>
                      <option value="X">X</option>
                      <option value="XI">XI</option>
                      <option value="XII">XII</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jurusan</label>
                  <div className="relative">
                    <select
                      required
                      value={major}
                      onChange={e => setMajor(e.target.value as Major)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none appearance-none"
                    >
                      <option value="" disabled>Pilih</option>
                      <option value="AKL">AKL</option>
                      <option value="AKL 1">AKL 1</option>
                      <option value="AKL 2">AKL 2</option>
                      <option value="BR">BR</option>
                      <option value="BR 1">BR 1</option>
                      <option value="BR 2">BR 2</option>
                      <option value="MP">MP</option>
                      <option value="MP 1">MP 1</option>
                      <option value="MP 2">MP 2</option>
                      <option value="DKV">DKV</option>
                      <option value="DKV 1">DKV 1</option>
                      <option value="DKV 2">DKV 2</option>
                      <option value="RPL">RPL</option>
                      <option value="RPL 1">RPL 1</option>
                      <option value="RPL 2">RPL 2</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              NIS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                value={nisn}
                onChange={e => setNisn(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="Masukkan NIS"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (isLogin ? "Masuk" : "Daftar Akun")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm">
          {isLogin ? (
            <p className="text-gray-600">
              Belum punya akun?{' '}
              <Link to="/daftar" className="text-emerald-700 font-bold hover:underline">
                Daftar di sini
              </Link>
            </p>
          ) : (
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
