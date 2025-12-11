import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import io from 'socket.io-client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const socket = io('https://bms-backend-9d34.onrender.com');

const BMS_Frontend = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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
    
    // PRAYER TIME STATE
    const [prayerInfo, setPrayerInfo] = useState("Loading Prayer...");

    const handleResponse = async (res) => {
        if (res.ok) return true;
        try {
            const err = await res.json();
            const errorMsg = err.message || err.msg || "Unknown Server Error";
            alert("❌ Error: " + errorMsg);
        } catch (e) {
            console.error("Server Error:", e);
            alert("❌ Critical Server Error. Check Python Terminal.");
        }
        return false;
    };

    // --- AUTOMATIC PRAYER TIME LOGIC ---
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
                    h = h % 12;
                    h = h ? h : 12;
                    return `${h}:${m} ${ampm}`;
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

                if (currentMinutes >= tFajr && currentMinutes < tSunrise) {
                    displayText = `${formatTime(timings.Fajr)} - ${formatTime(timings.Sunrise)} Fajr Time`;
                } else if (currentMinutes >= tSunrise && currentMinutes < tDhuhr) {
                    displayText = `Next: Dhuhr at ${formatTime(timings.Dhuhr)}`;
                } else if (currentMinutes >= tDhuhr && currentMinutes < tAsr) {
                    displayText = `${formatTime(timings.Dhuhr)} - ${formatTime(timings.Asr)} Dhuhr Time`;
                } else if (currentMinutes >= tAsr && currentMinutes < tMaghrib) {
                    displayText = `${formatTime(timings.Asr)} - ${formatTime(timings.Maghrib)} Asr Time`;
                } else if (currentMinutes >= tMaghrib && currentMinutes < tIsha) {
                    displayText = `${formatTime(timings.Maghrib)} - ${formatTime(timings.Isha)} Maghrib Time`;
                } else if (currentMinutes >= tIsha || currentMinutes < tFajr) {
                    displayText = `${formatTime(timings.Isha)} - ${formatTime(timings.Midnight)} Isha Time`;
                }

                setPrayerInfo(displayText);

            } catch (err) {
                console.error("Prayer API Error", err);
                setPrayerInfo("Time Unavailable");
            }
        };

        fetchPrayerTimes();
        const interval = setInterval(fetchPrayerTimes, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- FETCHING DATA ---
    const fetchStats = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/stats');
        if(res.ok) setStats(await res.json());
    };
    const fetchResidents = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/admin/users', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setResidents(await res.json());
    };
    const fetchVacant = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/apartments/vacant');
        if(res.ok) setVacantFlatsList(await res.json());
    };
    const fetchNotices = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/notices');
        if(res.ok) setNotices(await res.json());
    };
    const fetchPrivateNotices = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/my_private_notices', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setPrivateNotices(await res.json());
    };
    const fetchComplaints = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/complaints', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setComplaints(await res.json());
    };
    const fetchMessages = async () => {
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/messages', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setMessages(await res.json());
    };

    useEffect(() => {
        if (!user) return;
        fetchStats(); fetchNotices(); fetchVacant(); fetchComplaints(); fetchMessages(); fetchPrivateNotices();
        if (user.role === 'admin') fetchResidents();
        socket.on('receive_message', (data) => setMessages((prev) => [...prev, data]));
        return () => socket.off('receive_message');
    }, [user, activeTab]);

    // --- CHART DATA ---
    const occupancyData = stats ? [
        { name: 'Occupied', value: stats.flats.occupied },
        { name: 'Vacant', value: stats.flats.vacant },
    ] : [];
    const COLORS = ['#6c5ce7', '#dfe6e9'];
    const complaintData = stats ? [
        { name: 'Pending', value: stats.complaints.pending },
        { name: 'Resolved', value: stats.complaints.resolved },
    ] : [];

    // --- HANDLERS ---
    const handleAddFamily = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            first_name: formData.get('first_name'), last_name: formData.get('last_name'),
            nid: formData.get('nid'), flat: formData.get('flat'),
            members: parseInt(formData.get('members')), phone: formData.get('phone')
        };
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/admin/add_family', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify(payload)
        });
        if (await handleResponse(res)) {
            const flat = payload.flat.toLowerCase();
            alert(`✅ Family Added!\nLogin: ${flat}@bms.com\nPass: 123456`);
            fetchResidents(); fetchVacant(); fetchStats(); e.target.reset();
        }
    };
    const handleRemoveFamily = async (id) => {
        if(window.confirm("Remove family?")) {
            const res = await fetch(`https://bms-backend-9d34.onrender.com/api/admin/user/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
            if (await handleResponse(res)) { fetchResidents(); fetchStats(); }
        }
    };
    const handlePostNotice = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/admin/notices', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ title: formData.get('title'), content: formData.get('content') })
        });
        if (await handleResponse(res)) { alert("✅ Public Notice Posted!"); fetchNotices(); fetchStats(); e.target.reset(); }
    };
    const handleSendPrivateNotice = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/admin/private_notice', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ user_id: formData.get('user_id'), title: formData.get('title'), content: formData.get('content') })
        });
        if (await handleResponse(res)) { alert("✅ Private Notice Sent!"); e.target.reset(); }
    };
    const handleDeleteNotice = async (id) => {
        if (window.confirm("Delete notice?")) {
            const res = await fetch(`https://bms-backend-9d34.onrender.com/api/notices/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
            if (await handleResponse(res)) { fetchNotices(); fetchStats(); }
        }
    };
    const handlePostComplaint = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/complaints', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ subject: formData.get('subject'), description: formData.get('description') })
        });
        if (await handleResponse(res)) { alert("✅ Complaint Sent!"); fetchComplaints(); fetchStats(); e.target.reset(); }
    };
    const handleUpdateComplaint = async (id, newStatus) => {
        const res = await fetch(`https://bms-backend-9d34.onrender.com/api/complaints/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (await handleResponse(res)) { fetchComplaints(); fetchStats(); }
    };
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('new_password');
        const confirm = formData.get('confirm_password');
        if (password !== confirm) { alert("❌ Passwords do not match!"); return; }
        const res = await fetch('https://bms-backend-9d34.onrender.com/api/change_password', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ old_password: formData.get('old_password'), new_password: password })
        });
        if (await handleResponse(res)) { alert("✅ Password Changed! Login again."); logout(); navigate('/login'); }
    };
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        socket.emit('send_message', { id: Date.now(), sender: user.name || "User", text: messageInput, type: "sent" });
        setMessageInput("");
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                {/* --- LOGO REPLACES TEXT --- */}
                <div className="logo-section">
                    <img src="/bms-logo.png" alt="BMS Logo" className="sidebar-logo" />
                </div>

                <ul className="nav-links">
                    <li className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><span>📊</span> Dashboard</li>
                    {user?.role === 'admin' && <><li className={`nav-item ${activeTab==='add-family'?'active':''}`} onClick={()=>setActiveTab('add-family')}><span>➕</span> Add Family</li><li className={`nav-item ${activeTab==='residents'?'active':''}`} onClick={()=>setActiveTab('residents')}><span>👥</span> Residents</li></>}
                    <li className={`nav-item ${activeTab==='notices'?'active':''}`} onClick={()=>setActiveTab('notices')}><span>📢</span> Notices</li>
                    <li className={`nav-item ${activeTab==='complaints'?'active':''}`} onClick={()=>setActiveTab('complaints')}><span>⚠️</span> Complaints</li>
                    <li className={`nav-item ${activeTab==='vacant'?'active':''}`} onClick={()=>setActiveTab('vacant')}><span>🏠</span> Vacant Flats</li>
                    <li className={`nav-item ${activeTab==='chat'?'active':''}`} onClick={()=>setActiveTab('chat')}><span>💬</span> Chat Box</li>
                    <li className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}><span>⚙️</span> Settings</li>
                </ul>
                <div className="theme-btn" onClick={toggleTheme}>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
                <div className="logout-btn" onClick={() => { logout(); navigate('/login'); }}><span>🚪</span> Logout</div>
            </aside>
            <main className="main-content">
                <header className="header-welcome">
                    <div><h1>Hello, {user?.name}</h1><p style={{color:'var(--text-secondary)'}}>Welcome to the Building Management System.</p></div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px'}}>
                        <div className="date-badge">{new Date().toDateString()}</div>
                        <div className="prayer-badge">{prayerInfo}</div>
                    </div>
                </header>
                
                {/* TABS */}
                {activeTab === 'dashboard' && stats && (
                    <div>
                        <div className="stats-grid">
                            <div className="stat-card purple"><h3>Total Residents</h3><div className="value">{stats.flats.occupied}</div></div>
                            <div className="stat-card blue"><h3>Vacant Flats</h3><div className="value">{stats.flats.vacant}</div></div>
                            <div className="stat-card orange"><h3>Notices</h3><div className="value">{stats.notices}</div></div>
                            <div className="stat-card green"><h3>Complaints</h3><div className="value">{stats.complaints.total}</div></div>
                        </div>
                        <div style={{display:'flex', gap:'20px', flexWrap:'wrap', marginBottom:'30px'}}>
                            <div className="stat-card" style={{flex:1, minWidth:'300px', height:'350px'}}><h3>🏠 Occupancy Status</h3><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{occupancyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div>
                            <div className="stat-card" style={{flex:1, minWidth:'300px', height:'350px'}}><h3>⚠️ Complaint Status</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={complaintData} margin={{top: 20, right: 30, left: 20, bottom: 5}}><XAxis dataKey="name" stroke="#8884d8" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#e17055" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
                        </div>
                    </div>
                )}
                
                {/* ... (Other tabs remain the same, I condensed them to save space but they are here) ... */}
                {activeTab === 'add-family' && <div className="form-container"><h3 className="section-title">Add New Family</h3><form onSubmit={handleAddFamily}><div style={{display:'flex',gap:'10px'}}><div className="form-group" style={{flex:1}}><label>First Name</label><input type="text" name="first_name" className="form-control" required/></div><div className="form-group" style={{flex:1}}><label>Last Name</label><input type="text" name="last_name" className="form-control" required/></div></div><div className="form-group"><label>NID Number</label><input type="text" name="nid" className="form-control" required/></div><div className="form-group"><label>Flat Number</label><select name="flat" className="form-control" required><option value="">Select Flat</option>{vacantFlatsList.map(f=><option key={f} value={f}>{f}</option>)}</select></div><div className="form-group"><label>Members</label><input type="number" name="members" className="form-control" required min="1" /></div><div className="form-group"><label>Phone</label><input type="tel" name="phone" className="form-control" required/></div><button type="submit" className="btn-primary">Add Resident</button></form></div>}
                {activeTab === 'residents' && <div className="table-container"><h3 className="section-title">Resident List</h3><table className="styled-table"><thead><tr><th>Flat</th><th>Name</th><th>NID</th><th>Members</th><th>Phone</th><th>Action</th></tr></thead><tbody>{residents.map(r=><tr key={r.id}><td><b>{r.flat}</b></td><td>{r.name}</td><td>{r.nid}</td><td>{r.members}</td><td>{r.phone}</td><td><button className="btn-danger" onClick={()=>handleRemoveFamily(r.id)}>Remove</button></td></tr>)}</tbody></table></div>}
                {activeTab === 'notices' && <div>{privateNotices.length > 0 && <div style={{marginBottom:'30px'}}><h3 className="section-title" style={{color:'#e17055'}}>🔔 Personal Alerts</h3><div className="stats-grid">{privateNotices.map(n=><div key={n.id} className="stat-card" style={{borderLeft:'5px solid #e17055'}}><h3 style={{color:'#e17055'}}>🔒 {n.title}</h3><small>{n.date}</small><p>{n.content}</p></div>)}</div></div>}{user.role === 'admin' && <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}><div className="form-container" style={{flex:1}}><h3 className="section-title">Post Public Notice</h3><form onSubmit={handlePostNotice}><input type="text" name="title" className="form-control" required placeholder="Title" style={{marginBottom:'10px'}}/><textarea name="content" className="form-control" rows="3" required placeholder="Content"></textarea><button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Post Public</button></form></div><div className="form-container" style={{flex:1, border:'1px solid #e17055'}}><h3 className="section-title" style={{color:'#e17055'}}>Send Private Notice</h3><form onSubmit={handleSendPrivateNotice}><div className="form-group"><label>Select Resident</label><select name="user_id" className="form-control" required><option value="">-- Select Flat --</option>{residents.map(r=><option key={r.id} value={r.id}>{r.name} (Flat {r.flat})</option>)}</select></div><input type="text" name="title" className="form-control" required placeholder="Warning Title" style={{marginBottom:'10px'}}/><textarea name="content" className="form-control" rows="1" required placeholder="Message..."></textarea><button type="submit" className="btn-primary" style={{marginTop:'10px', background:'#e17055'}}>Send Private</button></form></div></div>}<h3 className="section-title" style={{marginTop:'30px'}}>📢 Building Notices</h3><div className="stats-grid">{notices.map(n=><div key={n.id} className="stat-card blue"><h3>{n.title}</h3><small>{n.date_posted}</small><p>{n.content}</p>{user.role==='admin'&&<button className="btn-danger" style={{marginTop:'10px'}} onClick={()=>handleDeleteNotice(n.id)}>Delete</button>}</div>)}</div></div>}
                {activeTab === 'complaints' && <div><div className="form-container"><h3 className="section-title">Submit Complaint</h3><form onSubmit={handlePostComplaint}><div className="form-group"><label>Subject</label><input type="text" name="subject" className="form-control" required/></div><div className="form-group"><label>Description</label><textarea name="description" className="form-control" rows="2" required></textarea></div><button type="submit" className="btn-primary" style={{backgroundColor:'#e17055'}}>Submit</button></form></div><div className="stats-grid">{complaints.length>0?complaints.map(c=>(<div key={c.id} className="stat-card orange" style={{borderLeft: c.status === 'Resolved' ? '5px solid #00b894' : '5px solid #e17055'}}><div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h3>{c.subject}</h3><span style={{padding:'5px 10px',borderRadius:'15px',fontSize:'0.8rem',background:c.status==='Resolved'?'#00b894':'#ffeaa7',color:c.status==='Resolved'?'white':'#d35400',fontWeight:'bold'}}>{c.status}</span></div><small>By: {c.submitted_by} | {c.date}</small><p style={{marginTop:'10px',marginBottom:'15px'}}>{c.description}</p>{user.role === 'admin' && c.status !== 'Resolved' && (<button onClick={() => handleUpdateComplaint(c.id, 'Resolved')} style={{background:'white',border:'1px solid #00b894',color:'#00b894',padding:'5px 10px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold'}}>✅ Mark Resolved</button>)}</div>)):<p>No complaints yet.</p>}</div></div>}
                {activeTab === 'vacant' && <div className="content-section"><h3 className="section-title">Vacant Flats</h3><div style={{display:'flex',gap:'15px',flexWrap:'wrap'}}>{vacantFlatsList.map(f=><div key={f} style={{padding:'20px',background:'var(--hover-color)',borderRadius:'10px',fontWeight:'bold', color:'var(--text-main)'}}>Flat {f}</div>)}</div></div>}
                {activeTab === 'chat' && <div className="chat-window"><div className="chat-messages">{messages.map((m,i)=><div key={i} className={`message ${m.sender===user?.name?'sent':'received'}`}><strong>{m.sender}</strong><br/>{m.text}</div>)}</div><form className="chat-input-area" onSubmit={handleSendMessage}><input type="text" value={messageInput} onChange={e=>setMessageInput(e.target.value)} className="form-control" placeholder="Type a message..."/><button type="submit" className="btn-primary">Send</button></form></div>}
                {activeTab === 'settings' && <div className="form-container"><h3 className="section-title">Change Password</h3><form onSubmit={handleChangePassword}><div className="form-group"><label>Old Password</label><input type="password" name="old_password" className="form-control" required /></div><div className="form-group"><label>New Password</label><input type="password" name="new_password" className="form-control" required minLength="6"/></div><div className="form-group"><label>Confirm New Password</label><input type="password" name="confirm_password" className="form-control" required minLength="6"/></div><button type="submit" className="btn-primary">Update Password</button></form></div>}
                <div className="building-footer"><p><strong>Building Address:</strong> Road-01, Block-I, Lane-05, Halishahar Housing Estate, Chattogram 4216</p><p><strong>Constructed:</strong> 2024 | <strong>Building No:</strong> 30/32</p></div>
            </main>
        </div>
    );
};
export default BMS_Frontend;