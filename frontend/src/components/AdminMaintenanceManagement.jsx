
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/admin/maintenance";

function AdminMaintenanceManagement() {
  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    if (!token) throw new Error("Please log in as Admin.");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load maintenance requests.");
      }

      const list = data.requests || [];
      setRequests(list);

      const initialUpdates = {};

      list.forEach((request) => {
        initialUpdates[request._id] = {
          status: request.status || "Pending",
          adminNotes: request.adminNotes || ""
        };
      });

      setUpdates(initialUpdates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleChange = (id, field, value) => {
    setUpdates((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value
      }
    }));
  };

  const saveUpdate = async (id) => {
    try {
      setSavingId(id);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(updates[id])
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update request.");
      }

      setMessage("Maintenance request updated successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.headingRow}>
        <div>
          <p style={styles.eyebrow}>CUSTOMER SERVICE ADMINISTRATION</p>
          <h2 style={styles.heading}>Maintenance Request Management</h2>
          <p style={styles.description}>
            Review customer issues, update request progress and provide support notes.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadRequests}>
          ↻ Refresh Requests
        </button>
      </div>

      <p style={styles.count}>
        Total requests: <strong>{requests.length}</strong>
      </p>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}

      {loading && <p>Loading maintenance requests...</p>}

      {!loading && requests.length === 0 && (
        <div style={styles.empty}>
          No maintenance requests found.
        </div>
      )}

      {requests.map((request) => {
        const update = updates[request._id] || {
          status: request.status || "Pending",
          adminNotes: request.adminNotes || ""
        };

        return (
          <div key={request._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.title}>
                  {request.productName || request.product?.name || "Rental Product"}
                </h3>
                <p style={styles.muted}>
                  Customer: {request.customer?.name || "Customer"}
                </p>
                <p style={styles.muted}>
                  Email: {request.customer?.email || "N/A"}
                </p>
              </div>

              <span style={styles.status}>
                {request.status}
              </span>
            </div>

            <div style={styles.details}>
              <p>
                <strong>Issue:</strong> {request.issueType}
              </p>
              <p>
                <strong>Rental order:</strong>{" "}
                {request.rental?._id
                  ? `#${request.rental._id.slice(-6).toUpperCase()}`
                  : "N/A"}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {request.createdAt
                  ? new Date(request.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div style={styles.descriptionBox}>
              <strong>Customer Description</strong>
              <p>{request.description}</p>
            </div>

            <label style={styles.label}>
              Update Status
              <select
                style={styles.input}
                value={update.status}
                onChange={(e) =>
                  handleChange(request._id, "status", e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>

            <label style={styles.label}>
              Admin Notes (visible to customer)
              <textarea
                style={styles.textarea}
                rows={3}
                maxLength={1000}
                value={update.adminNotes}
                placeholder="Enter an update for the customer..."
                onChange={(e) =>
                  handleChange(request._id, "adminNotes", e.target.value)
                }
              />
            </label>

            <p style={styles.characterCount}>
              {(update.adminNotes || "").length}/1000 characters
            </p>

            <button
              style={styles.saveButton}
              disabled={savingId === request._id}
              onClick={() => saveUpdate(request._id)}
            >
              {savingId === request._id ? "Saving..." : "Save Update"}
            </button>
          </div>
        );
      })}
    </section>
  );
}

const styles = {
  section: {
    background: "#fffdf8",
    padding: "26px",
    borderRadius: "14px",
    margin: "25px 0",
    border: "1px solid #e8e1d5"
  },
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px"
  },
  eyebrow: {
    color: "#c87952",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.3px"
  },
  heading: {
    color: "#123c3a",
    margin: "6px 0"
  },
  description: {
    color: "#66736c",
    fontSize: "14px"
  },
  count: {
    color: "#243b35",
    margin: "18px 0"
  },
  refreshButton: {
    padding: "10px 14px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px",
    background: "#f5f0e6",
    cursor: "pointer"
  },
  card: {
    border: "1px solid #e5ded2",
    borderRadius: "11px",
    padding: "18px",
    marginTop: "18px"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px"
  },
  title: {
    color: "#123c3a",
    margin: "0 0 7px"
  },
  muted: {
    color: "#66736c",
    fontSize: "13px",
    margin: "4px 0"
  },
  status: {
    background: "#f5f0e6",
    color: "#123c3a",
    padding: "7px 12px",
    borderRadius: "18px",
    height: "fit-content",
    fontSize: "12px",
    fontWeight: "600"
  },
  details: {
    background: "#f8f6f0",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "15px",
    color: "#52615a",
    fontSize: "13px"
  },
  descriptionBox: {
    marginTop: "15px",
    padding: "12px",
    borderLeft: "3px solid #c87952",
    background: "#faf7f0",
    color: "#243b35",
    fontSize: "13px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
    color: "#243b35",
    fontSize: "13px",
    fontWeight: "600"
  },
  input: {
    padding: "11px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px",
    background: "#fffdf8"
  },
  textarea: {
    padding: "11px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px",
    background: "#fffdf8",
    resize: "vertical",
    fontFamily: "inherit"
  },
  characterCount: {
    textAlign: "right",
    color: "#78837c",
    fontSize: "11px"
  },
  saveButton: {
    padding: "11px 17px",
    background: "#123c3a",
    color: "#fffdf8",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer"
  },
  empty: {
    padding: "20px",
    background: "#f5f0e6",
    borderRadius: "8px"
  },
  error: {
    color: "#a12d2d",
    background: "#fff0ed",
    padding: "10px",
    borderRadius: "7px"
  },
  success: {
    color: "#24734a",
    background: "#eaf5ed",
    padding: "10px",
    borderRadius: "7px"
  }
};

export default AdminMaintenanceManagement;
