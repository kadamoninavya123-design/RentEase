
import { useEffect, useState } from "react";
import {
  createMaintenanceRequest,
  getMyMaintenanceRequests
} from "../../services/maintenanceService";

function MaintenanceSupport({ rentals }) {
  const [requests, setRequests] = useState([]);
  const [rentalId, setRentalId] = useState("");
  const [productId, setProductId] = useState("");
  const [issueType, setIssueType] = useState("Product Not Working");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeRentals = rentals.filter(
    (rental) => rental.status === "Active"
  );

  const selectedRental = activeRentals.find(
    (rental) => rental._id === rentalId
  );

  const rentalItems = selectedRental?.items || [];

  // Fetch customer's maintenance requests
  async function loadRequests() {
    try {
      setError("");
      const data = await getMyMaintenanceRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Unable to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // Submit a new maintenance request
  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!rentalId || !productId) {
      setError("Please select your rental order and product.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await createMaintenanceRequest({
        rentalId,
        productId,
        issueType,
        description: description.trim()
      });

      setNotice(
        result.message || "Maintenance request submitted successfully."
      );

      setRentalId("");
      setProductId("");
      setIssueType("Product Not Working");
      setDescription("");

      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  return (
    <section className="maintenance-section" id="maintenance">
      <div className="maintenance-heading">
        <p className="eyebrow">WE ARE HERE TO HELP</p>
        <h2>Maintenance Support</h2>
        <p>
          Report an issue with your rented furniture or appliances
          and track its resolution.
        </p>
      </div>

      {notice && (
        <p className="maintenance-success" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="maintenance-error" role="alert">
          {error}
        </p>
      )}

      <div className="maintenance-form-card">
        <h3>Submit a maintenance request</h3>

        {activeRentals.length === 0 ? (
          <p>
            You don't have any active rentals. Maintenance requests
            can be submitted for products in active rental orders.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="maintenance-field">
              <label htmlFor="maintenanceRental">
                Select rental order
              </label>

              <select
                id="maintenanceRental"
                value={rentalId}
                onChange={(event) => {
                  setRentalId(event.target.value);
                  setProductId("");
                }}
                required
              >
                <option value="">Choose a rental order</option>

                {activeRentals.map((rental) => (
                  <option key={rental._id} value={rental._id}>
                    Order #{rental._id.slice(-6).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="maintenance-field">
              <label htmlFor="maintenanceProduct">
                Select product
              </label>

              <select
                id="maintenanceProduct"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
                disabled={!selectedRental}
              >
                <option value="">Choose a product</option>

                {rentalItems.map((item, index) => (
                  <option
                    key={`${item.product}-${index}`}
                    value={
                      typeof item.product === "object"
                        ? item.product._id
                        : item.product
                    }
                  >
                    {item.productName}
                  </option>
                ))}
              </select>
            </div>

            <div className="maintenance-field">
              <label htmlFor="maintenanceIssue">
                Issue type
              </label>

              <select
                id="maintenanceIssue"
                value={issueType}
                onChange={(event) => setIssueType(event.target.value)}
                required
              >
                <option value="Product Not Working">
                  Product Not Working
                </option>
                <option value="Physical Damage">
                  Physical Damage
                </option>
                <option value="Repair Required">
                  Repair Required
                </option>
                <option value="Installation Issue">
                  Installation Issue
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="maintenance-field">
              <label htmlFor="maintenanceDescription">
                Describe the issue
              </label>

              <textarea
                id="maintenanceDescription"
                rows="5"
                minLength="10"
                maxLength="1000"
                placeholder="Explain the problem with your rented product..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />

              <small>{description.length}/1000 characters</small>
            </div>

            <button
              type="submit"
              className="details-add-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting request..."
                : "Submit Maintenance Request"}
            </button>
          </form>
        )}
      </div>

      <div className="maintenance-history">
        <h3>Your maintenance requests</h3>

        {loading && <p>Loading your requests...</p>}

        {!loading && requests.length === 0 && (
          <p>You haven't submitted any maintenance requests yet.</p>
        )}

        {!loading &&
          requests.map((request) => (
            <article
              className="maintenance-request-card"
              key={request._id}
            >
              <div>
                <h4>{request.productName}</h4>
                <p>Issue: {request.issueType}</p>
                <p>{request.description}</p>
                <small>
                  Submitted: {formatDate(request.createdAt)}
                </small>
              </div>

              <span
                className={`maintenance-status status-${request.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {request.status}
              </span>

              {request.adminNotes && (
                <p className="maintenance-admin-notes">
                  <strong>Support update:</strong> {request.adminNotes}
                </p>
              )}

              {request.resolvedAt && (
                <small>
                  Resolved: {formatDate(request.resolvedAt)}
                </small>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}

export default MaintenanceSupport;
