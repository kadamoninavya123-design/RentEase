
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/admin/damage-claims";

const STATUS_OPTIONS = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Resolved"
];

function AdminDamageClaimManagement() {
  const [claims, setClaims] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  });

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load damage claims");
      }

      const claimList = data.claims || [];

      setClaims(claimList);

      const initialEdits = {};

      claimList.forEach((claim) => {
        initialEdits[claim._id] = {
          status: claim.status,
          adminNotes: claim.adminNotes || ""
        };
      });

      setEdits(initialEdits);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleEdit = (claimId, field, value) => {
    setEdits((previous) => ({
      ...previous,
      [claimId]: {
        ...previous[claimId],
        [field]: value
      }
    }));
  };

  const handleSave = async (claim) => {
    try {
      setSavingId(claim._id);
      setError("");
      setMessage("");

      const updatedValues = edits[claim._id];

      const response = await fetch(`${API_URL}/${claim._id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          status: updatedValues.status,
          adminNotes: updatedValues.adminNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update damage claim");
      }

      const updatedClaim = data.claim || {
        ...claim,
        status: updatedValues.status,
        adminNotes: updatedValues.adminNotes
      };

      setClaims((previous) =>
        previous.map((item) =>
          item._id === claim._id ? updatedClaim : item
        )
      );

      setEdits((previous) => ({
        ...previous,
        [claim._id]: {
          status: updatedClaim.status,
          adminNotes: updatedClaim.adminNotes || ""
        }
      }));

      setMessage("Damage claim updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "#b7791f",
      "Under Review": "#2563eb",
      Approved: "#15803d",
      Rejected: "#dc2626",
      Resolved: "#0f766e"
    };

    return colors[status] || "#475569";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>CUSTOMER SUPPORT</p>
          <h2 style={styles.heading}>Damage Claims Management</h2>
          <p style={styles.subtitle}>
            Review customer complaints and manage damage claim decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClaims}
          style={styles.refreshButton}
          disabled={loading}
        >
          ↻ Refresh Claims
        </button>
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <span>Total Claims</span>
          <strong>{claims.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Pending</span>
          <strong>
            {claims.filter((c) => c.status === "Pending").length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Under Review</span>
          <strong>
            {claims.filter((c) => c.status === "Under Review").length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Resolved</span>
          <strong>
            {claims.filter((c) => c.status === "Resolved").length}
          </strong>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}

      {loading ? (
        <p style={styles.info}>Loading damage claims...</p>
      ) : claims.length === 0 ? (
        <div style={styles.empty}>
          <h3>No Damage Claims Found</h3>
          <p>Customer damage claims will appear here.</p>
        </div>
      ) : (
        <div style={styles.claimList}>
          {claims.map((claim) => {
            const edit = edits[claim._id] || {
              status: claim.status,
              adminNotes: claim.adminNotes || ""
            };

            return (
              <article key={claim._id} style={styles.claimCard}>
                <div style={styles.claimHeader}>
                  <div>
                    <h3 style={styles.productName}>
                      {claim.productName || claim.product?.name || "Product"}
                    </h3>

                    <p style={styles.claimId}>
                      Claim ID: {claim._id.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${getStatusColor(claim.status)}15`,
                      color: getStatusColor(claim.status)
                    }}
                  >
                    {claim.status}
                  </span>
                </div>

                <div style={styles.detailsGrid}>
                  <div>
                    <span style={styles.detailLabel}>Customer</span>
                    <strong>
                      {claim.customer?.name || "N/A"}
                    </strong>
                    <small>
                      {claim.customer?.email || ""}
                    </small>
                  </div>

                  <div>
                    <span style={styles.detailLabel}>Claim Type</span>
                    <strong>{claim.claimType}</strong>
                  </div>

                  <div>
                    <span style={styles.detailLabel}>Rental Order</span>
                    <strong>
                      {claim.rental?._id
                        ? `#${claim.rental._id.slice(-6).toUpperCase()}`
                        : "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.detailLabel}>Rental Status</span>
                    <strong>
                      {claim.rental?.status || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.detailLabel}>Submitted On</span>
                    <strong>{formatDate(claim.createdAt)}</strong>
                  </div>
                </div>

                <div style={styles.descriptionBox}>
                  <span style={styles.detailLabel}>Customer Description</span>
                  <p>{claim.description}</p>
                </div>

                <div style={styles.editSection}>
                  <label style={styles.label}>
                    Update Claim Status
                  </label>

                  <select
                    value={edit.status}
                    onChange={(e) =>
                      handleEdit(claim._id, "status", e.target.value)
                    }
                    style={styles.select}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <label style={styles.label}>
                    Admin Notes / Response
                  </label>

                  <textarea
                    value={edit.adminNotes}
                    onChange={(e) =>
                      handleEdit(claim._id, "adminNotes", e.target.value)
                    }
                    placeholder="Enter your response or reason for the claim decision..."
                    maxLength={1000}
                    rows={3}
                    style={styles.textarea}
                  />

                  <div style={styles.footer}>
                    <small style={styles.characterCount}>
                      {edit.adminNotes.length}/1000 characters
                    </small>

                    <button
                      type="button"
                      onClick={() => handleSave(claim)}
                      disabled={savingId === claim._id}
                      style={{
                        ...styles.saveButton,
                        opacity: savingId === claim._id ? 0.6 : 1
                      }}
                    >
                      {savingId === claim._id
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const styles = {
  section: {
    marginTop: "32px",
    padding: "24px",
    background: "#fffdf8",
    border: "1px solid #e8e1d6",
    borderRadius: "14px",
    color: "#243b35"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "22px"
  },
  eyebrow: {
    color: "#c87952",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    margin: "0 0 6px"
  },
  heading: {
    color: "#123c3a",
    fontSize: "23px",
    margin: "0 0 6px"
  },
  subtitle: {
    color: "#718078",
    fontSize: "13px",
    margin: 0
  },
  refreshButton: {
    background: "#f5f0e6",
    color: "#123c3a",
    border: "1px solid #ded5c7",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "22px"
  },
  summaryCard: {
    background: "#f5f0e6",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#64746c",
    fontSize: "13px"
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px"
  },
  success: {
    color: "#166534",
    background: "#f0fdf4",
    padding: "12px",
    borderRadius: "8px"
  },
  info: {
    color: "#64746c",
    padding: "20px"
  },
  empty: {
    textAlign: "center",
    padding: "35px 15px",
    background: "#f5f0e6",
    borderRadius: "10px"
  },
  claimList: {
    display: "grid",
    gap: "18px"
  },
  claimCard: {
    border: "1px solid #e8e1d6",
    borderRadius: "12px",
    padding: "20px",
    background: "#fff"
  },
  claimHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px"
  },
  productName: {
    color: "#123c3a",
    margin: "0 0 5px",
    fontSize: "18px"
  },
  claimId: {
    color: "#89958e",
    fontSize: "11px",
    margin: 0
  },
  statusBadge: {
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    padding: "16px 0",
    borderTop: "1px solid #eee9e0",
    borderBottom: "1px solid #eee9e0"
  },
  detailLabel: {
    display: "block",
    color: "#89958e",
    fontSize: "11px",
    marginBottom: "6px"
  },
  descriptionBox: {
    background: "#f8f6f1",
    padding: "14px",
    borderRadius: "8px",
    marginTop: "16px"
  },
  editSection: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "9px"
  },
  label: {
    fontSize: "13px",
    color: "#123c3a",
    fontWeight: "700",
    marginTop: "5px"
  },
  select: {
    width: "100%",
    padding: "11px",
    border: "1px solid #d9d2c7",
    borderRadius: "7px",
    background: "#fffdf8",
    color: "#243b35"
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d9d2c7",
    borderRadius: "7px",
    resize: "vertical",
    fontFamily: "inherit",
    color: "#243b35"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "5px"
  },
  characterCount: {
    color: "#89958e",
    fontSize: "11px"
  },
  saveButton: {
    background: "#123c3a",
    color: "#fffdf8",
    border: "none",
    borderRadius: "7px",
    padding: "11px 18px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default AdminDamageClaimManagement;
