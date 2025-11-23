import React, { useState, useEffect } from 'react';
import './ManageColleges.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const ManageColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    pedName: '',
    pedPhone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch colleges
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges`);
      if (!res.ok) {
        console.error('Colleges API error:', res.status, res.statusText);
        showNotification(`Error: ${res.status} ${res.statusText}`, 'error');
        setColleges([]);
        return;
      }
      const data = await res.json();
      console.log('✓ Fetched colleges:', data?.colleges?.length || data?.length || 0);
      // API returns { ok, count, colleges } - extract the colleges array
      setColleges(data.colleges || data || []);
    } catch (err) {
      showNotification('Error fetching colleges', 'error');
      console.error('Fetch error:', err);
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const phoneRegex = /^\d{6,15}$/;

    if (!formData.name.trim()) errors.name = 'College name required';
    if (!formData.code.trim()) errors.code = 'College code required';
    if (!formData.pedName.trim()) errors.pedName = 'PED name required';
    if (!phoneRegex.test(String(formData.pedPhone).trim())) {
      errors.pedPhone = 'Phone must be 6-15 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create college');
      }

      setCredentials(data.pedCredentials);
      setShowModal(true);
      setFormData({ name: '', code: '', pedName: '', pedPhone: '' });
      setFormErrors({});
      setShowForm(false);
      await fetchColleges();
      showNotification('College created successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update college');
      }

      setFormData({ name: '', code: '', pedName: '', pedPhone: '' });
      setFormErrors({});
      setShowForm(false);
      setEditingId(null);
      await fetchColleges();
      showNotification('College updated successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollege = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/colleges/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete college');
      }

      await fetchColleges();
      showNotification('College deleted successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCollege = (college) => {
    setFormData({
      name: college.name,
      code: college.code,
      pedName: college.pedName,
      pedPhone: college.pedPhone
    });
    setEditingId(college._id);
    setShowForm(true);
  };

  const handleResetForm = () => {
    setFormData({ name: '', code: '', pedName: '', pedPhone: '' });
    setFormErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  // Filter colleges by search
  const filteredColleges = colleges.filter(col =>
    col.name.toLowerCase().includes(search.toLowerCase()) ||
    col.code.toLowerCase().includes(search.toLowerCase()) ||
    col.pedName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="manage-colleges-container">
      <div className="colleges-header">
        <h1>Manage Colleges</h1>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            + Add College
          </button>
        )}
      </div>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <h2>{editingId ? 'Edit College' : 'Create New College'}</h2>
          <form onSubmit={editingId ? handleUpdateCollege : handleCreateCollege}>
            <div className="form-row">
              <div className="form-group">
                <label>College Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Delhi University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
                {formErrors.name && <span className="error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>College Code *</label>
                <input
                  type="text"
                  placeholder="e.g., DU"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={loading}
                />
                {formErrors.code && <span className="error">{formErrors.code}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>PED Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Rajesh Kumar"
                  value={formData.pedName}
                  onChange={(e) => setFormData({ ...formData, pedName: e.target.value })}
                  disabled={loading}
                />
                {formErrors.pedName && <span className="error">{formErrors.pedName}</span>}
              </div>
              <div className="form-group">
                <label>PED Phone (6-15 digits) *</label>
                <input
                  type="text"
                  placeholder="e.g., 9876543210"
                  value={formData.pedPhone}
                  onChange={(e) => setFormData({ ...formData, pedPhone: e.target.value })}
                  disabled={loading}
                />
                {formErrors.pedPhone && <span className="error">{formErrors.pedPhone}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Processing...' : editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleResetForm} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, code, or PED name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          disabled={loading}
        />
        <span className="result-count">{filteredColleges.length} college(s)</span>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && filteredColleges.length === 0 ? (
        <div className="empty-state">
          {colleges.length === 0 ? 'No colleges yet. Create one to get started.' : 'No colleges match your search.'}
        </div>
      ) : (
        <div className="colleges-grid">
          {filteredColleges.map((col) => (
            <div key={col._id} className="college-card">
              <div className="card-header">
                <h3>{col.name}</h3>
                <span className="code-badge">{col.code}</span>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">PED Name:</span>
                  <span className="value">{col.pedName}</span>
                </div>
                <div className="info-row">
                  <span className="label">PED Phone:</span>
                  <span className="value">{col.pedPhone}</span>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEditCollege(col)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteCollege(col._id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credentials Modal */}
      {showModal && credentials && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>PED Account Created</h2>
            <div className="credentials-display">
              <div className="credential-item">
                <label>PED Username:</label>
                <div className="credential-value">
                  <input
                    type="text"
                    value={credentials.username}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    className="btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.username);
                      showNotification('Username copied to clipboard', 'success');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="credential-note">
                <p>{credentials.note}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
              >
                Got it, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageColleges;
