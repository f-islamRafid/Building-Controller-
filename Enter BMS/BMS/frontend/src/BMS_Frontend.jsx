import React, { useState, useEffect, createContext, useContext } from 'react';
import io from 'socket.io-client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * MOCK AUTH CONTEXT 
 * Integrated directly to prevent import errors in the preview environment.
 */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = 'http://127.0.0.1:5000';
const socket = io(API_BASE_URL);

const BMS_Frontend = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Theme
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // Data State
    const [stats, setStats] = useState(null);
    const [residents, setResidents] = useState([]);
    const [notices, setNotices] = useState([]);
    const [privateNotices, setPrivateNotices] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [vacantFlatsList, setVacantFlatsList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [prayerInfo, setPrayerInfo] = useState("Loading Prayer...");

    const handleResponse = async (res) => {
        if (res.ok) return true;
        try {
            const err = await res.json();
            console.error("Error Response:", err);
        } catch (e) {
            console.error("Critical Server Error:", e);
        }
        return false;
    };

    useEffect(() => {
        const fetchPrayerTimes = async () => {
            try {
                const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Chattogram&country=Bangladesh&method=1');
                const data = await response.json();
                const timings = data.data.timings;

                const formatTime = (timeStr) => {
                    if (!timeStr) return "";
                    let [h, m] = timeStr.split(':').map(Number);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12 || 12;
                    return `${h}:${m < 10 ? '0'+m : m} ${ampm}`;
                };

                const toMinutes = (timeStr) => {
                    const [h, m] = timeStr.split(':').map(Number);
                    return h * 60 + m;
                };

                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const tFajr = toMinutes(timings.Fajr);
                const tSunrise = toMinutes(timings.Sunrise);
                const tDhuhr = toMinutes(timings.Dhuhr);
                const tAsr = toMinutes(timings.Asr);
                const tMaghrib = toMinutes(timings.Maghrib);
                const tIsha = toMinutes(timings.Isha);
                
                let displayText = "Next: Fajr";
                if (currentMinutes >= tFajr && currentMinutes < tSunrise) displayText = `${formatTime(timings.Fajr)} - ${formatTime(timings.Sunrise)} Fajr`;
                else if (currentMinutes >= tSunrise && currentMinutes < tDhuhr) displayText = `Next: Dhuhr at ${formatTime(timings.Dhuhr)}`;
                else if (currentMinutes >= tDhuhr && currentMinutes < tAsr) displayText = `${formatTime(timings.Dhuhr)} - ${formatTime(timings.Asr)} Dhuhr`;
                else if (currentMinutes >= tAsr && currentMinutes < tMaghrib) displayText = `${formatTime(timings.Asr)} - ${formatTime(timings.Maghrib)} Asr`;
                else if (currentMinutes >= tMaghrib && currentMinutes < tIsha) displayText = `${formatTime(timings.Maghrib)} - ${formatTime(timings.Isha)} Maghrib`;
                else displayText = `${formatTime(timings.Isha)} Isha Time`;

                setPrayerInfo(displayText);
            } catch (err) {
                setPrayerInfo("Time Unavailable");
            }
        };

        fetchPrayerTimes();
        const interval = setInterval(fetchPrayerTimes, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        const res = await fetch(`${API_BASE_URL}/api/stats`);
        if(res.ok) setStats(await res.json());
    };
    const fetchResidents = async () => {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setResidents(await res.json());
    };
    const fetchVacant = async () => {
        const res = await fetch(`${API_BASE_URL}/api/apartments/vacant`);
        if(res.ok) setVacantFlatsList(await res.json());
    };
    const fetchNotices = async () => {
        const res = await fetch(`${API_BASE_URL}/api/notices`);
        if(res.ok) setNotices(await res.json());
    };
    const fetchPrivateNotices = async () => {
        const res = await fetch(`${API_BASE_URL}/api/my_private_notices`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setPrivateNotices(await res.json());
    };
    const fetchComplaints = async () => {
        const res = await fetch(`${API_BASE_URL}/api/complaints`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setComplaints(await res.json());
    };
    const fetchMessages = async () => {
        const res = await fetch(`${API_BASE_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setMessages(await res.json());
    };

    useEffect(() => {
        if (!user) return;
        fetchStats(); fetchNotices(); fetchVacant(); fetchComplaints(); fetchMessages(); fetchPrivateNotices();
        if (user.role === 'admin') fetchResidents();
        socket.on('receive_message', (data) => setMessages((prev) => [...prev, data]));
        return () => socket.off('receive_message');
    }, [user, activeTab]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        socket.emit('send_message', { id: Date.now(), sender: user.name || "User", text: messageInput, type: "sent" });
        setMessageInput("");
    };

    const occupancyData = stats ? [
        { name: 'Occupied', value: stats.flats.occupied },
        { name: 'Vacant', value: stats.flats.vacant },
    ] : [];
    const complaintData = stats ? [
        { name: 'Pending', value: stats.complaints.pending },
        { name: 'Resolved', value: stats.complaints.resolved },
    ] : [];
    const COLORS = ['#6c5ce7', '#dfe6e9'];

    if (!user) return <div className="p-10 text-center">Please Log In to continue.</div>;

    return (
        <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                <div className="mb-10 text-2xl font-bold text-indigo-600">BMS Portal</div>
                <nav className="flex-1 space-y-2">
                    {['dashboard', 'notices', 'complaints', 'vacant', 'chat', 'settings'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-4 py-2 rounded-lg capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                    {user.role === 'admin' && ['residents', 'add-family'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-4 py-2 rounded-lg capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto space-y-2">
                    <button onClick={toggleTheme} className="w-full text-sm border border-slate-300 dark:border-slate-600 py-2 rounded">
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>
                    <button onClick={logout} className="w-full bg-red-50 text-red-600 py-2 rounded font-medium">Logout</button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Hello, {user.name}</h1>
                        <p className="opacity-70">Building Management System</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white dark:bg-slate-800 px-4 py-1 rounded shadow-sm text-sm font-medium border border-slate-100 dark:border-slate-700 mb-1">{new Date().toDateString()}</div>
                        <div className="text-indigo-600 text-xs font-bold uppercase">{prayerInfo}</div>
                    </div>
                </header>

                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                                <p className="text-indigo-100 text-sm">Total Residents</p>
                                <p className="text-4xl font-bold">{stats.flats.occupied}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="opacity-70 text-sm">Vacant Flats</p>
                                <p className="text-4xl font-bold text-blue-500">{stats.flats.vacant}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="opacity-70 text-sm">Total Notices</p>
                                <p className="text-4xl font-bold text-orange-500">{stats.notices}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="opacity-70 text-sm">Complaints</p>
                                <p className="text-4xl font-bold text-emerald-500">{stats.complaints.total}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm h-80">
                                <h3 className="font-bold mb-4">🏠 Occupancy Status</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                        <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {occupancyData.map((e, i) => <Cell key={i} fill={COLORS[i % 2]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm h-80">
                                <h3 className="font-bold mb-4">⚠️ Complaints</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={complaintData}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px] border border-slate-100 dark:border-slate-700">
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.sender === user.name ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-2xl ${m.sender === user.name ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 rounded-tl-none'}`}>
                                        <p className="text-xs font-bold mb-1 opacity-70">{m.sender}</p>
                                        <p>{m.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                            <input 
                                value={messageInput} 
                                onChange={e => setMessageInput(e.target.value)} 
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Send</button>
                        </form>
                    </div>
                )}

                <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 opacity-60 text-xs text-center">
                    <p>Building Address: Road-01, Block-I, Lane-05, Halishahar Housing Estate, Chattogram 4216</p>
                    <p>Constructed: 2024 | Building No: 30/32</p>
                </footer>
            </main>
        </div>
    );
};

// --- WRAPPER FOR PREVIEW ---
export default function App() {
    const [user, setUser] = useState({ name: 'Admin User', role: 'admin', token: 'mock-token' });
    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, logout }}>
            <BMS_Frontend />
        </AuthContext.Provider>
    );
}