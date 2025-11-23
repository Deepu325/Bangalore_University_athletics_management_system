import React, { useEffect, useState } from "react";
import "./ManageColleges.css";

export default function ManageColleges() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", pedName: "", pedPhone: "" });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
  const API_URL = `${API_BASE_URL}/api`;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/colleges`);
      if (!res.ok) throw new Error("Failed to load colleges");
      const data = await res.json();
      // API returns { ok, count, colleges } - extract the colleges array
      setColleges(data.colleges || data || []);
    } catch (e) {
      setMsg({ type: "error", text: "Failed to load colleges" });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", code: "", pedName: "", pedPhone: "" });
    setEditingId(null);
  }

  function validate() {
    if (!form.name.trim()) return "College Name is required";
    if (!form.code.trim()) return "College Code is required";
    if (!form.pedName.trim()) return "PED Name is required";
    if (!form.pedPhone.trim()) return "PED Phone is required";
    if (!/^\d{6,15}$/.test(form.pedPhone.trim())) return "PED Phone must be numeric (6–15 digits)";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/colleges/${editingId}` : `${API_URL}/colleges`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setMsg({ type: "success", text: editingId ? "College updated" : "College created" });
      resetForm();
      await load();
    } catch (error) {
      setMsg({ type: "error", text: error.message });
    }
  }

  function handleEdit(col) {
    setEditingId(col._id);
    setForm({
      name: col.name || "",
      code: col.code || "",
      pedName: col.pedName || "",
      pedPhone: col.pedPhone || "",
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this college? Only allowed if no registrations exist.")) return;
    try {
      const res = await fetch(`${API_URL}/colleges/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Delete failed");
      }

      setMsg({ type: "success", text: "College deleted" });
      await load();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  return (
    <div className="manage-colleges-page">
      <div className="card form-card">
        <h3>{editingId ? "Edit College" : "Add College"}</h3>
        {msg && <div className={`toast ${msg.type}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="college-form">
          <label>College Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Example: SIMS"
          />
          <label>College Code *</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Unique code (e.g., SIMS01)"
          />
          <label>PED Name *</label>
          <input
            value={form.pedName}
            onChange={(e) => setForm({ ...form, pedName: e.target.value })}
            placeholder="PED user display name"
          />
          <label>PED Phone *</label>
          <input
            value={form.pedPhone}
            onChange={(e) => setForm({ ...form, pedPhone: e.target.value })}
            placeholder="Numeric phone — default password"
          />
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editingId ? "Update College" : "Create College"}
            </button>
            <button type="button" className="btn" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
        <small className="hint">
          Username for PED will be the College Name; default password is the PED Phone. PED must change password on first login.
        </small>
      </div>

      <div className="card table-card">
        <h3>Registered Colleges {loading ? "(loading...)" : ""}</h3>
        <div className="table-wrap">
          <table className="colleges-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>College Name</th>
                <th>Code</th>
                <th>PED Name</th>
                <th>PED Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.length === 0 && (
                <tr>
                  <td colSpan={6}>No colleges found</td>
                </tr>
              )}
              {colleges.map((c, i) => (
                <tr key={c._id}>
                  <td>{i + 1}</td>
                  <td>{c.name}</td>
                  <td>{c.code}</td>
                  <td>{c.pedName || c.name}</td>
                  <td>{c.pedPhone || "-"}</td>
                  <td>
                    <button onClick={() => handleEdit(c)} className="btn tiny">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="btn tiny danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
