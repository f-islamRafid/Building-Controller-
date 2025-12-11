import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import io from 'socket.io-client';
import './App.css';

// Connect to the Backend WebSocket
const socket = io('http://127.0.0.1:5000');

const BMS_Frontend = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // State for Real Data
    const [residents, setResidents] = useState([]);
    const [notices, setNotices] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [vacantFlatsList, setVacantFlatsList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");

    // --- FETCH DATA FROM API ---
    const fetchResidents = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
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

    const fetchComplaints = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/complaints', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if(res.ok) setComplaints(await res.json());
    };

    // Initial Load & Chat Setup
    useEffect(() => {
        fetchNotices();
        fetchVacant();
        if (user) fetchComplaints();
        if (user?.role === 'admin') fetchResidents();

        // Socket Listeners
        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => socket.off('receive_message');
    }, [user]);


    // --- HANDLERS ---

    const handleAddFamily = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Prepare Payload with Split Names and NID
        const payload = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            nid: formData.get('nid'),
            flat: formData.get('flat'),
            members: formData.get('members'),
            phone: formData.get('phone')
        };

        const res = await fetch('http://127.0.0.1:5000/api/admin/add_family', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const flat = payload.flat.toLowerCase();
            alert(`Family Added!\nLogin Email: ${flat}@bms.com\nPass: 123456`);
            fetchResidents();
            fetchVacant();
            e.target.reset();
        } else {
            const err = await res.json();
            alert("Error: " + err.message);
        }
    };

    const handleRemoveFamily = async (id) => {
        if(window.confirm("Are you sure you want to remove this family?")) {
            const res = await fetch(`http://127.0.0.1:5000/api/admin/user/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) fetchResidents();
        }
    };

    const handlePostNotice = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            title: formData.get('title'),
            content: formData.get('content')
        };

        const res = await fetch('http://127.0.0.1:5000/api/admin/notices', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Notice Posted!");
            fetchNotices();
            e.target.reset();
        }
    };

    const handleDeleteNotice = async (id) => {
        if (window.confirm("Delete this notice?")) {
            const res = await fetch(`http://127.0.0.1:5000/api/notices/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if(res.ok) fetchNotices();
        }
    };

    const handlePostComplaint = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            subject: formData.get('subject'),
            description: formData.get('description')
        };

        const res = await fetch('http://127.0.0.1:5000/api/complaints', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Complaint Submitted Successfully!");
            fetchComplaints();
            e.target.reset();
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const messageData = {
            id: Date.now(),
            sender: user.name || "User",
            text: messageInput,
            type: "sent"
        };
        socket.emit('send_message', messageData);
        setMessageInput("");
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="logo-section"><h2>BMS Portal</h2></div>
                <ul className="nav-links">
                    <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <span>📊</span> Dashboard
                    </li>
                    
                    {/* Admin Only Tabs */}
                    {user?.role === 'admin' && (
                        <>
                            <li className={`nav-item ${activeTab === 'add-family' ? 'active' : ''}`} onClick={() => setActiveTab('add-family')}>
                                <span>➕</span> Add Family
                            </li>
                            <li className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
                                <span>👥</span> Residents
                            </li>
                        </>
                    )}
                    
                    {/* Shared Tabs */}
                    <li className={`nav-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
                        <span>📢</span> Notices
                    </li>
                    <li className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
                        <span>⚠️</span> Complaints
                    </li>
                     <li className={`nav-item ${activeTab === 'vacant' ? 'active' : ''}`} onClick={() => setActiveTab('vacant')}>
                        <span>🏠</span> Vacant Flats
                    </li>
                    <li className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                        <span>💬</span> Chat Box
                    </li>
                </ul>
                <div className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            <main className="main-content">
                <header className="header-welcome">
                    <div>
                        <h1>Hello, {user?.name}</h1>
                        <p style={{color: '#aaa'}}>Welcome to the Building Management System.</p>
                    </div>
                    <div className="date-badge">{new Date().toDateString()}</div>
                </header>

                {/* --- DASHBOARD --- */}
                {activeTab === 'dashboard' && (
                    <div className="stats-grid">
                        <div className="stat-card purple">
                            <h3>Total Residents</h3>
                            <div className="value">{residents.length > 0 ? residents.length : "Loading..."}</div>
                        </div>
                        <div className="stat-card blue">
                            <h3>Vacant Flats</h3>
                            <div className="value">{vacantFlatsList.length}</div>
                        </div>
                        <div className="stat-card orange">
                            <h3>Notices</h3>
                            <div className="value">{notices.length}</div>
                        </div>
                         <div className="stat-card green">
                            <h3>Open Complaints</h3>
                            <div className="value">{complaints.length}</div>
                        </div>
                    </div>
                )}

                {/* --- ADD FAMILY (Admin Only) --- */}
                {activeTab === 'add-family' && (
                    <div className="form-container">
                        <h3 className="section-title">Add New Family</h3>
                        <form onSubmit={handleAddFamily}>
                            <div style={{display:'flex', gap:'10px'}}>
                                <div className="form-group" style={{flex:1}}>
                                    <label>First Name</label>
                                    <input type="text" name="first_name" className="form-control" required placeholder="John" />
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Last Name</label>
                                    <input type="text" name="last_name" className="form-control" required placeholder="Doe" />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>NID Number</label>
                                <input type="text" name="nid" className="form-control" required placeholder="Ex: 123456789" />
                            </div>

                            <div className="form-group">
                                <label>Flat Number</label>
                                <select name="flat" className="form-control" required>
                                    <option value="">Select Flat</option>
                                    {vacantFlatsList.map(flat => (
                                        <option key={flat} value={flat}>{flat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Total Family Members</label>
                                <input type="number" name="members" className="form-control" required min="1" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" className="form-control" required />
                            </div>
                            <button type="submit" className="btn-primary">Add Resident</button>
                        </form>
                    </div>
                )}

                {/* --- RESIDENTS LIST --- */}
                {activeTab === 'residents' && (
                    <div className="table-container">
                        <h3 className="section-title">Resident List</h3>
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Flat</th><th>Name</th><th>NID</th><th>Members</th><th>Phone</th><th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {residents.map(r => (
                                    <tr key={r.id}>
                                        <td><b>{r.flat}</b></td>
                                        <td>{r.name}</td>
                                        <td>{r.nid}</td>
                                        <td>{r.members}</td>
                                        <td>{r.phone}</td>
                                        <td><button className="btn-danger" onClick={() => handleRemoveFamily(r.id)}>Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- NOTICES (Read Only for Users, Edit for Admin) --- */}
                {activeTab === 'notices' && (
                    <div>
                        {user.role === 'admin' && (
                            <div className="form-container" style={{marginBottom: '30px'}}>
                                <h3 className="section-title">Post Notice</h3>
                                <form onSubmit={handlePostNotice}>
                                    <input type="text" name="title" className="form-control" required placeholder="Title" style={{marginBottom: '10px'}}/>
                                    <textarea name="content" className="form-control" rows="3" required placeholder="Content"></textarea>
                                    <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>Post</button>
                                </form>
                            </div>
                        )}
                        <div className="stats-grid">
                            {notices.map(n => (
                                <div key={n.id} className="stat-card blue">
                                    <h3>{n.title}</h3>
                                    <small>{n.date_posted}</small>
                                    <p>{n.content}</p>
                                    {user.role === 'admin' && (
                                        <button className="btn-danger" style={{marginTop:'10px'}} onClick={() => handleDeleteNotice(n.id)}>Delete</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- COMPLAINTS (NEW) --- */}
                {activeTab === 'complaints' && (
                    <div>
                        <div className="form-container" style={{marginBottom: '30px'}}>
                            <h3 className="section-title">Submit a Complaint</h3>
                            <form onSubmit={handlePostComplaint}>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input type="text" name="subject" className="form-control" required placeholder="e.g., Water Leaking" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" className="form-control" rows="2" required placeholder="Describe the issue..."></textarea>
                                </div>
                                <button type="submit" className="btn-primary" style={{backgroundColor: '#e17055'}}>Submit Complaint</button>
                            </form>
                        </div>

                        <h3 className="section-title">Recent Complaints</h3>
                        <div className="stats-grid">
                            {complaints.length > 0 ? complaints.map(c => (
                                <div key={c.id} className="stat-card orange">
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <h3>{c.subject}</h3>
                                        <small>{c.status}</small>
                                    </div>
                                    <small style={{color: '#666'}}>By: {c.submitted_by} on {c.date}</small>
                                    <p style={{marginTop:'10px'}}>{c.description}</p>
                                </div>
                            )) : <p>No complaints submitted yet.</p>}
                        </div>
                    </div>
                )}

                {/* --- VACANT FLATS --- */}
                {activeTab === 'vacant' && (
                    <div className="content-section">
                        <h3 className="section-title">Vacant Flats</h3>
                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                            {vacantFlatsList.map(flat => (
                                <div key={flat} style={{padding: '20px', background: '#dfe6e9', borderRadius: '10px', fontWeight: 'bold'}}>
                                    Flat {flat}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CHAT --- */}
                {activeTab === 'chat' && (
                    <div className="chat-window">
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.sender === user?.name ? 'sent' : 'received'}`}>
                                    <strong>{msg.sender}</strong><br/>{msg.text}
                                </div>
                            ))}
                        </div>
                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input type="text" value={messageInput} onChange={e=>setMessageInput(e.target.value)} className="form-control" placeholder="Type a message..." />
                            <button type="submit" className="btn-primary">Send</button>
                        </form>
                    </div>
                )}

            </main>
        </div>
    );
};

export default BMS_Frontend;