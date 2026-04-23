import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const API = "https://your-backend.onrender.com"; // ← replace with your backend URL

// ─── ICONS (inline SVG) ──────────────────────────────────────────────────────
const Icon = {
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h1m4 0h1M9 13h1m4 0h1"/>
    </svg>
  ),
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Complaint: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Apartment: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Key: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("bms_token");
  return fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

const toast = (msg, type = "success") => {
  const el = document.createElement("div");
  el.className = `fixed top-5 right-5 z-[9999] px-5 py-3 rounded-lg text-white text-sm font-medium shadow-xl transition-all duration-300 ${
    type === "success" ? "bg-blue-700" : "bg-red-600"
  }`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 font-mono">{value}</p>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── MODAL ───────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl leading-none">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────
const Field = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
    <input
      {...props}
      className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    Pending: "bg-amber-100 text-amber-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    Occupied: "bg-blue-100 text-blue-700",
    Vacant: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("bms_token", data.token);
        onLogin({ role: data.role, full_name: data.full_name, user_id: data.user_id });
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h1m4 0h1M9 13h1m4 0h1"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BuildingMS</h1>
          <p className="text-blue-300 text-sm mt-1">Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-blue-200 text-xs font-semibold uppercase tracking-widest block mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300"><Icon.Mail /></span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@bms.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-blue-200 text-xs font-semibold uppercase tracking-widest block mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300"><Icon.Lock /></span>
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-10 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                  {showPw ? <Icon.EyeOff /> : <Icon.Eye />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/40"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Contact your building admin for account access
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, role, name, onLogout }) => {
  const adminNav = [
    { id: "dashboard", label: "Dashboard", icon: <Icon.Dashboard /> },
    { id: "residents", label: "Residents", icon: <Icon.Users /> },
    { id: "apartments", label: "Apartments", icon: <Icon.Apartment /> },
    { id: "notices", label: "Notices", icon: <Icon.Bell /> },
    { id: "complaints", label: "Complaints", icon: <Icon.Complaint /> },
    { id: "chat", label: "Community Chat", icon: <Icon.Chat /> },
  ];

  const residentNav = [
    { id: "dashboard", label: "My Dashboard", icon: <Icon.Dashboard /> },
    { id: "notices", label: "Notices", icon: <Icon.Bell /> },
    { id: "complaints", label: "My Complaints", icon: <Icon.Complaint /> },
    { id: "chat", label: "Community Chat", icon: <Icon.Chat /> },
    { id: "change_password", label: "Change Password", icon: <Icon.Key /> },
  ];

  const nav = role === "admin" ? adminNav : residentNav;

  return (
    <aside className="w-60 bg-slate-900 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Icon.Building />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">BuildingMS</p>
            <p className="text-slate-500 text-xs mt-0.5">{role === "admin" ? "Admin Portal" : "Resident Portal"}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active === item.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
            {name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{name}</p>
            <p className="text-slate-500 text-xs capitalize">{role}</p>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition" title="Logout">
            <Icon.Logout />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-40 text-slate-400">Loading stats...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Building overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Flats" value={stats.flats.total} icon={<Icon.Apartment />} accent="bg-blue-100 text-blue-600" />
        <StatCard label="Occupied" value={stats.flats.occupied} sub={`${stats.flats.vacant} vacant`} icon={<Icon.Users />} accent="bg-emerald-100 text-emerald-600" />
        <StatCard label="Notices" value={stats.notices} icon={<Icon.Bell />} accent="bg-indigo-100 text-indigo-600" />
        <StatCard label="Complaints" value={stats.complaints.total} sub={`${stats.complaints.pending} pending`} icon={<Icon.Complaint />} accent="bg-amber-100 text-amber-600" />
      </div>

      {/* Occupancy bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">Occupancy Rate</h3>
          <span className="text-2xl font-bold text-blue-700 font-mono">
            {Math.round((stats.flats.occupied / stats.flats.total) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-1000"
            style={{ width: `${(stats.flats.occupied / stats.flats.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>{stats.flats.occupied} occupied</span>
          <span>{stats.flats.vacant} vacant</span>
        </div>
      </div>

      {/* Complaint breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Complaint Status</h3>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-500 font-mono">{stats.complaints.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-500 font-mono">{stats.complaints.resolved}</p>
            <p className="text-xs text-slate-400 mt-1">Resolved</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-700 font-mono">{stats.complaints.total}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── RESIDENT DASHBOARD ───────────────────────────────────────────────────────
const ResidentDashboard = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [privateNotices, setPrivateNotices] = useState([]);

  useEffect(() => {
    authFetch("/api/user_info").then(r => r.json()).then(setInfo).catch(() => {});
    authFetch("/api/my_private_notices").then(r => r.json()).then(setPrivateNotices).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.full_name?.split(" ")[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Your building resident dashboard</p>
      </div>

      {info && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Flat" value={info.flat_no} icon={<Icon.Apartment />} accent="bg-blue-100 text-blue-600" />
          <StatCard label="Members" value={info.members || "-"} icon={<Icon.Users />} accent="bg-indigo-100 text-indigo-600" />
          <StatCard label="Private Notices" value={privateNotices.length} icon={<Icon.Bell />} accent="bg-amber-100 text-amber-600" />
          <StatCard label="Floor" value={info.flat_no !== "Not Assigned" ? info.flat_no?.charAt(0) : "-"} icon={<Icon.Building />} accent="bg-emerald-100 text-emerald-600" />
        </div>
      )}

      {/* Profile card */}
      {info && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">My Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[["Full Name", info.full_name], ["Email", info.email], ["Phone", info.phone || "—"], ["NID", info.nid || "—"]].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{k}</p>
                <p className="text-slate-700 font-medium mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private Notices */}
      {privateNotices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">📬 Private Notices for You</h3>
          <div className="space-y-3">
            {privateNotices.map(n => (
              <div key={n.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                <p className="text-slate-500 text-sm mt-0.5">{n.content}</p>
                <p className="text-slate-400 text-xs mt-1">{n.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── RESIDENTS PAGE ───────────────────────────────────────────────────────────
const ResidentsPage = () => {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", flat: "", phone: "", nid: "", members: "" });
  const [pvForm, setPvForm] = useState({ title: "", content: "" });

  const load = () => authFetch("/api/admin/users").then(r => r.json()).then(setResidents).catch(() => {});
  useEffect(() => { load(); }, []);

  const addFamily = async () => {
    const res = await authFetch("/api/admin/add_family", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (data.status === "success") { toast(data.message); setShowModal(false); load(); setForm({ first_name: "", last_name: "", flat: "", phone: "", nid: "", members: "" }); }
    else toast(data.message, "error");
  };

  const remove = async (id) => {
    if (!confirm("Remove this resident?")) return;
    const res = await authFetch(`/api/admin/user/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status === "success") { toast("Resident removed"); load(); }
    else toast(data.message, "error");
  };

  const sendPrivate = async (userId) => {
    const res = await authFetch("/api/admin/private_notice", { method: "POST", body: JSON.stringify({ user_id: userId, ...pvForm }) });
    const data = await res.json();
    if (data.status === "success") { toast("Private notice sent!"); setShowPrivateModal(null); setPvForm({ title: "", content: "" }); }
    else toast(data.message, "error");
  };

  const filtered = residents.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.flat.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Residents</h1>
          <p className="text-slate-400 text-sm">{residents.length} total residents</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          <Icon.Plus /> Add Resident
        </button>
      </div>

      <input
        placeholder="Search by name or flat..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Name", "Flat", "Phone", "NID", "Members", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{r.name.charAt(0)}</div>
                    <span className="font-medium text-slate-700">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-blue-700 font-semibold">{r.flat}</td>
                <td className="px-4 py-3 text-slate-500">{r.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.nid || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.members || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowPrivateModal(r.id); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-1 rounded">Notice</button>
                    <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600 transition"><Icon.Trash /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No residents found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add New Resident" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              <Field label="Last Name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <Field label="Flat No." placeholder="e.g. 3A" value={form.flat} onChange={e => setForm({ ...form, flat: e.target.value })} />
            <Field label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Field label="NID" value={form.nid} onChange={e => setForm({ ...form, nid: e.target.value })} />
            <Field label="Members Count" type="number" value={form.members} onChange={e => setForm({ ...form, members: e.target.value })} />
            <p className="text-xs text-slate-400">Default password: <code className="bg-slate-100 px-1 rounded">123456</code></p>
            <button onClick={addFamily} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">Add Resident</button>
          </div>
        </Modal>
      )}

      {showPrivateModal && (
        <Modal title="Send Private Notice" onClose={() => setShowPrivateModal(null)}>
          <div className="space-y-3">
            <Field label="Title" value={pvForm.title} onChange={e => setPvForm({ ...pvForm, title: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message</label>
              <textarea value={pvForm.content} onChange={e => setPvForm({ ...pvForm, content: e.target.value })}
                rows={4} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => sendPrivate(showPrivateModal)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">Send Notice</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── APARTMENTS PAGE ──────────────────────────────────────────────────────────
const ApartmentsPage = () => {
  const [residents, setResidents] = useState([]);
  const [vacants, setVacants] = useState([]);

  useEffect(() => {
    authFetch("/api/admin/users").then(r => r.json()).then(setResidents).catch(() => {});
    fetch(`${API}/api/apartments/vacant`).then(r => r.json()).then(setVacants).catch(() => {});
  }, []);

  const allFlats = [...residents.map(r => ({ unit: r.flat, name: r.name, members: r.members, status: "Occupied" })),
    ...vacants.map(v => ({ unit: v, name: null, members: null, status: "Vacant" }))];
  allFlats.sort((a, b) => a.unit.localeCompare(b.unit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Apartments</h1>
        <p className="text-slate-400 text-sm">{residents.length} occupied · {vacants.length} vacant</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {allFlats.map(flat => (
          <div key={flat.unit}
            className={`rounded-xl border p-4 transition-all hover:shadow-md ${flat.status === "Occupied" ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 border-dashed"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg font-mono text-slate-800">{flat.unit}</span>
              <Badge status={flat.status} />
            </div>
            {flat.name ? (
              <>
                <p className="text-sm font-medium text-slate-700 truncate">{flat.name}</p>
                <p className="text-xs text-slate-400">{flat.members} member{flat.members !== 1 ? "s" : ""}</p>
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Unoccupied</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── NOTICES PAGE ─────────────────────────────────────────────────────────────
const NoticesPage = ({ role }) => {
  const [notices, setNotices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const load = () => fetch(`${API}/api/notices`).then(r => r.json()).then(setNotices).catch(() => {});
  useEffect(() => { load(); }, []);

  const post = async () => {
    const res = await authFetch("/api/admin/notices", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (data.status === "success") { toast("Notice posted!"); setShowModal(false); setForm({ title: "", content: "" }); load(); }
    else toast(data.message, "error");
  };

  const del = async (id) => {
    if (!confirm("Delete this notice?")) return;
    const res = await authFetch(`/api/notices/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status === "success") { toast("Notice deleted"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notice Board</h1>
          <p className="text-slate-400 text-sm">{notices.length} active notices</p>
        </div>
        {role === "admin" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <Icon.Plus /> Post Notice
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notices.map((n, i) => (
          <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span className="text-xs text-slate-400">{n.date_posted}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{n.title}</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{n.content}</p>
              </div>
              {role === "admin" && (
                <button onClick={() => del(n.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <Icon.Trash />
                </button>
              )}
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Icon.Bell />
            <p className="mt-2">No notices posted yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Post New Notice" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <Field label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Content</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                rows={5} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={post} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">Post Notice</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── COMPLAINTS PAGE ──────────────────────────────────────────────────────────
const ComplaintsPage = ({ role }) => {
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });

  const load = () => authFetch("/api/complaints").then(r => r.json()).then(setComplaints).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const res = await authFetch("/api/complaints", { method: "POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (data.status === "success") { toast("Complaint submitted!"); setShowModal(false); setForm({ subject: "", description: "" }); load(); }
    else toast(data.message, "error");
  };

  const resolve = async (id) => {
    const res = await authFetch(`/api/complaints/${id}`, { method: "PUT", body: JSON.stringify({ status: "Resolved" }) });
    const data = await res.json();
    if (data.status === "success") { toast("Marked resolved"); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Complaints</h1>
          <p className="text-slate-400 text-sm">{complaints.filter(c => c.status === "Pending").length} pending</p>
        </div>
        {role === "resident" && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <Icon.Plus /> Submit Complaint
          </button>
        )}
      </div>

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge status={c.status} />
                  <span className="text-xs text-slate-400">{c.date} · {c.submitted_by}</span>
                </div>
                <h3 className="font-bold text-slate-800">{c.subject}</h3>
                <p className="text-slate-500 text-sm mt-1">{c.description}</p>
              </div>
              {role === "admin" && c.status === "Pending" && (
                <button onClick={() => resolve(c.id)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition shrink-0">
                  <Icon.Check /> Resolve
                </button>
              )}
            </div>
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="text-center py-16 text-slate-400">No complaints found</div>
        )}
      </div>

      {showModal && (
        <Modal title="Submit Complaint" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <Field label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition">Submit</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
const ChatPage = ({ userName }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Simulate socket for demo — in production replace with socket.io-client
  useEffect(() => {
    authFetch("/api/messages").then(r => r.json()).then(msgs => {
      setMessages(msgs.map(m => ({ ...m, type: m.sender === userName ? "sent" : "received" })));
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg = { id: Date.now(), sender: userName, text, type: "sent", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    setText("");
    // In production: socket.emit('send_message', { sender: userName, text })
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Community Chat</h1>
        <p className="text-slate-400 text-sm">Building residents group</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-12">No messages yet. Start the conversation!</div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.type === "sent" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md ${m.type === "sent" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {m.type === "received" && (
                  <span className="text-xs text-slate-400 px-1">{m.sender}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  m.type === "sent"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4 flex items-center gap-3">
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={send} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition shrink-0">
            <Icon.Send />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CHANGE PASSWORD PAGE ─────────────────────────────────────────────────────
const ChangePasswordPage = () => {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (form.new_password !== form.confirm) { toast("Passwords don't match", "error"); return; }
    if (form.new_password.length < 6) { toast("Password too short", "error"); return; }
    setLoading(true);
    const res = await authFetch("/api/change_password", { method: "POST", body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }) });
    const data = await res.json();
    if (data.status === "success") { toast("Password changed!"); setForm({ old_password: "", new_password: "", confirm: "" }); }
    else toast(data.message, "error");
    setLoading(false);
  };

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Change Password</h1>
        <p className="text-slate-400 text-sm">Update your account password</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <Field label="Current Password" type="password" value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} />
        <Field label="New Password" type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} />
        <Field label="Confirm New Password" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
        <button onClick={submit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("bms_token");
    if (token) {
      authFetch("/api/user_info").then(r => r.json()).then(data => {
        if (data.status === "success") setUser({ role: data.role, full_name: data.full_name });
      }).catch(() => {});
    }
  }, []);

  const handleLogin = (userData) => { setUser(userData); setActive("dashboard"); };
  const handleLogout = () => { localStorage.removeItem("bms_token"); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (active) {
      case "dashboard":    return user.role === "admin" ? <AdminDashboard /> : <ResidentDashboard />;
      case "residents":    return <ResidentsPage />;
      case "apartments":   return <ApartmentsPage />;
      case "notices":      return <NoticesPage role={user.role} />;
      case "complaints":   return <ComplaintsPage role={user.role} />;
      case "chat":         return <ChatPage userName={user.full_name} />;
      case "change_password": return <ChangePasswordPage />;
      default:             return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar active={active} setActive={setActive} role={user.role} name={user.full_name} onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </AuthContext.Provider>
  );
}
