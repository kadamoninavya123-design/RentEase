
import { useEffect, useState } from "react";

const API_URL = "https://rent-ease-nine-coral.vercel.app/api/admin/maintenance";

const statuses = ["Pending", "In Progress", "Resolved"];

function AdminMaintenanceManagement() {
  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  function getHeaders() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in again.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load maintenance requests.");
      }

      const received = data.requests || [];
      setRequests(received);

      const initialUpdates = {};

      received.forEach((request) => {
        initialUpdates[request._id] = {
          status: request.status || "Pending",
          adminNotes: request.adminNotes || ""
        };
      });

      setUpdates(initialUpdates);
    } catch (err) {
      setError(err.message || "Unable to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function handleChange(id, field, value) {
    setUpdates((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value
      }
    }));
  }

  async function saveUpdate(id) {
    const update = updates[id];

    if (!update) return;

    try {
      setSavingId(id);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          status: update.status,
          adminNotes: update.adminNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update request.");
      }

      setMessage(data.message || "Maintenance request updated successfully.");

      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to update maintenance request.");
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(date) {
    return date
      ? new Date(date).toLocaleDateString("en-IN")
      : "Not available";
  }

  const styles = {
    panel: {
      background: "#fffdf8",
      border: "1px solid #e7dfd1",
      borderRadius: "12px",
      padding: "25px",
      marginTop: "25px",
      color: "#243b35"
    },
    eyebrow: {
      color: "#c87952",
      fontSize: "12px",
      fontWeight: "bold",
      letterSpacing: "2px"
    },
    button: {
      background: "#c87952",
      color: "white",
      border: "none",
      borderRadius: "7px",
      padding: "10px 16px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    secondaryButton: {
      background: "#e9f0e9",
      color: "#123c3a",
      border: "1px solid #cbd9cd",
      borderRadius: "7px",
      padding: "10px 15px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    card: {
      border: "1px solid #e7dfd1",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "18px",
      background: "#fffdf8"
    },
    info: {
      background: "#f8f5ee",
      padding: "13px",
      borderRadius: "7px",
      marginTop: "12px",
      lineHeight: 1.7,
      fontSize: "14px"
    },
    field: {
      marginTop: "17px"
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "bold",
      marginBottom: "7px",
      color: "#40564d"
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "11px",
      border: "1px solid #d8d1c5",
      borderRadius: "7px",
      background: "#fffdf8",
      color: "#243b35",
      fontSize: "14px"
    },
    textarea: {
      width: "100%",
      minHeight: "90px",
      boxSizing: "border-box",
      padding: "11px",
      border: "1px solid #d8d1c5",
      borderRadius: "7px",
      background: "#fffdf8",
      color: "#243b35",
      fontSize: "14px",
      resize: "vertical"
    },
    message: {
      background: "#e9f0e9",
      color: "#246b45",
      padding: "12px",
      borderRadius: "7px",
      marginTop: "15px"
    },
    error: {
      background: "#f8e8e4",
      color: "#a83232",
      padding: "12px",
      borderRadius: "7px",
      marginTop: "15px"
    }
  };

  return (
    <section style={styles.panel}>
      <p style={styles.eyebrow}>CUSTOMER SERVICE ADMINISTRATION</p>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <h2 style={{ margin: "10px 0" }}>
          Maintenance Request Management
        </h2>

        <button
          style={styles.secondaryButton}
          onClick={loadRequests}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh Requests"}
        </button>
      </div>

      <p style={{ color: "#64736d", lineHeight: 1.6 }}>
        Review customer-reported product issues, update their progress
        and provide support notes.
      </p>

      <p>
        <strong>{requests.length} Requests</strong>
      </p>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {loading && <p>Loading maintenance requests...</p>}

      {!loading && !error && requests.length === 0 && (
        <div style={styles.info}>
          No maintenance requests have been submitted yet.
        </div>
      )}

      {!loading && requests.map((request) => {
        const update = updates[request._id] || {
          status: request.status || "Pending",
          adminNotes: request.adminNotes || ""
        };

        return (
          <article key={request._id} style={styles.card}>
            <h3 style={{ marginTop: 0 }}>
              {request.productName ||
                request.product?.name ||
                "Rental Product"}
            </h3>

            <div style={styles.info}>
              <strong>Customer:</strong>{" "}
              {request.customer?.name || "Customer"}
              <br />

              <strong>Email:</strong>{" "}
              {request.customer?.email || "Not available"}
              <br />

              <strong>Order:</strong>{" "}
              #{request.rental?._id
                ? request.rental._id.slice(-6).toUpperCase()
                : "Not available"}
              <br />

              <strong>Issue:</strong>{" "}
              {request.issueType || request.issue || "Not specified"}
              <br />

              <strong>Submitted:</strong>{" "}
              {formatDate(request.createdAt)}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Customer Description</label>
              <div style={styles.info}>
                {request.description || "No description provided."}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Update Status</label>

              <select
                style={styles.input}
                value={update.status}
                onChange={(event) =>
                  handleChange(
                    request._id,
                    "status",
                    event.target.value
                  )
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Admin Notes (visible to customer)
              </label>

              <textarea
                style={styles.textarea}
                value={update.adminNotes}
                maxLength={1000}
                onChange={(event) =>
                  handleChange(
                    request._id,
                    "adminNotes",
                    event.target.value
                  )
                }
                placeholder="Write a support update for the customer..."
              />

              <small style={{ color: "#64736d" }}>
                {update.adminNotes.length}/1000 characters
              </small>
            </div>

            <button
              style={{ ...styles.button, marginTop: "18px" }}
              onClick={() => saveUpdate(request._id)}
              disabled={savingId === request._id}
            >
              {savingId === request._id
                ? "Saving..."
                : "Save Update"}
            </button>
          </article>
        );
      })}
    </section>
  );
}

export default AdminMaintenanceManagement;
