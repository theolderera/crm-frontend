"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import {
  Camera,
  Mail,
  Phone,
  Shield,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Lock,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ProfileData {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  stats: {
    totalGroups: number;
    mentorGroups: number;
    teacherGroups: number;
    totalStudents: number;
    avgAttendance: number;
  };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar & Cropper
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setEditForm({ firstName: data.firstName, lastName: data.lastName || "", phone: data.phone });
    } catch (e) {
      toast.error("Хатогӣ ҳангоми боркунии профил");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!editForm.firstName.trim()) {
      toast.error("Ном бояд пур бошад");
      return;
    }
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile(editForm);
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      refreshUser();
      toast.success("Маълумот нав карда шуд");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Хатогӣ рӯй дод");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error("Рамзҳои нав мувофиқат намекунанд");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Рамзи нав бояд ҳадди ақал 6 аломат бошад");
      return;
    }
    setChangingPassword(true);
    try {
      await profileApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Рамз бомуваффақият иваз шуд");
      setPasswordForm({ oldPassword: "", newPassword: "", confirm: "" });
      setShowPasswordSection(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Рамзи кунунӣ нодуруст аст");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ҳаҷми файл аз 5MB зиёд аст");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || "");
      setCropModalOpen(true);
      // Reset cropper state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    });
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    setUploadingAvatar(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (!croppedImage) throw new Error("Хатогӣ ҳангоми буридани расм");

      const updated = await profileApi.uploadAvatar(croppedImage);
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      refreshUser();
      toast.success("Сурат нав карда шуд");
      setCropModalOpen(false);
    } catch (e: any) {
      toast.error("Хатогӣ ҳангоми боркунии сурат");
    } finally {
      setUploadingAvatar(false);
    }
  };

  function getRoleBadge(role: string) {
    const map: Record<string, { label: string; color: string }> = {
      ADMIN: { label: "Администратор", color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
      MENTOR: { label: "Ментор", color: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20" },
      TEACHER: { label: "Муаллим", color: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20" },
      USER: { label: "Корбар", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    };
    const info = map[role] || map.USER;
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${info.color}`}>{info.label}</span>;
  }

  const avatarUrl = profile?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}/uploads/avatars/${profile.avatar}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Profile Header ─── */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Dynamic Background Banner */}
        <div className="h-40 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          {avatarUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" 
              style={{ backgroundImage: `url(${avatarUrl})` }} 
            />
          )}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiLz48L2c+PC9zdmc+')] opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-[#0f172a] shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {profile.firstName[0]}{profile.lastName?.[0] || ""}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition opacity-0 group-hover:opacity-100 z-10"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Name + Role */}
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {profile.firstName} {profile.lastName}
                </h1>
                {getRoleBadge(profile.role)}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {profile.email}
                  {profile.isEmailVerified && <CheckCircle2 size={14} className="text-emerald-500" />}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} />
                  {profile.phone}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
            >
              <Edit3 size={16} />
              Таҳрир
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      {(profile.role === "MENTOR" || profile.role === "TEACHER" || profile.role === "ADMIN") && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Гурӯҳҳо" value={profile.stats.totalGroups} color="indigo" />
          <StatCard icon={GraduationCap} label="Донишҷӯён" value={profile.stats.totalStudents} color="violet" />
          <StatCard icon={BarChart3} label="Ҳузур" value={`${profile.stats.avgAttendance}%`} color="emerald" />
          <StatCard icon={Calendar} label="Аъзо аз" value={new Date(profile.createdAt).toLocaleDateString("ru")} color="sky" />
        </div>
      )}

      {/* ─── Edit Profile Section ─── */}
      {isEditing && (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Таҳрири маълумот</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Ном</label>
              <input
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Насаб</label>
              <input
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Телефон</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
              Нигоҳ доштан
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X size={16} />
              Бекор
            </button>
          </div>
        </div>
      )}

      {/* ─── Details Card ─── */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Маълумоти шахсӣ</h2>
        <div className="space-y-4">
          <DetailRow icon={<Shield size={16} className="text-indigo-500" />} label="Рол" value={getRoleBadge(profile.role)} />
          <DetailRow icon={<Mail size={16} className="text-violet-500" />} label="Имейл" value={
            <span className="flex items-center gap-1.5">
              {profile.email}
              {profile.isEmailVerified
                ? <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold"><CheckCircle2 size={12} /> Тасдиқшуда</span>
                : <span className="text-amber-500 flex items-center gap-1 text-xs font-bold"><AlertCircle size={12} /> Тасдиқнашуда</span>
              }
            </span>
          } />
          <DetailRow icon={<Phone size={16} className="text-sky-500" />} label="Телефон" value={profile.phone} />
          <DetailRow icon={<Calendar size={16} className="text-emerald-500" />} label="Санаи сабти ном" value={new Date(profile.createdAt).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })} />
        </div>
      </div>

      {/* ─── Change Password ─── */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Lock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Иваз кардани рамз</h2>
              <p className="text-xs text-slate-500">Рамзи кунунӣ ва навро ворид кунед</p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition ${showPasswordSection ? 'rotate-180' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" /></svg>
          </div>
        </button>

        {showPasswordSection && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Рамзи кунунӣ</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
                />
                <button onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Рамзи нав</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
                />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Такрори рамзи нав</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-900 dark:text-white"
              />
              {passwordForm.confirm && passwordForm.newPassword !== passwordForm.confirm && (
                <p className="text-xs text-rose-500 mt-1">Рамзҳо мувофиқат намекунанд</p>
              )}
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirm}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-bold text-sm rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
            >
              {changingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={16} />}
              Иваз кардан
            </button>
          </div>
        )}
      </div>

      {/* ─── Crop Modal ─── */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Буридани расм</h3>
              <button 
                onClick={() => setCropModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative w-full h-[300px] sm:h-[400px] bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1} // perfectly square/round
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 flex justify-between mb-2">
                  <span>Андоза (Zoom)</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 flex justify-between mb-2">
                  <span>Тоб додан (Rotate)</span>
                  <span>{rotation}°</span>
                </label>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={uploadCroppedImage}
                  disabled={uploadingAvatar}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {uploadingAvatar ? "Боркунӣ..." : "Тасдиқ ва Боркунӣ"}
                </button>
                <button
                  onClick={() => setCropModalOpen(false)}
                  disabled={uploadingAvatar}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Бекор
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ───

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20",
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value}</div>
      </div>
    </div>
  );
}
