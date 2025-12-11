import { useState, useEffect } from 'react';
import { adminAPI, noticeAPI } from '../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('assign');
  const [vacantApartments, setVacantApartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [assignForm, setAssignForm] = useState({ userEmail: '', unitNumber: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'assign') {
      loadVacantApartments();
    } else if (activeTab === 'notices') {
      loadNotices();
    }
  }, [activeTab]);

  const loadVacantApartments = async () => {
    try {
      const response = await adminAPI.getVacantApartments();
      if (response.data.status === 'success') {
        setVacantApartments(response.data.vacant_apartments);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load vacant apartments' });
    }
  };

  const loadNotices = async () => {
    try {
      const response = await noticeAPI.getNotices();
      if (response.data.status === 'success') {
        setNotices(response.data.notices);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load notices' });
    }
  };

  const handleAssignApartment = async (e) => {
    e.preventDefault();
    if (!assignForm.userEmail || !assignForm.unitNumber) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await adminAPI.assignApartment(
        assignForm.userEmail,
        assignForm.unitNumber
      );
      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message });
        setAssignForm({ userEmail: '', unitNumber: '' });
        loadVacantApartments();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to assign apartment',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await noticeAPI.postNotice(noticeForm.title, noticeForm.content);
      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message });
        setNoticeForm({ title: '', content: '' });
        loadNotices();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to post notice',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage building operations</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'assign' ? 'active' : ''}
          onClick={() => setActiveTab('assign')}
        >
          <i className="fas fa-key"></i> Assign Apartment
        </button>
        <button
          className={activeTab === 'notices' ? 'active' : ''}
          onClick={() => setActiveTab('notices')}
        >
          <i className="fas fa-bullhorn"></i> Manage Notices
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="tab-content">
        {activeTab === 'assign' && (
          <div className="admin-section">
            <div className="card">
              <h2>Assign Apartment to User</h2>
              <form onSubmit={handleAssignApartment}>
                <div className="form-row">
                  <div className="form-group">
                    <label>User Email</label>
                    <input
                      type="email"
                      value={assignForm.userEmail}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, userEmail: e.target.value })
                      }
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Number</label>
                    <input
                      type="text"
                      value={assignForm.unitNumber}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, unitNumber: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., 1A"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Assigning...' : 'Assign Apartment'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2>Vacant Apartments</h2>
              {vacantApartments.length === 0 ? (
                <p className="empty-state">No vacant apartments available.</p>
              ) : (
                <div className="apartments-grid">
                  {vacantApartments.map((apt, index) => (
                    <div key={index} className="apartment-card">
                      <div className="apartment-header">
                        <i className="fas fa-home"></i>
                        <span className="unit-number">{apt.unit_number}</span>
                      </div>
                      <div className="apartment-details">
                        <p>
                          <i className="fas fa-layer-group"></i> Floor: {apt.floor}
                        </p>
                        <p>
                          <i className="fas fa-bed"></i> Bedrooms: {apt.bedrooms}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="admin-section">
            <div className="card">
              <h2>Post New Notice</h2>
              <form onSubmit={handlePostNotice}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) =>
                      setNoticeForm({ ...noticeForm, title: e.target.value })
                    }
                    placeholder="Notice title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={noticeForm.content}
                    onChange={(e) =>
                      setNoticeForm({ ...noticeForm, content: e.target.value })
                    }
                    placeholder="Notice content..."
                    rows="5"
                    required
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Posting...' : 'Post Notice'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2>All Notices</h2>
              {notices.length === 0 ? (
                <p className="empty-state">No notices posted yet.</p>
              ) : (
                <div className="notices-list">
                  {notices.map((notice) => (
                    <div key={notice.id} className="notice-item">
                      <div className="notice-header">
                        <h3>{notice.title}</h3>
                        <span className="notice-date">
                          <i className="fas fa-calendar"></i> {notice.date_posted}
                        </span>
                      </div>
                      <p className="notice-content">{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

