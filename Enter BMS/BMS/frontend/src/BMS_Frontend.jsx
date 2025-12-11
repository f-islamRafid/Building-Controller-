import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://127.0.0.1:5000');

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
    const [residents, setResidents] = useState([]);
    const [notices, setNotices] = useState([]);
    const [privateNotices, setPrivateNotices] = useState([]); // NEW
    const [complaints, setComplaints] = useState([]);
    const [vacantFlatsList, setVacantFlatsList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");

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

    // --- FETCHING ---
    const fetchResidents = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/admin/users', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setResidents(await res.json());
    };
    const fetchVacant = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/apartments/vacant');
        if(res.ok) setVacantFlatsList(await res.json());
    };
    const fetchNotices = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/notices');
        if(res.ok) setNotices(await res.json());
    };
    const fetchPrivateNotices = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/my_private_notices', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setPrivateNotices(await res.json());
    };
    const fetchComplaints = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/complaints', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setComplaints(await res.json());
    };
    const fetchMessages = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/messages', { headers: { 'Authorization': `Bearer ${user.token}` } });
        if(res.ok) setMessages(await res.json());
    };

    useEffect(() => {
        if (!user) return;
        fetchNotices();
        fetchVacant();
        fetchComplaints();
        fetchMessages();
        fetchPrivateNotices(); // NEW
        if (user.role === 'admin') fetchResidents();

        socket.on('receive_message', (data) => setMessages((prev) => [...prev, data]));
        return () => socket.off('receive_message');
    }, [user]);

    // --- HANDLERS ---
    const handleAddFamily = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            nid: formData.get('nid'),
            flat: formData.get('flat'),
            members: parseInt(formData.get('members')),
            phone: formData.get('phone')
        };
        const res = await fetch('http://127.0.0.1:5000/api/admin/add_family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify(payload)
        });
        if (await handleResponse(res)) {
            const flat = payload.flat.toLowerCase();
            alert(`✅ Family Added!\nLogin: ${flat}@bms.com\nPass: 123456`);
            fetchResidents();
            fetchVacant();
            e.target.reset();
        }
    };

    const handleRemoveFamily = async (id) => {
        if(window.confirm("Remove family?")) {
            const res = await fetch(`http://127.0.0.1:5000/api/admin/user/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
            if (await handleResponse(res)) fetchResidents();
        }
    };
    const handlePostNotice = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('http://127.0.0.1:5000/api/admin/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ title: formData.get('title'), content: formData.get('content') })
        });
        if (await handleResponse(res)) { alert("✅ Public Notice Posted!"); fetchNotices(); e.target.reset(); }
    };
    
    // NEW: SEND PRIVATE NOTICE
    const handleSendPrivateNotice = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('http://127.0.0.1:5000/api/admin/private_notice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ user_id: formData.get('user_id'), title: formData.get('title'), content: formData.get('content') })
        });
        if (await handleResponse(res)) { alert("✅ Private Notice Sent!"); e.target.reset(); }
    };

    const handleDeleteNotice = async (id) => {
        if (window.confirm("Delete notice?")) {
            const res = await fetch(`http://127.0.0.1:5000/api/notices/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
            if (await handleResponse(res)) fetchNotices();
        }
    };
    const handlePostComplaint = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const res = await fetch('http://127.0.0.1:5000/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ subject: formData.get('subject'), description: formData.get('description') })
        });
        if (await handleResponse(res)) { alert("✅ Complaint Sent!"); fetchComplaints(); e.target.reset(); }
    };
    const handleUpdateComplaint = async (id, newStatus) => {
        const res = await fetch(`http://127.0.0.1:5000/api/complaints/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (await handleResponse(res)) fetchComplaints();
    };
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('new_password');
        const confirm = formData.get('confirm_password');
        if (password !== confirm) { alert("❌ Passwords do not match!"); return; }
        const res = await fetch('http://127.0.0.1:5000/api/change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
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
                <div className="logo-section"><h2>BMS Portal</h2></div>
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
                <header className="header-welcome"><div><h1>Hello, {user?.name}</h1><p style={{color:'var(--text-secondary)'}}>Welcome to the Building Management System.</p></div><div className="date-badge">{new Date().toDateString()}</div></header>
                
                {activeTab === 'dashboard' && <div className="stats-grid"><div className="stat-card purple"><h3>Total Residents</h3><div className="value">{residents.length}</div></div><div className="stat-card blue"><h3>Vacant Flats</h3><div className="value">{vacantFlatsList.length}</div></div><div className="stat-card orange"><h3>Notices</h3><div className="value">{notices.length}</div></div><div className="stat-card green"><h3>Complaints</h3><div className="value">{complaints.length}</div></div></div>}
                
                {activeTab === 'add-family' && <div className="form-container"><h3 className="section-title">Add New Family</h3><form onSubmit={handleAddFamily}><div style={{display:'flex',gap:'10px'}}><div className="form-group" style={{flex:1}}><label>First Name</label><input type="text" name="first_name" className="form-control" required/></div><div className="form-group" style={{flex:1}}><label>Last Name</label><input type="text" name="last_name" className="form-control" required/></div></div><div className="form-group"><label>NID Number</label><input type="text" name="nid" className="form-control" required/></div><div className="form-group"><label>Flat Number</label><select name="flat" className="form-control" required><option value="">Select Flat</option>{vacantFlatsList.map(f=><option key={f} value={f}>{f}</option>)}</select></div><div className="form-group"><label>Members</label><input type="number" name="members" className="form-control" required min="1" /></div><div className="form-group"><label>Phone</label><input type="tel" name="phone" className="form-control" required/></div><button type="submit" className="btn-primary">Add Resident</button></form></div>}
                
                {activeTab === 'residents' && <div className="table-container"><h3 className="section-title">Resident List</h3><table className="styled-table"><thead><tr><th>Flat</th><th>Name</th><th>NID</th><th>Members</th><th>Phone</th><th>Action</th></tr></thead><tbody>{residents.map(r=><tr key={r.id}><td><b>{r.flat}</b></td><td>{r.name}</td><td>{r.nid}</td><td>{r.members}</td><td>{r.phone}</td><td><button className="btn-danger" onClick={()=>handleRemoveFamily(r.id)}>Remove</button></td></tr>)}</tbody></table></div>}
                
                {activeTab === 'notices' && <div>
                    {privateNotices.length > 0 && <div style={{marginBottom:'30px'}}><h3 className="section-title" style={{color:'#e17055'}}>🔔 Personal Alerts</h3><div className="stats-grid">{privateNotices.map(n=><div key={n.id} className="stat-card" style={{borderLeft:'5px solid #e17055'}}><h3 style={{color:'#e17055'}}>🔒 {n.title}</h3><small>{n.date}</small><p>{n.content}</p></div>)}</div></div>}
                    
                    {user.role === 'admin' && <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}><div className="form-container" style={{flex:1}}><h3 className="section-title">Post Public Notice</h3><form onSubmit={handlePostNotice}><input type="text" name="title" className="form-control" required placeholder="Title" style={{marginBottom:'10px'}}/><textarea name="content" className="form-control" rows="3" required placeholder="Content"></textarea><button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Post Public</button></form></div>
                    <div className="form-container" style={{flex:1, border:'1px solid #e17055'}}><h3 className="section-title" style={{color:'#e17055'}}>Send Private Notice</h3><form onSubmit={handleSendPrivateNotice}><div className="form-group"><label>Select Resident</label><select name="user_id" className="form-control" required><option value="">-- Select Flat --</option>{residents.map(r=><option key={r.id} value={r.id}>{r.name} (Flat {r.flat})</option>)}</select></div><input type="text" name="title" className="form-control" required placeholder="Warning Title" style={{marginBottom:'10px'}}/><textarea name="content" className="form-control" rows="1" required placeholder="Message..."></textarea><button type="submit" className="btn-primary" style={{marginTop:'10px', background:'#e17055'}}>Send Private</button></form></div></div>}
                    
                    <h3 className="section-title" style={{marginTop:'30px'}}>📢 Building Notices</h3><div className="stats-grid">{notices.map(n=><div key={n.id} className="stat-card blue"><h3>{n.title}</h3><small>{n.date_posted}</small><p>{n.content}</p>{user.role==='admin'&&<button className="btn-danger" style={{marginTop:'10px'}} onClick={()=>handleDeleteNotice(n.id)}>Delete</button>}</div>)}</div>
                </div>}
                
                {activeTab === 'complaints' && <div><div className="form-container"><h3 className="section-title">Submit Complaint</h3><form onSubmit={handlePostComplaint}><div className="form-group"><label>Subject</label><input type="text" name="subject" className="form-control" required/></div><div className="form-group"><label>Description</label><textarea name="description" className="form-control" rows="2" required></textarea></div><button type="submit" className="btn-primary" style={{backgroundColor:'#e17055'}}>Submit</button></form></div><div className="stats-grid">{complaints.length>0?complaints.map(c=>(<div key={c.id} className="stat-card orange" style={{borderLeft: c.status === 'Resolved' ? '5px solid #00b894' : '5px solid #e17055'}}><div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h3>{c.subject}</h3><span style={{padding:'5px 10px',borderRadius:'15px',fontSize:'0.8rem',background:c.status==='Resolved'?'#00b894':'#ffeaa7',color:c.status==='Resolved'?'white':'#d35400',fontWeight:'bold'}}>{c.status}</span></div><small>By: {c.submitted_by} | {c.date}</small><p style={{marginTop:'10px',marginBottom:'15px'}}>{c.description}</p>{user.role === 'admin' && c.status !== 'Resolved' && (<button onClick={() => handleUpdateComplaint(c.id, 'Resolved')} style={{background:'white',border:'1px solid #00b894',color:'#00b894',padding:'5px 10px',borderRadius:'5px',cursor:'pointer',fontWeight:'bold'}}>✅ Mark Resolved</button>)}</div>)):<p>No complaints yet.</p>}</div></div>}
                {activeTab === 'vacant' && <div className="content-section"><h3 className="section-title">Vacant Flats</h3><div style={{display:'flex',gap:'15px',flexWrap:'wrap'}}>{vacantFlatsList.map(f=><div key={f} style={{padding:'20px',background:'var(--hover-color)',borderRadius:'10px',fontWeight:'bold', color:'var(--text-main)'}}>Flat {f}</div>)}</div></div>}
                {activeTab === 'chat' && <div className="chat-window"><div className="chat-messages">{messages.map((m,i)=><div key={i} className={`message ${m.sender===user?.name?'sent':'received'}`}><strong>{m.sender}</strong><br/>{m.text}</div>)}</div><form className="chat-input-area" onSubmit={handleSendMessage}><input type="text" value={messageInput} onChange={e=>setMessageInput(e.target.value)} className="form-control" placeholder="Type a message..."/><button type="submit" className="btn-primary">Send</button></form></div>}
                {activeTab === 'settings' && <div className="form-container"><h3 className="section-title">Change Password</h3><form onSubmit={handleChangePassword}><div className="form-group"><label>Old Password</label><input type="password" name="old_password" className="form-control" required /></div><div className="form-group"><label>New Password</label><input type="password" name="new_password" className="form-control" required minLength="6"/></div><div className="form-group"><label>Confirm New Password</label><input type="password" name="confirm_password" className="form-control" required minLength="6"/></div><button type="submit" className="btn-primary">Update Password</button></form></div>}
            </main>
        </div>
    );
};
export default BMS_Frontend;