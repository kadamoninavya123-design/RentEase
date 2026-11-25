
import { useState } from "react";

const API_URL = "http://localhost:5000/api/admin";

function DeliveryPickupManagement({ rentals = [], onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickupDates, setPickupDates] = useState({});

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

  function formatDate(date) {
    if (!date) return "Not scheduled";

    return new Date(date).toLocaleDateString("en-IN");
  }

  function orderNumber(id) {
    return id ? `#${id.slice(-6).toUpperCase()}` : "Unavailable";
  }

  async function updateDelivery(rental, nextStatus) {
    if (!["Scheduled", "Dispatched", "Delivered"].includes(nextStatus)) {
      return;
    }

    const confirmed = window.confirm(
      `Update delivery for ${orderNumber(rental._id)} to ${nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setLoadingId(rental._id);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_URL}/rentals/${rental._id}/delivery`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            deliveryStatus: nextStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update delivery.");
      }

      setMessage(data.message || "Delivery status updated successfully.");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Unable to update delivery.");
    } finally {
      setLoadingId(null);
    }
  }

  async function schedulePickup(rental) {
    const scheduledPickupDate = pickupDates[rental._id];

    if (!scheduledPickupDate) {
      setError("Please select a pickup date.");
      return;
    }

    if (new Date(scheduledPickupDate) < new Date(new Date().toDateString())) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    const confirmed = window.confirm(
      `Schedule pickup for ${orderNumber(rental._id)} on ${formatDate(scheduledPickupDate)}?`
    );

    if (!confirmed) return;

    try {
      setLoadingId(rental._id);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_URL}/rentals/${rental._id}/pickup`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            pickupStatus: "Scheduled",
            scheduledPickupDate
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to schedule pickup.");
      }

      setMessage(data.message || "Pickup scheduled successfully.");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Unable to schedule pickup.");
    } finally {
      setLoadingId(null);
    }
  }

  async function markPickedUp(rental) {
    const confirmed = window.confirm(
      `Confirm that the rental items for ${orderNumber(rental._id)} have been picked up?`
    );

    if (!confirmed) return;

    try {
      setLoadingId(rental._id);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_URL}/rentals/${rental._id}/pickup`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            pickupStatus: "Picked Up"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to record pickup.");
      }

      setMessage(data.message || "Pickup recorded successfully.");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Unable to record pickup.");
    } finally {
      setLoadingId(null);
    }
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
      padding: "9px 13px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    secondaryButton: {
      background: "#e9f0e9",
      color: "#123c3a",
      border: "1px solid #cbd9cd",
      borderRadius: "7px",
      padding: "9px 13px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    input: {
      padding: "9px",
      border: "1px solid #d8d1c5",
      borderRadius: "7px",
      background: "#fffdf8",
      color: "#243b35",
      fontSize: "13px"
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
      lineHeight: 1.8,
      fontSize: "14px"
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
    },
    badge: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      background: "#e9f0e9",
      color: "#123c3a"
    }
  };

  const visibleRentals = rentals.filter(
    (rental) => rental.status !== "Cancelled"
  );

  return (
    <section style={styles.panel}>
      <p style={styles.eyebrow}>LOGISTICS ADMINISTRATION</p>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <h2 style={{ margin: "10px 0" }}>
          Delivery & Pickup Management
        </h2>

        <button
          style={styles.secondaryButton}
          onClick={onRefresh}
          disabled={!onRefresh || loadingId !== null}
        >
          ↻ Refresh Orders
        </button>
      </div>

      <p style={{ color: "#64736d", lineHeight: 1.6 }}>
        Track dispatched and delivered rental orders, schedule customer
        pickups and record returned rental items.
      </p>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {visibleRentals.length === 0 && (
        <div style={styles.info}>
          No rental orders are available for delivery or pickup management.
        </div>
      )}

      {visibleRentals.map((rental) => {
        const busy = loadingId === rental._id;
        const deliveryStatus = rental.deliveryStatus || "Scheduled";
        const pickupStatus = rental.pickupStatus || "Not Scheduled";

        const nextDeliveryStatus = {
          Scheduled: "Dispatched",
          Dispatched: "Delivered"
        }[deliveryStatus];

        return (
          <article key={rental._id} style={styles.card}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <h3 style={{ margin: 0 }}>
                Order {orderNumber(rental._id)}
              </h3>

              <span style={styles.badge}>
                {rental.status}
              </span>
            </div>

            <div style={styles.info}>
              <strong>Customer:</strong>{" "}
              {rental.customer?.name || "Customer"}
              <br />

              <strong>Email:</strong>{" "}
              {rental.customer?.email || "Not available"}
              <br />

              <strong>Delivery Date:</strong>{" "}
              {formatDate(rental.deliveryDate)}
              <br />

              <strong>Products:</strong>
              {rental.items?.length ? (
                rental.items.map((item, index) => (
                  <div key={`${rental._id}-${index}`}>
                    {item.productName ||
                      item.product?.name ||
                      "Rental Product"}{" "}
                    × {item.quantity || 1}
                  </div>
                ))
              ) : (
                <div>Product details unavailable</div>
              )}
            </div>

            {/* DELIVERY */}
            <div style={{ marginTop: "20px" }}>
              <h4>Delivery Tracking</h4>

              <p>
                Delivery Status:{" "}
                <strong>{deliveryStatus}</strong>
              </p>

              <p>
                Actual Delivery:{" "}
                {formatDate(rental.actualDeliveryDate)}
              </p>

              {nextDeliveryStatus && (
                <button
                  style={styles.button}
                  disabled={busy}
                  onClick={() =>
                    updateDelivery(rental, nextDeliveryStatus)
                  }
                >
                  {busy
                    ? "Updating..."
                    : `Mark ${nextDeliveryStatus}`}
                </button>
              )}

              {!nextDeliveryStatus && (
                <span style={styles.badge}>
                  Delivery Complete
                </span>
              )}
            </div>

            {/* PICKUP */}
            <div style={{
              marginTop: "22px",
              paddingTop: "18px",
              borderTop: "1px solid #e7dfd1"
            }}>
              <h4>Pickup Management</h4>

              <p>
                Pickup Status:{" "}
                <strong>{pickupStatus}</strong>
              </p>

              <p>
                Scheduled Pickup:{" "}
                {formatDate(rental.scheduledPickupDate)}
              </p>

              <p>
                Actual Pickup:{" "}
                {formatDate(rental.actualPickupDate)}
              </p>

              {deliveryStatus === "Delivered" &&
                pickupStatus === "Not Scheduled" && (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <input
                      type="date"
                      style={styles.input}
                      min={new Date().toISOString().split("T")[0]}
                      value={pickupDates[rental._id] || ""}
                      onChange={(event) =>
                        setPickupDates((previous) => ({
                          ...previous,
                          [rental._id]: event.target.value
                        }))
                      }
                    />

                    <button
                      style={styles.button}
                      disabled={busy}
                      onClick={() => schedulePickup(rental)}
                    >
                      {busy ? "Saving..." : "Schedule Pickup"}
                    </button>
                  </div>
                )}

              {pickupStatus === "Scheduled" && (
                <button
                  style={styles.button}
                  disabled={busy}
                  onClick={() => markPickedUp(rental)}
                >
                  {busy ? "Updating..." : "Mark Picked Up"}
                </button>
              )}

              {pickupStatus === "Picked Up" && (
                <span style={styles.badge}>
                  Pickup Complete
                </span>
              )}

              {deliveryStatus !== "Delivered" &&
                pickupStatus === "Not Scheduled" && (
                  <p style={{ color: "#64736d", fontSize: "13px" }}>
                    Pickup can be scheduled after delivery is completed.
                  </p>
                )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default DeliveryPickupManagement;
