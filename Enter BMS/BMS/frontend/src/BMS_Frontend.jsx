import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

const BMS_Frontend = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // --- MOCK DATA STATE (TEMPORARY DATABASE) ---
    
    // 1. Residents Data
    const [residents, setResidents] = useState([
        { id: 1, name: "Mr. Sharma", flat: "101", members: 4, phone: "9876543210" },
        { id: 2, name: "Mrs. Gupta", flat: "102", members: 2, phone: "8765432109" },
    ]);

    // 2. Notices Data
    const [notices, setNotices] = useState([
        { id: 1, title: "Lift Maintenance", date: "2024-10-24", content: "Lift will be off from 2pm to 4pm." },
        { id: 2, title: "Diwali Party", date: "2024-11-01", content: "Gather at the clubhouse at 7pm!" },
    ]);

    // 3. Chat Messages
    const [messages, setMessages] = useState([
        { id: 1, sender: "System", text: "Welcome to the Community Chat!", type: "received" },
        { id: 2, sender: "Mr. Sharma", text: "Is the water supply issue fixed?", type: "received" },
    ]);

    // 4. Vacant Flats (Hardcoded list for now)
    const allFlats = ["101", "102", "103", "104", "201", "202", "203", "204"];
    
    // --- FORM HANDLERS ---

    // Add Family
    const handleAddFamily = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newResident = {
            id: Date.now(),
            name: formData.get('name'),
            flat: formData.get('flat'),
            members: formData.get('members'),
            phone: formData.get('phone')
        };
        setResidents([...residents, newResident]);
        alert("Family Added Successfully!");
        e.target.reset(); // Clear form
    };

    // Remove Family
    const handleRemoveFamily = (id) => {
        if(window.confirm("Are you sure you want to remove this family?")) {
            setResidents(residents.filter(r => r.id !== id));
        }
    };

    // Post Notice
    const handlePostNotice = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newNotice = {
            id: Date.now(),
            title: formData.get('title'),
            content: formData.get('content'),
            date: new Date().toISOString().split('T')[0]
        };
        setNotices([newNotice, ...notices]);
        alert("Notice Posted!");
        e.target.reset();
    };

    // DELETE NOTICE (New Feature)
    const handleDeleteNotice = (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            const updatedNotices = notices.filter((notice) => notice.id !== id);
            setNotices(updatedNotices);
        }
    };

    // Send Chat
    const handleSendMessage = (e) => {
        e.preventDefault();
        const input = e.target.elements.messageInput;
        if (!input.value.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: "You",
            text: input.value,
            type: "sent"
        };
        setMessages([...messages, newMessage]);
        input.value = ""; // Clear input
    };

    // Calculate Vacant Flats
    const occupiedFlats = residents.map(r => r.flat);
    const vacantFlatsList = allFlats.filter(flat => !occupiedFlats.includes(flat));

    return (
        <div className="dashboard-layout">
            
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo-section"><h2>BMS Portal</h2></div>
                <ul className="nav-links">
                    <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <span>📊</span> Dashboard
                    </li>
                    <li className={`nav-item ${activeTab === 'add-family' ? 'active' : ''}`} onClick={() => setActiveTab('add-family')}>
                        <span>➕</span> Add Family
                    </li>
                    <li className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
                        <span>👥</span> View Residents
                    </li>
                    <li className={`nav-item ${activeTab === 'vacant' ? 'active' : ''}`} onClick={() => setActiveTab('vacant')}>
                        <span>🏠</span> Vacant Flats
                    </li>
                    <li className={`nav-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
                        <span>📢</span> Manage Notices
                    </li>
                    <li className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                        <span>💬</span> Chat Box
                    </li>
                </ul>
                <div className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                    <span>🚪</span> Logout
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="header-welcome">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p style={{color: '#aaa'}}>Manage your building efficiently.</p>
                    </div>
                    <div className="date-badge">{new Date().toDateString()}</div>
                </header>

                {/* 1. DASHBOARD HOME */}
                {activeTab === 'dashboard' && (
                    <div className="stats-grid">
                        <div className="stat-card purple">
                            <h3>Total Residents</h3>
                            <div className="value">{residents.length}</div>
                        </div>
                        <div className="stat-card blue">
                            <h3>Vacant Flats</h3>
                            <div className="value">{vacantFlatsList.length}</div>
                        </div>
                        <div className="stat-card orange">
                            <h3>Notices Posted</h3>
                            <div className="value">{notices.length}</div>
                        </div>
                        <div className="stat-card green">
                            <h3>System Status</h3>
                            <div className="value" style={{color: '#00b894'}}>Online</div>
                        </div>
                    </div>
                )}

                {/* 2. ADD FAMILY FORM */}
                {activeTab === 'add-family' && (
                    <div className="form-container">
                        <h3 className="section-title">Add New Family</h3>
                        <form onSubmit={handleAddFamily}>
                            <div className="form-group">
                                <label>Head of Family Name</label>
                                <input type="text" name="name" className="form-control" required placeholder="Ex: Mr. John Doe" />
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
                                <label>Number of Members</label>
                                <input type="number" name="members" className="form-control" required min="1" />
                            </div>
                            <div className="form-group">
                                <label>Contact Phone</label>
                                <input type="tel" name="phone" className="form-control" required placeholder="Ex: 9876543210" />
                            </div>
                            <button type="submit" className="btn-primary">Add Resident</button>
                        </form>
                    </div>
                )}

                {/* 3. VIEW / REMOVE RESIDENTS */}
                {activeTab === 'residents' && (
                    <div className="table-container">
                        <h3 className="section-title">Resident List</h3>
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Flat No</th>
                                    <th>Name</th>
                                    <th>Members</th>
                                    <th>Phone</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {residents.map(resident => (
                                    <tr key={resident.id}>
                                        <td><b>{resident.flat}</b></td>
                                        <td>{resident.name}</td>
                                        <td>{resident.members}</td>
                                        <td>{resident.phone}</td>
                                        <td>
                                            <button className="btn-danger" onClick={() => handleRemoveFamily(resident.id)}>Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. VACANT FLATS VIEW */}
                {activeTab === 'vacant' && (
                    <div className="content-section">
                        <h3 className="section-title">Vacant Flats Availability</h3>
                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                            {vacantFlatsList.length > 0 ? vacantFlatsList.map(flat => (
                                <div key={flat} style={{
                                    padding: '20px', 
                                    background: '#dfe6e9', 
                                    borderRadius: '10px', 
                                    width: '100px', 
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: '#636e72'
                                }}>
                                    Flat {flat}
                                </div>
                            )) : <p>No flats available!</p>}
                        </div>
                    </div>
                )}

                {/* 5. POST NOTICE WITH DELETE OPTION */}
                {activeTab === 'notices' && (
                    <div>
                        <div className="form-container" style={{marginBottom: '30px'}}>
                            <h3 className="section-title">Create New Notice</h3>
                            <form onSubmit={handlePostNotice}>
                                <div className="form-group">
                                    <label>Notice Title</label>
                                    <input type="text" name="title" className="form-control" required placeholder="Ex: Water Maintenance" />
                                </div>
                                <div className="form-group">
                                    <label>Details</label>
                                    <textarea name="content" className="form-control" rows="3" required placeholder="Enter details here..."></textarea>
                                </div>
                                <button type="submit" className="btn-primary">Post Notice</button>
                            </form>
                        </div>

                        {/* Display Notices List */}
                        <h3 className="section-title">Current Notices</h3>
                        <div className="stats-grid">
                            {notices.map(notice => (
                                <div key={notice.id} className="stat-card blue" style={{position: 'relative'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                                        <h3>{notice.title}</h3>
                                        <small>{notice.date}</small>
                                    </div>
                                    <p style={{marginTop: '10px', color: '#555', marginBottom: '15px'}}>{notice.content}</p>
                                    
                                    {/* DELETE BUTTON */}
                                    <button 
                                        onClick={() => handleDeleteNotice(notice.id)}
                                        style={{
                                            backgroundColor: '#ff7675',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. CHAT BOX */}
                {activeTab === 'chat' && (
                    <div className="chat-window">
                        <div className="chat-messages">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message ${msg.type}`}>
                                    <strong>{msg.sender}</strong><br/>
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input type="text" name="messageInput" className="form-control" placeholder="Type a message..." autoComplete="off" />
                            <button type="submit" className="btn-primary">Send</button>
                        </form>
                    </div>
                )}

            </main>
        </div>
    );
};

export default BMS_Frontend;