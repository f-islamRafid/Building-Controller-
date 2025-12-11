
window.print("HELLO WORLD ERROR HERE !!!!!!");

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, LogOut, LayoutDashboard, User, Bell, Home, Hammer, ListChecks, Users, Plus } from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:5000';

// --- API FUNCTIONS ---

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
 
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload(); 
    }

    const data = await response.json();
    return { response, data };
};

// --- AUTH CONTEXT ---

const AuthContext = React.createContext();

const useAuth = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoading, setIsLoading] = useState(true);

    const login = useCallback(async (email, password) => {
        try {
            const { response, data } = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                await fetchUserInfo(data.token);
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed.' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'API connection error.' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const fetchUserInfo = useCallback(async (tokenOverride) => {
        const currentToken = tokenOverride || token;
        if (!currentToken) {
            setIsLoading(false);
            return;
        }

        try {
            const { response, data } = await apiFetch('/api/user_info', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            if (response.ok && data.status === 'success') {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
            } else {
                logout();
            }
        } catch (error) {
            console.error('User info fetch error:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    const contextValue = useMemo(() => ({
        user,
        token,
        isLoading,
        login,
        logout,
        fetchUserInfo
    }), [user, token, isLoading, login, logout, fetchUserInfo]);

    return contextValue;
};


// --- UI COMPONENTS ---

// 1. Navigation Component
const NavItem = ({ icon: Icon, title, onClick, currentView, viewName }) => {
    const isActive = currentView === viewName;
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-3 p-3 text-sm font-medium rounded-lg transition-colors duration-200 w-full text-left
                ${isActive
                    ? 'bg-indigo-700 text-white shadow-lg' 
                    : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span>{title}</span>
        </button>
    );
};

// 2. Auth Form
const AuthForm = ({ onToggleView, type }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const isLogin = type === 'login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const payload = { email, password };
        if (!isLogin) payload.name = name;

        try {
            const endpoint = isLogin ? '/login' : '/register';
            const { response, data } = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                if (isLogin) {
                    await login(email, password);
                } else {
                    setMessage('Registration successful! Please login.');
                    onToggleView('login');
                }
            } else {
                setMessage(data.message || 'An unexpected error occurred.');
            }
        } catch (error) {
            setMessage('Network error or API unreachable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                )}
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
                </button>
            </form>
            {message && (
                <p className={`mt-4 text-center text-sm ${message.includes('successful') ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                </p>
            )}
            <div className="mt-6 text-center text-sm">
                {isLogin ? (
                    <p>Don't have an account? <button onClick={() => onToggleView('register')} className="text-indigo-600 hover:underline font-medium">Register</button></p>
                ) : (
                    <p>Already have an account? <button onClick={() => onToggleView('login')} className="text-indigo-600 hover:underline font-medium">Log In</button></p>
                )}
            </div>
        </div>
    );
};

// 3. User Profile
const UserProfile = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold border-b pb-2 text-gray-700">My Profile</h3>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="space-y-3">
                    <p className="flex justify-between items-center text-gray-600">
                        <span className="font-medium">Full Name:</span>
                        <span className="font-bold text-gray-800">{user.full_name}</span>
                    </p>
                    <p className="flex justify-between items-center text-gray-600">
                        <span className="font-medium">Email:</span>
                        <span className="text-sm">{user.email}</span>
                    </p>
                    <p className="flex justify-between items-center text-gray-600">
                        <span className="font-medium">Role:</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {user.role.toUpperCase()}
                        </span>
                    </p>
                </div>
            </div>

            {user.apartment ? (
                <div className="bg-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center"><Home className="w-5 h-5 mr-2" /> Residence Details</h4>
                    <p className="flex justify-between items-center text-gray-700">
                        <span className="font-medium">Unit Number:</span>
                        <span className="text-xl font-extrabold text-indigo-900">{user.apartment.unit_number}</span>
                    </p>
                    <p className="flex justify-between items-center text-gray-700">
                        <span className="font-medium">Floor:</span>
                        <span>{user.apartment.floor}</span>
                    </p>
                    <p className="flex justify-between items-center text-gray-700">
                        <span className="font-medium">Building:</span>
                        <span>{user.apartment.building}</span>
                    </p>
                </div>
            ) : (
                <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 border border-yellow-200">
                    <p className="font-medium">Status: Awaiting Apartment Assignment.</p>
                </div>
            )}
        </div>
    );
};

// 4. Resident Maintenance
const ResidentMaintenance = () => {
    const [requests, setRequests] = useState([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            const { response, data } = await apiFetch('/api/maintenance', { method: 'GET' });
            if (response.ok && data.status === 'success') {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const { response, data } = await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify({ description }),
            });

            if (response.ok) {
                setMessage('Request submitted successfully!');
                setDescription('');
                fetchRequests();
            } else {
                setMessage(data.message || 'Failed to submit request.');
            }
        } catch (error) {
            setMessage('API connection error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold border-b pb-2 text-gray-700">Maintenance Requests</h3>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h4 className="text-xl font-medium text-indigo-700 mb-4 flex items-center"><Hammer className="w-5 h-5 mr-2"/> Submit New Request</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue..."
                        rows="4"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                    <button
                        type="submit"
                        disabled={loading || !description.trim()}
                        className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    {message && (
                        <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
                    )}
                </form>
            </div>

            <div className="space-y-4">
                <h4 className="text-xl font-medium text-gray-700 flex items-center"><ListChecks className="w-5 h-5 mr-2"/> My Requests</h4>
                {requests.length === 0 ? (
                    <p className="text-gray-500 bg-white p-4 rounded-lg">No requests yet.</p>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-400">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-500">{req.created_at}</span>
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{req.status}</span>
                            </div>
                            <p className="text-gray-800">{req.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// 5. Notices View
const NoticesView = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            try {
                const { response, data } = await apiFetch('/api/notices', { method: 'GET' });
                if (response.ok && data.status === 'success') {
                    setNotices(data.notices);
                }
            } catch (error) {
                console.error('Error fetching notices:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold border-b pb-2 text-gray-700 flex items-center"><Bell className="w-6 h-6 mr-2"/> Notices</h3>
            {loading ? (
                <p>Loading notices...</p>
            ) : notices.length === 0 ? (
                <p className="text-gray-500 bg-white p-4 rounded-lg shadow">No notices posted.</p>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {notices.map((notice) => (
                        <div key={notice.id} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">{notice.title}</h4>
                            <p className="text-sm text-gray-500 mb-3">Posted: {notice.date_posted}</p>
                            <p className="text-gray-700">{notice.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- ADMIN COMPONENTS ---

// 6. Admin: Manage Residents (Assign)
const ManageResidents = () => {
    const { fetchUserInfo } = useAuth();
    const [vacantFlats, setVacantFlats] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedUserEmail, setSelectedUserEmail] = useState('');
    const [selectedFlat, setSelectedFlat] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const { response, data } = await apiFetch('/api/apartments/vacant', { method: 'GET' });
            if (response.ok) setVacantFlats(data.vacant_apartments);
            
            // Mock users for demo
            setUsers([
                { email: 'alice@tenant.com', name: 'Alice Resident' },
                { email: 'bob@tenant.com', name: 'Bob Newbie' }
            ]);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            const { response, data } = await apiFetch('/api/admin/assign_apartment', {
                method: 'POST',
                body: JSON.stringify({ user_email: selectedUserEmail, unit_number: selectedFlat }),
            });
            if (response.ok) {
                setMessage('Assignment Successful!');
                fetchData();
                fetchUserInfo();
            } else {
                setMessage(data.message || 'Failed.');
            }
        } catch (e) { setMessage('Error.'); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
            <h4 className="text-xl font-medium text-indigo-700 mb-4 flex items-center"><Users className="w-5 h-5 mr-2"/> Assign Resident</h4>
            <form onSubmit={handleAssign} className="space-y-4">
                <select value={selectedUserEmail} onChange={(e) => setSelectedUserEmail(e.target.value)} className="w-full p-3 border rounded-lg">
                    <option value="">Select Resident</option>
                    {users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </select>
                <select value={selectedFlat} onChange={(e) => setSelectedFlat(e.target.value)} className="w-full p-3 border rounded-lg">
                    <option value="">Select Vacant Flat</option>
                    {vacantFlats.map(f => <option key={f.unit_number} value={f.unit_number}>{f.unit_number}</option>)}
                </select>
                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Assign</button>
                {message && <p className="text-sm text-green-600">{message}</p>}
            </form>
        </div>
    );
};

// 7. Admin: Post Notice
const PostNoticeForm = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');

    const handlePost = async (e) => {
        e.preventDefault();
        try {
            const { response, data } = await apiFetch('/api/admin/notices', {
                method: 'POST',
                body: JSON.stringify({ title, content }),
            });
            if (response.ok) {
                setMessage('Notice Posted!');
                setTitle(''); setContent('');
            } else {
                setMessage(data.message || 'Failed.');
            }
        } catch (e) { setMessage('Error.'); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100">
            <h4 className="text-xl font-medium text-red-700 mb-4 flex items-center"><ListChecks className="w-5 h-5 mr-2"/> Post Notice</h4>
            <form onSubmit={handlePost} className="space-y-4">
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-lg" />
                <textarea rows="4" placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border rounded-lg" />
                <button type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Post</button>
                {message && <p className="text-sm text-green-600">{message}</p>}
            </form>
        </div>
    );
};

// 8. Admin: Add Family (NEW COMPONENT)
const AddFamilyForm = () => {
    const [name, setName] = useState('');
    const [relation, setRelation] = useState('');
    const [age, setAge] = useState('');
    const [message, setMessage] = useState('');

    const handleAdd = async (e) => {
        e.preventDefault();
        // This assumes you have an endpoint /api/admin/add_family
        // If not, you need to create it in python or this will fail
        try {
            const { response, data } = await apiFetch('/api/admin/add_family', {
                method: 'POST',
                body: JSON.stringify({ name, relation, age }),
            });
            if (response.ok) {
                setMessage('Family member added!');
                setName(''); setRelation(''); setAge('');
            } else {
                setMessage(data.message || 'Failed to add family member.');
            }
        } catch (e) { setMessage('API Error'); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
            <h4 className="text-xl font-medium text-blue-700 mb-4 flex items-center"><Plus className="w-5 h-5 mr-2"/> Add Family Member</h4>
            <form onSubmit={handleAdd} className="space-y-4">
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Relation (e.g. Spouse, Child)" value={relation} onChange={(e) => setRelation(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Member</button>
                {message && <p className="text-sm text-gray-600">{message}</p>}
            </form>
        </div>
    );
};

// 9. MAIN DASHBOARD LAYOUT
const Dashboard = () => {
    const { user, logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');

    if (!user) return null;
    const isAdmin = user.role === 'admin';

    // Set default view on load
    useEffect(() => {
        setCurrentView('dashboard');
    }, []);

    const renderContent = () => {
        // Common Views
        if (currentView === 'dashboard') return <UserProfile />; // Default to profile as dashboard overview
        if (currentView === 'notices') return <NoticesView />;
        if (currentView === 'maintenance') return <ResidentMaintenance />;

        // Admin Views
        if (isAdmin && currentView === 'add_family') return <AddFamilyForm />;
        if (isAdmin && currentView === 'manage_residents') return <ManageResidents />;
        if (isAdmin && currentView === 'post_notice') return <PostNoticeForm />;

        return <UserProfile />;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- SIDEBAR --- */}
            <div className="w-64 bg-indigo-900 text-white p-5 flex flex-col">
                <h1 className="text-2xl font-bold mb-10 flex items-center gap-2"><Home /> BMS Portal</h1>
                
                <nav className="flex-1 space-y-2">
                    {/* Common Links */}
                    <NavItem icon={LayoutDashboard} title="Dashboard" onClick={() => setCurrentView('dashboard')} currentView={currentView} viewName="dashboard" />
                    <NavItem icon={Bell} title="Notices" onClick={() => setCurrentView('notices')} currentView={currentView} viewName="notices" />
                    {!isAdmin && (
                        <NavItem icon={Hammer} title="Maintenance" onClick={() => setCurrentView('maintenance')} currentView={currentView} viewName="maintenance" />
                    )}

                    {/* --- ADMIN CONTROLS --- */}
                    {isAdmin && (
                        <>
                            <div className="pt-4 pb-2 text-xs font-bold text-indigo-400 uppercase">Admin Controls</div>
                            <NavItem icon={Plus} title="Add Family" onClick={() => setCurrentView('add_family')} currentView={currentView} viewName="add_family" />
                            <NavItem icon={Users} title="Manage Residents" onClick={() => setCurrentView('manage_residents')} currentView={currentView} viewName="manage_residents" />
                            <NavItem icon={ListChecks} title="Post Notice" onClick={() => setCurrentView('post_notice')} currentView={currentView} viewName="post_notice" />
                        </>
                    )}
                </nav>

                <button onClick={logout} className="flex items-center space-x-3 p-3 text-sm font-medium text-red-200 hover:text-red-100 transition mt-auto">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 p-10 overflow-auto">
                <header className="mb-8 border-b pb-4">
                    <h2 className="text-3xl font-bold text-gray-800 capitalize">{currentView.replace('_', ' ')}</h2>
                    <p className="text-gray-500">Welcome, {user.full_name}</p>
                </header>
                {renderContent()}
            </div>
        </div>
    );
};

// 10. ROOT APP
export default function App() {
    const auth = useAuth();
    const [authView, setAuthView] = useState('login');

    if (auth.isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    if (!auth.token || !auth.user) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
                <AuthForm onToggleView={setAuthView} type={authView} />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={auth}>
            <Dashboard />
        </AuthContext.Provider>
    );
}