
import { useEffect, useState } from "react";

const API_URL = "https://rent-ease-nine-coral.vercel.app/api/admin/returns";

function AdminReturnManagement() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updates, setUpdates] = useState({});

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in as Admin.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  const loadReturns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load returns.");
      }

      setReturns(data.returns || []);

      const initialUpdates = {};

      (data.returns || []).forEach((rental) => {
        initialUpdates[rental._id] = {
          returnStatus: rental.returnStatus || "Not Returned",
          returnCondition: rental.returnCondition || "Not Inspected",
          returnNotes: rental.returnNotes || ""
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
    loadReturns();
  }, []);

  const handleChange = (rentalId, field, value) => {
    setUpdates((previous) => ({
      ...previous,
      [rentalId]: {
        ...previous[rentalId],
        [field]: value
      }
    }));
  };

  const saveUpdate = async (rentalId) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${rentalId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(updates[rentalId])
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update return.");
      }

      setMessage("Return inspection updated successfully.");
      await loadReturns();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.headingRow}>
        <div>
          <p style={styles.eyebrow}>CLAIM AND RETURN ADMINISTRATION</p>
          <h2 style={styles.heading}>Returns Management</h2>
          <p style={styles.description}>
            Track returned rental products and record their inspection condition.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadReturns}>
          ↻ Refresh Returns
        </button>
      </div>

      <p style={styles.count}>
        Total return records: <strong>{returns.length}</strong>
      </p>

      {loading && <p>Loading return records...</p>}

      {error && <p style={styles.error}>{error}</p>}

      {message && <p style={styles.success}>{message}</p>}

      {!loading && returns.length === 0 && (
        <div style={styles.empty}>
          No picked-up rental orders are available for return inspection yet.
        </div>
      )}

      {returns.map((rental) => {
        const update = updates[rental._id] || {};

        return (
          <div key={rental._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.productName}>
                  Rental #{rental._id.slice(-6).toUpperCase()}
                </h3>

                <p style={styles.muted}>
                  Customer: {rental.customer?.name || "Customer"}
                </p>

                <p style={styles.muted}>
                  Email: {rental.customer?.email || "N/A"}
                </p>
              </div>

              <span style={styles.status}>
                {rental.returnStatus || "Not Returned"}
              </span>
            </div>

            <div style={styles.products}>
              {rental.items?.map((item, index) => (
                <p key={index}>
                  <strong>{item.productName}</strong> — Qty: {item.quantity}
                </p>
              ))}
            </div>

            <div style={styles.details}>
              <p>
                <strong>Pickup status:</strong> {rental.pickupStatus}
              </p>

              <p>
                <strong>Actual pickup:</strong>{" "}
                {rental.actualPickupDate
                  ? new Date(rental.actualPickupDate).toLocaleDateString()
                  : "N/A"}
              </p>

              <p>
                <strong>Return date:</strong>{" "}
                {rental.actualReturnDate
                  ? new Date(rental.actualReturnDate).toLocaleDateString()
                  : "Not recorded"}
              </p>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                Return Status

                <select
                  style={styles.input}
                  value={update.returnStatus || "Not Returned"}
                  onChange={(e) =>
                    handleChange(rental._id, "returnStatus", e.target.value)
                  }
                >
                  <option value="Return Scheduled">Return Scheduled</option>
                  <option value="Returned">Returned</option>
                  <option value="Under Inspection">Under Inspection</option>
                  <option value="Inspected">Inspected</option>
                </select>
              </label>

              <label style={styles.label}>
                Product Condition

                <select
                  style={styles.input}
                  value={update.returnCondition || "Not Inspected"}
                  onChange={(e) =>
                    handleChange(rental._id, "returnCondition", e.target.value)
                  }
                >
                  <option value="Not Inspected">Not Inspected</option>
                  <option value="Good">Good</option>
                  <option value="Minor Damage">Minor Damage</option>
                  <option value="Major Damage">Major Damage</option>
                  <option value="Missing Parts">Missing Parts</option>
                </select>
              </label>
            </div>

            <label style={styles.label}>
              Admin Inspection Notes

              <textarea
                style={styles.textarea}
                maxLength={1000}
                rows={3}
                placeholder="Enter product inspection details..."
                value={update.returnNotes || ""}
                onChange={(e) =>
                  handleChange(rental._id, "returnNotes", e.target.value)
                }
              />
            </label>

            <p style={styles.characterCount}>
              {(update.returnNotes || "").length}/1000 characters
            </p>

            <button
              style={styles.saveButton}
              onClick={() => saveUpdate(rental._id)}
              disabled={!update.returnStatus || !update.returnCondition}
            >
              Save Return Inspection
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
    padding: "28px",
    borderRadius: "16px",
    margin: "28px 0",
    border: "1px solid #e8e1d5"
  },

  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },

  eyebrow: {
    color: "#c87952",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px"
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
    margin: "20px 0",
    color: "#243b35"
  },

  refreshButton: {
    padding: "10px 16px",
    background: "#f5f0e6",
    border: "1px solid #d8d0c2",
    borderRadius: "8px",
    cursor: "pointer"
  },

  empty: {
    padding: "24px",
    textAlign: "center",
    background: "#f5f0e6",
    borderRadius: "10px",
    color: "#66736c"
  },

  card: {
    border: "1px solid #e5ded2",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "18px"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap"
  },

  productName: {
    color: "#123c3a",
    margin: "0 0 8px"
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
    borderRadius: "20px",
    height: "fit-content",
    fontSize: "12px",
    fontWeight: "700"
  },

  products: {
    margin: "16px 0",
    color: "#243b35"
  },

  details: {
    background: "#f8f6f0",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#52615a",
    marginBottom: "18px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px"
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#243b35",
    marginTop: "12px"
  },

  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px",
    background: "#fffdf8"
  },

  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px",
    resize: "vertical",
    background: "#fffdf8",
    fontFamily: "inherit"
  },

  characterCount: {
    textAlign: "right",
    color: "#78837c",
    fontSize: "11px"
  },

  saveButton: {
    marginTop: "12px",
    padding: "11px 18px",
    background: "#123c3a",
    color: "#fffdf8",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer"
  },

  success: {
    color: "#24734a",
    background: "#eaf5ed",
    padding: "10px",
    borderRadius: "7px"
  },

  error: {
    color: "#a12d2d",
    background: "#fff0ed",
    padding: "10px",
    borderRadius: "7px"
  }
};

export default AdminReturnManagement;
