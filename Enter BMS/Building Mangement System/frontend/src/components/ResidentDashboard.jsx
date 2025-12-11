import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenanceAPI, noticeAPI } from '../services/api';
import './Dashboard.css';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [newRequest, setNewRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceRequests();
    } else if (activeTab === 'notices') {
      loadNotices();
    }
  }, [activeTab]);

  const loadMaintenanceRequests = async () => {
    try {
      const response = await maintenanceAPI.getRequests();
      if (response.data.status === 'success') {
        setMaintenanceRequests(response.data.requests);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load maintenance requests' });
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

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.trim()) {
      setMessage({ type: 'error', text: 'Please enter a description' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await maintenanceAPI.createRequest(newRequest);
      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: 'Maintenance request submitted successfully!' });
        setNewRequest('');
        loadMaintenanceRequests();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit request',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#ff9800';
      case 'in progress':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Resident Dashboard</h1>
        <p>Welcome back, {user?.full_name}!</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Profile
        </button>
        <button
          className={activeTab === 'maintenance' ? 'active' : ''}
          onClick={() => setActiveTab('maintenance')}
        >
          <i className="fas fa-tools"></i> Maintenance
        </button>
        <button
          className={activeTab === 'notices' ? 'active' : ''}
          onClick={() => setActiveTab('notices')}
        >
          <i className="fas fa-bullhorn"></i> Notices
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="card">
            <h2>My Profile</h2>
            <div className="profile-info">
              <div className="info-item">
                <label>Full Name:</label>
                <span>{user?.full_name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user?.email}</span>
              </div>
              <div className="info-item">
                <label>Role:</label>
                <span className="role-badge">{user?.role || 'Resident'}</span>
              </div>
              {user?.apartment ? (
                <>
                  <div className="info-item">
                    <label>Unit Number:</label>
                    <span>{user.apartment.unit_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Floor:</label>
                    <span>{user.apartment.floor}</span>
                  </div>
                  <div className="info-item">
                    <label>Building:</label>
                    <span>{user.apartment.building}</span>
                  </div>
                </>
              ) : (
                <div className="info-item">
                  <span className="no-apartment">
                    <i className="fas fa-info-circle"></i> No apartment assigned yet. Please contact admin.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-section">
            <div className="card">
              <h2>Submit Maintenance Request</h2>
              <form onSubmit={handleSubmitRequest}>
                <textarea
                  value={newRequest}
                  onChange={(e) => setNewRequest(e.target.value)}
                  placeholder="Describe the maintenance issue..."
                  rows="4"
                  required
                />
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2>My Maintenance Requests</h2>
              {maintenanceRequests.length === 0 ? (
                <p className="empty-state">No maintenance requests yet.</p>
              ) : (
                <div className="requests-list">
                  {maintenanceRequests.map((request) => (
                    <div key={request.id} className="request-item">
                      <div className="request-header">
                        <span className="request-id">#{request.id}</span>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="request-description">{request.description}</p>
                      <div className="request-footer">
                        <span className="request-date">
                          <i className="fas fa-calendar"></i> {request.created_at}
                        </span>
                        {request.apartment && (
                          <span className="request-apartment">
                            <i className="fas fa-home"></i> {request.apartment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="card">
            <h2>Building Notices</h2>
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
        )}
      </div>
    </div>
  );
};

export default ResidentDashboard;

