import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Bell, Plus, Home, LogOut, User, Users, Trash2 } from 'lucide-react';

// --- STYLES ---
const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
    sidebar: { width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 1000 },
    main: { flex: 1, padding: '40px', marginLeft: '250px', overflowY: 'auto' },
    navBtn: { display: 'flex', alignItems: 'center', width: '100%', padding: '12px', margin: '5px 0', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '15px' },
    navBtnActive: { backgroundColor: '#334155', color: 'white', fontWeight: 'bold' },
    logoutBtn: { marginTop: 'auto', display: 'flex', alignItems: 'center', width: '100%', padding: '12px', border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '6px' },
    select: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' },
    button: { padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
    success: { color: 'green', fontSize: '14px', marginTop: '10px' },
    error: { color: 'red', fontSize: '14px', marginTop: '10px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#475569' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b' },
    td: { padding: '12px', borderBottom: '1px solid #f1f5f9' },
    deleteBtn: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }
};

const API_BASE_URL = 'http://127.0.0.1:5000';

const BMS_Frontend = () => {
    // 1. Initial State
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const token = localStorage.getItem('token');
    const [currentView, setCurrentView] = useState('dashboard');
    const [userInfo, setUserInfo] = useState(null);
    
    // 2. Fetch Fresh Data & Sync Role
    useEffect(() => {
        if(token) {
            fetch(`${API_BASE_URL}/api/user_info`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { 
                if(data.status === 'success') {
                    setUserInfo(data);
                    // CRITICAL FIX: Update local storage so role persists on refresh
                    localStorage.setItem('user', JSON.stringify(data));
                }
            });
        }
    }, [token]);

    if (!token) return <div style={{padding: 20}}>Loading session...</div>;

    // 3. ROBUST ADMIN CHECK (Checks both fresh data AND local cache)
    // If userInfo is loaded, use that. Otherwise use local storage.
    const activeUser = userInfo || user;
    const isAdmin = activeUser.role === 'admin';

    // --- SUB-COMPONENTS ---
    const NavItem = ({ icon: Icon, title, viewName }) => (
        <button style={{ ...styles.navBtn, ...(currentView === viewName ? styles.navBtnActive : {}) }} onClick={() => setCurrentView(viewName)}>
            <Icon size={20} style={{ marginRight: '10px' }} /> {title}
        </button>
    );

    const AddFamilyForm = () => {
        const [formData, setFormData] = useState({ flat_no: '', head_member: '', phone: '', members: '', email: '', password: '', nid: '' });
        const [vacantFlats, setVacantFlats] = useState([]);
        const [msg, setMsg] = useState('');

        useEffect(() => {
            fetch(`${API_BASE_URL}/api/apartments/vacant`).then(res => res.json()).then(data => setVacantFlats(data.vacant_apartments || []));
        }, []);

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/add_family`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (res.ok) { setMsg('Success: Family Added!'); setFormData({ flat_no: '', head_member: '', phone: '', members: '', email: '', password: '', nid: '' }); } 
                else setMsg(data.message || 'Error');
            } catch (err) { setMsg('API Error'); }
        };

        return (
            <div style={styles.card}>
                <h3 style={styles.header}>Add New Family</h3>
                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>Select Vacant Flat</label>
                    <select style={styles.select} value={formData.flat_no} onChange={e => setFormData({...formData, flat_no: e.target.value})} required>
                        <option value="">-- Select Flat --</option>
                        {vacantFlats.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                        <div><label style={styles.label}>Head Member Name</label><input style={styles.input} required value={formData.head_member} onChange={e => setFormData({...formData, head_member: e.target.value})} /></div>
                        <div><label style={styles.label}>Phone Number</label><input style={styles.input} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                        <div><label style={styles.label}>NID / ID No</label><input style={styles.input} required value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} /></div>
                        <div><label style={styles.label}>Total Members</label><input style={styles.input} type="number" required value={formData.members} onChange={e => setFormData({...formData, members: e.target.value})} /></div>
                    </div>
                    <label style={styles.label}>Login Email</label><input style={styles.input} type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <label style={styles.label}>Login Password</label><input style={styles.input} type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="submit" style={styles.button}>Register Family</button>
                    {msg && <p style={msg.includes('Success') ? styles.success : styles.error}>{msg}</p>}
                </form>
            </div>
        );
    };

    const ManageResidents = () => {
        const [residents, setResidents] = useState([]);
        const [loading, setLoading] = useState(true);

        const fetchResidents = () => {
            fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setResidents(data.residents);
                setLoading(false);
            });
        };

        useEffect(() => { fetchResidents(); }, []);

        const handleDelete = async (id, name) => {
            if(!window.confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;
            const res = await fetch(`${API_BASE_URL}/api/admin/user/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { alert("Family Removed"); fetchResidents(); } 
            else { alert("Failed to remove family"); }
        };

        if (loading) return <p>Loading residents...</p>;

        return (
            <div style={styles.card}>
                <h3 style={styles.header}>Resident List</h3>
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Flat</th>
                                <th style={styles.th}>Head Member</th>
                                <th style={styles.th}>Phone</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {residents.length === 0 ? (
                                <tr><td colSpan="5" style={{padding:'20px', textAlign:'center'}}>No families registered yet.</td></tr>
                            ) : residents.map(r => (
                                <tr key={r.id}>
                                    <td style={{...styles.td, fontWeight:'bold', color:'#3b82f6'}}>{r.flat_no}</td>
                                    <td style={styles.td}>{r.name}</td>
                                    <td style={styles.td}>{r.phone}</td>
                                    <td style={styles.td}>{r.email}</td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleDelete(r.id, r.name)} style={styles.deleteBtn}>
                                            <Trash2 size={14} style={{marginRight:'5px', verticalAlign:'middle'}}/> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const PostNoticeForm = () => {
        const [data, setData] = useState({ title: '', content: '' });
        const [msg, setMsg] = useState('');
        const handlePost = async (e) => {
            e.preventDefault();
            const res = await fetch(`${API_BASE_URL}/api/admin/notices`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
            if (res.ok) { setMsg('Notice Posted!'); setData({ title: '', content: '' }); } else setMsg('Failed');
        };
        return (
            <div style={styles.card}>
                <h3 style={styles.header}>Post Notice</h3>
                <form onSubmit={handlePost}>
                    <input style={styles.input} placeholder="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
                    <textarea style={{...styles.input, height: 100}} placeholder="Content" value={data.content} onChange={e => setData({...data, content: e.target.value})} />
                    <button type="submit" style={styles.button}>Post Notice</button>
                    {msg && <p style={styles.success}>{msg}</p>}
                </form>
            </div>
        );
    };

    const NoticesList = () => {
        const [notices, setNotices] = useState([]);
        useEffect(() => { fetch(`${API_BASE_URL}/api/notices`).then(res => res.json()).then(data => setNotices(data.notices || [])); }, []);
        return (
            <div style={{ display: 'grid', gap: '20px' }}>
                {notices.length === 0 ? <p>No notices found.</p> : notices.map(n => (
                    <div key={n.id} style={styles.card}>
                        <h4 style={{fontWeight: 'bold', fontSize: '18px'}}>{n.title}</h4>
                        <small style={{color: 'gray'}}>{n.date_posted}</small>
                        <p style={{marginTop: '10px'}}>{n.content}</p>
                    </div>
                ))}
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}><Home /> BMS Portal</h2>
                <nav style={{ flex: 1 }}>
                    <NavItem icon={LayoutDashboard} title="Dashboard" viewName="dashboard" />
                    <NavItem icon={Bell} title="Notices" viewName="notices" />
                    {isAdmin && (
                        <>
                            <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Admin Controls</div>
                            <NavItem icon={Plus} title="Add Family" viewName="add_family" />
                            <NavItem icon={Users} title="Manage Residents" viewName="manage_residents" />
                            <NavItem icon={Bell} title="Post Notice" viewName="post_notice" />
                        </>
                    )}
                </nav>
                <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}><LogOut size={20} style={{ marginRight: '10px' }} /> Logout</button>
            </div>

            <div style={styles.main}>
                <h1 style={styles.header}>{currentView.replace('_', ' ').toUpperCase()}</h1>
                
                {currentView === 'dashboard' && activeUser && (
                    <div style={styles.card}>
                        <h3>Welcome, {activeUser.full_name}</h3>
                        <div style={{marginTop: '20px', display: 'grid', gap: '10px', color: '#4b5563'}}>
                            <p><strong>Role:</strong> {activeUser.role ? activeUser.role.toUpperCase() : 'USER'}</p>
                            <p><strong>Email:</strong> {activeUser.email}</p>
                            <p><strong>Flat No:</strong> {activeUser.flat_no}</p>
                            {activeUser.role === 'resident' && (
                                <>
                                    <p><strong>Phone:</strong> {activeUser.phone}</p>
                                    <p><strong>NID:</strong> {activeUser.nid}</p>
                                    <p><strong>Members:</strong> {activeUser.members}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {isAdmin && currentView === 'add_family' && <AddFamilyForm />}
                {isAdmin && currentView === 'post_notice' && <PostNoticeForm />}
                {isAdmin && currentView === 'manage_residents' && <ManageResidents />}
                {currentView === 'notices' && <NoticesList />}
            </div>
        </div>
    );
};

export default BMS_Frontend;