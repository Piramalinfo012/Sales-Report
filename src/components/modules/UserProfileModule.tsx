import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, Shield, Building, Key, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const UserProfileModule: React.FC = () => {
  const { authState, showToast } = useAuth();
  const user = authState.user;

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPass.length < 6) {
      showToast('error', 'Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsChanging(true);
    // Simulate password change request update
    setTimeout(() => {
      setIsChanging(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      showToast('success', 'Password Updated', 'Your password was changed successfully.');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user?.profileUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
          alt={user?.userName}
          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-sky-500/30 shrink-0"
        />

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950 text-sky-600 border border-sky-800 text-xs font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.role} Account</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">{user?.userName}</h1>
          <p className="text-xs text-slate-400">Employee ID: <span className="font-mono text-slate-200">{user?.id}</span></p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>{user?.gmail || 'user@enterprise.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manager: {user?.manager}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Key className="w-5 h-5 text-sky-600" />
          <h2 className="font-bold text-base text-white">Change Account Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChanging}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20"
          >
            {isChanging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
