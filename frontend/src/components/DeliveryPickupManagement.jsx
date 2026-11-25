
import { useState } from "react";

const API_URL = "http://localhost:5000/api/admin";

function DeliveryPickupManagement({ rentals = [], onRefresh }) {
  const [pickupDates, setPickupDates] = useState({});
  const [loadingId, setLoadingId] = useState("");
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

  const updateDelivery = async (rentalId, deliveryStatus) => {
    try {
      setLoadingId(rentalId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/rentals/${rentalId}/delivery`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ deliveryStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update delivery.");
      }

      setMessage("Delivery status updated successfully.");
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId("");
    }
  };

  const updatePickup = async (rentalId, pickupStatus) => {
    try {
      setLoadingId(rentalId);
      setError("");
      setMessage("");

      const body =
        pickupStatus === "Scheduled"
          ? {
              pickupStatus: "Scheduled",
              scheduledPickupDate: pickupDates[rentalId]
            }
          : { pickupStatus: "Picked Up" };

      if (
        pickupStatus === "Scheduled" &&
        !pickupDates[rentalId]
      ) {
        throw new Error("Please select a pickup date.");
      }

      const response = await fetch(
        `${API_URL}/rentals/${rentalId}/pickup`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update pickup.");
      }

      setMessage("Pickup status updated successfully.");
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId("");
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.headingRow}>
        <div>
          <p style={styles.eyebrow}>LOGISTICS ADMINISTRATION</p>
          <h2 style={styles.heading}>Delivery & Pickup Management</h2>
          <p style={styles.description}>
            Track deliveries, schedule pickups and record returned rental items.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={() => onRefresh?.()}
        >
          ↻ Refresh Orders
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}

      {rentals.length === 0 ? (
        <p style={styles.empty}>No rental orders available.</p>
      ) : (
        rentals.map((rental) => (
          <div key={rental._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.title}>
                  Order #{rental._id.slice(-6).toUpperCase()}
                </h3>
                <p style={styles.muted}>
                  Customer: {rental.customer?.name || "Customer"}
                </p>
                <p style={styles.muted}>
                  {rental.customer?.email || ""}
                </p>
              </div>

              <span style={styles.status}>
                {rental.status}
              </span>
            </div>

            <div style={styles.productList}>
              {rental.items?.map((item, index) => (
                <p key={index}>
                  {item.productName} — Qty: {item.quantity}
                </p>
              ))}
            </div>

            <div style={styles.infoGrid}>
              <div>
                <strong>Delivery date</strong>
                <p>
                  {rental.deliveryDate
                    ? new Date(rental.deliveryDate).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>

              <div>
                <strong>Delivery status</strong>
                <p>{rental.deliveryStatus || "Scheduled"}</p>
              </div>

              <div>
                <strong>Pickup date</strong>
                <p>
                  {rental.scheduledPickupDate
                    ? new Date(rental.scheduledPickupDate).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>

              <div>
                <strong>Pickup status</strong>
                <p>{rental.pickupStatus || "Not Scheduled"}</p>
              </div>
            </div>

            <div style={styles.actionArea}>
              <strong>Delivery Actions</strong>

              {rental.deliveryStatus === "Scheduled" && (
                <button
                  style={styles.button}
                  disabled={loadingId === rental._id}
                  onClick={() =>
                    updateDelivery(rental._id, "Dispatched")
                  }
                >
                  {loadingId === rental._id
                    ? "Updating..."
                    : "Mark Dispatched"}
                </button>
              )}

              {rental.deliveryStatus === "Dispatched" && (
                <button
                  style={styles.button}
                  disabled={loadingId === rental._id}
                  onClick={() =>
                    updateDelivery(rental._id, "Delivered")
                  }
                >
                  {loadingId === rental._id
                    ? "Updating..."
                    : "Mark Delivered"}
                </button>
              )}

              {rental.deliveryStatus === "Delivered" && (
                <span style={styles.completed}>
                  Delivery complete
                </span>
              )}
            </div>

            {rental.deliveryStatus === "Delivered" && (
              <div style={styles.actionArea}>
                <strong>Pickup Actions</strong>

                {rental.pickupStatus === "Not Scheduled" && (
                  <div style={styles.pickupRow}>
                    <input
                      type="date"
                      style={styles.input}
                      value={pickupDates[rental._id] || ""}
                      onChange={(e) =>
                        setPickupDates((previous) => ({
                          ...previous,
                          [rental._id]: e.target.value
                        }))
                      }
                    />

                    <button
                      style={styles.button}
                      disabled={loadingId === rental._id}
                      onClick={() =>
                        updatePickup(rental._id, "Scheduled")
                      }
                    >
                      Schedule Pickup
                    </button>
                  </div>
                )}

                {rental.pickupStatus === "Scheduled" && (
                  <button
                    style={styles.button}
                    disabled={loadingId === rental._id}
                    onClick={() =>
                      updatePickup(rental._id, "Picked Up")
                    }
                  >
                    {loadingId === rental._id
                      ? "Updating..."
                      : "Mark Picked Up"}
                  </button>
                )}

                {rental.pickupStatus === "Picked Up" && (
                  <span style={styles.completed}>
                    Pickup complete
                  </span>
                )}
              </div>
            )}
          </div>
        ))
      )}
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
    fontSize: "12px"
  },
  productList: {
    color: "#243b35",
    margin: "14px 0"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    padding: "14px",
    background: "#f8f6f0",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#52615a"
  },
  actionArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "17px"
  },
  pickupRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  input: {
    padding: "10px",
    border: "1px solid #d8d0c2",
    borderRadius: "7px"
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#123c3a",
    color: "#fffdf8",
    cursor: "pointer"
  },
  completed: {
    color: "#24734a",
    fontWeight: "600",
    fontSize: "13px"
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

export default DeliveryPickupManagement;
