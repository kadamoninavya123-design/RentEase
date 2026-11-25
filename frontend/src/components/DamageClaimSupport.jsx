
import { useEffect, useState } from "react";
import {
  createDamageClaim,
  getMyDamageClaims
} from "../../services/damageClaimService";

function DamageClaimSupport({ rentals = [] }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rentalId, setRentalId] = useState("");
  const [productId, setProductId] = useState("");
  const [claimType, setClaimType] = useState("Product Damage");
  const [description, setDescription] = useState("");

  const activeRentals = rentals.filter(
    (rental) => rental.status === "Active"
  );

  const selectedRental = activeRentals.find(
    (rental) => rental._id === rentalId
  );

  const rentalItems = selectedRental?.items || [];

  async function loadClaims() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyDamageClaims();
      setClaims(data.claims || []);
    } catch (err) {
      setError(err.message || "Unable to load damage claims.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  function handleRentalChange(event) {
    setRentalId(event.target.value);
    setProductId("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!rentalId || !productId || !description.trim()) {
      setError("Please complete all claim details.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const result = await createDamageClaim({
        rentalId,
        productId,
        claimType,
        description: description.trim()
      });

      setMessage(
        result.message || "Damage claim submitted successfully."
      );

      setRentalId("");
      setProductId("");
      setClaimType("Product Damage");
      setDescription("");

      await loadClaims();
    } catch (err) {
      setError(err.message || "Unable to submit damage claim.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="cart-section" id="damage-claims">
      <p className="eyebrow">CUSTOMER SUPPORT</p>
      <h2>Damage & Dispute Claims</h2>

      <p>
        Report damaged products, missing parts, or delivery-related
        issues with your active rental.
      </p>

      {message && (
        <p className="notice" role="status">{message}</p>
      )}

      {error && (
        <p className="notice" role="alert">{error}</p>
      )}

      <div className="checkout-section">
        <h3>Submit a damage claim</h3>

        {activeRentals.length === 0 ? (
          <p>You need an active rental to submit a damage claim.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="checkout-field">
              <label htmlFor="claimRental">Select rental order</label>
              <select
                id="claimRental"
                value={rentalId}
                onChange={handleRentalChange}
                required
              >
                <option value="">Choose an active rental</option>
                {activeRentals.map((rental) => (
                  <option key={rental._id} value={rental._id}>
                    Order #{rental._id.slice(-6).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="checkout-field">
              <label htmlFor="claimProduct">Select product</label>
              <select
                id="claimProduct"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
                disabled={!rentalId}
              >
                <option value="">Choose a product</option>
                {rentalItems.map((item, index) => {
                  const id =
                    typeof item.product === "object"
                      ? item.product?._id
                      : item.product;

                  return (
                    <option
                      key={`${id || index}`}
                      value={id || ""}
                      disabled={!id}
                    >
                      {item.productName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="checkout-field">
              <label htmlFor="claimType">Claim type</label>
              <select
                id="claimType"
                value={claimType}
                onChange={(event) => setClaimType(event.target.value)}
                required
              >
                <option value="Product Damage">Product Damage</option>
                <option value="Missing Parts">Missing Parts</option>
                <option value="Delivery Damage">Delivery Damage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="checkout-field">
              <label htmlFor="claimDescription">
                Describe the issue
              </label>
              <textarea
                id="claimDescription"
                rows="4"
                minLength="10"
                maxLength="1000"
                placeholder="Describe the damage or issue..."
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
              {submitting ? "Submitting..." : "Submit Damage Claim"}
            </button>
          </form>
        )}
      </div>

      <div className="checkout-section">
        <h3>My Damage Claims</h3>

        {loading && <p>Loading your claims...</p>}

        {!loading && claims.length === 0 && (
          <p>You haven't submitted any damage claims.</p>
        )}

        {!loading && claims.map((claim) => (
          <article className="rental-history-card" key={claim._id}>
            <h4>{claim.productName}</h4>
            <p>Claim type: {claim.claimType}</p>
            <p>Description: {claim.description}</p>
            <p>Status: <strong>{claim.status}</strong></p>

            {claim.adminNotes && (
              <p>Admin response: {claim.adminNotes}</p>
            )}

            <small>
              Submitted:{" "}
              {new Date(claim.createdAt).toLocaleDateString("en-IN")}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DamageClaimSupport;
