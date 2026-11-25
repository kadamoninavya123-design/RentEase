
import { useEffect, useState } from "react";
import "./App.css";

import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import MaintenanceSupport from "./components/MaintenanceSupport";
import DamageClaimSupport from "./components/DamageClaimSupport";

import {
  createRentalOrder,
  getMyRentals,
  cancelRentalOrder
} from "../services/rentalService";

const API_URL = "http://localhost:5000/api/products";

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function App() {
  const [user, setUser] = useState(getSavedUser);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTenure, setSelectedTenure] = useState(3);

  // Checkout states
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Rental history states
  const [rentals, setRentals] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [cancellingRentalId, setCancellingRentalId] = useState(null);

  function handleLogin(userData) {
    setUser(userData);
    setCart([]);
    setNotice("");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setCart([]);
    setCategory("All");
    setSearch("");
    setNotice("");
    setSelectedProduct(null);
    setRentals([]);
    setDeliveryAddress("");
    setDeliveryDate("");
  }

  // Fetch products from backend
  async function loadProducts() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load rental products.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

      setProducts(data);

      setSelectedProduct((currentProduct) => {
        if (!currentProduct) return null;

        return (
          data.find(
            (product) => product._id === currentProduct._id
          ) || currentProduct
        );
      });

      return data;
    } catch (err) {
      console.error("Product fetch error:", err);
      throw err;
    }
  }

  // Fetch products when customer logs in
  useEffect(() => {
    if (!user || user.role !== "customer") {
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        await loadProducts();
      } catch {
        setError(
          "Could not load products. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [user]);

  // Fetch customer's rental history
  async function loadRentalHistory() {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data = await getMyRentals();
      setRentals(data.rentals || []);
    } catch (err) {
      console.error("Rental history error:", err);
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "customer") {
      loadRentalHistory();
    }
  }, [user]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === "All" || product.category === category;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Open product details
  function openProductDetails(product) {
    setSelectedProduct(product);
    setSelectedTenure(product.rentalTenures?.[0] || 3);
    setNotice("");
  }

  // Add product to cart
  function addToCart(product, tenure) {
    if (!product.available || product.stockQuantity <= 0) {
      setNotice("Sorry, this product is currently unavailable.");
      return;
    }

    const cartItem = {
      ...product,
      selectedTenure: tenure,
      cartId: `${product._id}-${Date.now()}-${Math.random()}`
    };

    setCart((current) => [...current, cartItem]);

    setNotice(
      `${product.name} (${tenure} months) added to your rental cart.`
    );

    setSelectedProduct(null);
  }

  // Remove product from cart
  function removeFromCart(cartId) {
    setCart((current) =>
      current.filter((item) => item.cartId !== cartId)
    );
  }

  // Calculate totals
  const monthlyTotal = cart.reduce(
    (total, item) => total + item.price,
    0
  );

  const depositTotal = cart.reduce(
    (total, item) => total + (item.securityDeposit || 0),
    0
  );

  const rentalTotal = cart.reduce(
    (total, item) =>
      total + item.price * item.selectedTenure,
    0
  );

  // Place rental order
  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setNotice("Please add products to your cart first.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setNotice("Please enter your delivery address.");
      return;
    }

    if (!deliveryDate) {
      setNotice("Please select your delivery date.");
      return;
    }

    try {
      setPlacingOrder(true);
      setNotice("");

      const orderData = {
        items: cart.map((item) => ({
          productId: item._id,
          rentalTenure: item.selectedTenure,
          quantity: 1
        })),
        deliveryAddress: deliveryAddress.trim(),
        deliveryDate
      };

      const result = await createRentalOrder(orderData);

      try {
        await loadProducts();
      } catch (refreshError) {
        console.error(
          "Unable to refresh product stock:",
          refreshError
        );
      }

      setCart([]);
      setDeliveryAddress("");
      setDeliveryDate("");

      setNotice(
        result.message || "Your rental order was placed successfully!"
      );

      await loadRentalHistory();

    } catch (err) {
      console.error("Checkout error:", err);
      setNotice(err.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  // Cancel a pending rental
  async function handleCancelRental(rentalId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this rental?"
    );

    if (!confirmed) return;

    try {
      setCancellingRentalId(rentalId);
      setNotice("");

      const result = await cancelRentalOrder(rentalId);

      setNotice(
        result.message || "Rental cancelled successfully."
      );

      await loadRentalHistory();
      await loadProducts();

    } catch (err) {
      console.error("Rental cancellation error:", err);
      setNotice(err.message || "Unable to cancel rental.");
    } finally {
      setCancellingRentalId(null);
    }
  }

  // Login page
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Admin Dashboard
  if (user.role === "admin") {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Customer dashboard
  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <a className="logo" href="#home">
          Rent<span>Ease</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#products">Explore Rentals</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#history">My Rentals</a>
          <a href="#maintenance">Maintenance Support</a>
          <a href="#damage-claims">Damage Claims</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a className="cart-button" href="#cart">
            Cart ({cart.length})
          </a>

          <button
            className="cart-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              LIVE BETTER. SPEND SMARTER.
            </p>

            <h1>
              Your home, your style.
              <br />
              <span>Rent with ease.</span>
            </h1>

            <p className="hero-description">
              Rent quality furniture and appliances at affordable
              monthly prices. Make every move feel like home.
            </p>

            <a className="primary-button" href="#products">
              Explore Rentals ↗
            </a>

            <div className="hero-stats">
              <div>
                <strong>Flexible</strong>
                <small>Rental plans</small>
              </div>

              <div>
                <strong>Convenient</strong>
                <small>Home delivery</small>
              </div>

              <div>
                <strong>Affordable</strong>
                <small>Monthly pricing</small>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="sun" />
            <div className="plant">🌿</div>

            <div className="room-label">
              A better way to furnish your home
            </div>

            <div className="room">
              <div className="picture">✳</div>
              <div className="lamp" />

              <div className="sofa">
                <div />
                <div />
                <div />
              </div>

              <div className="table" />
              <div className="rug" />
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="benefits">
          <div>
            <span>🚚</span>
            <div>
              <strong>Doorstep delivery</strong>
              <p>Convenience delivered to you.</p>
            </div>
          </div>

          <div>
            <span>📅</span>
            <div>
              <strong>Flexible durations</strong>
              <p>Rent for the time you need.</p>
            </div>
          </div>

          <div>
            <span>🛠️</span>
            <div>
              <strong>Maintenance support</strong>
              <p>Help when you need it.</p>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR FIT</p>
              <h2>Rent the essentials</h2>
              <p>
                Thoughtfully selected items for your everyday life.
              </p>
            </div>

            <input
              type="search"
              aria-label="Search products"
              placeholder="Search rentals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* CATEGORY FILTERS */}
          <div className="filters">
            {["All", "Furniture", "Appliances"].map((item) => (
              <button
                key={item}
                className={
                  category === item ? "filter active" : "filter"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}

          {loading && (
            <p className="empty-message">
              Loading rental products...
            </p>
          )}

          {error && (
            <div className="empty-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* PRODUCT DETAILS */}
              {selectedProduct && (
                <div className="product-details-panel">
                  <button
                    className="details-close"
                    onClick={() => setSelectedProduct(null)}
                  >
                    ✕ Close
                  </button>

                  <div className="details-content">
                    <div className="details-image">
                      {selectedProduct.imageUrl ? (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                        />
                      ) : (
                        <span>{selectedProduct.icon}</span>
                      )}
                    </div>

                    <div className="details-information">
                      <p className="eyebrow">
                        {selectedProduct.category}
                      </p>

                      <h2>{selectedProduct.name}</h2>

                      <p className="details-description">
                        {selectedProduct.description}
                      </p>

                      <div className="details-price">
                        <strong>
                          ₹{selectedProduct.price}
                        </strong>
                        <span> / month</span>
                      </div>

                      <div className="details-facts">
                        <div>
                          <span>Security deposit</span>
                          <strong>
                            ₹{selectedProduct.securityDeposit || 0}
                          </strong>
                        </div>

                        <div>
                          <span>Available stock</span>
                          <strong>
                            {selectedProduct.stockQuantity}
                          </strong>
                        </div>
                      </div>

                      <h3>Select rental duration</h3>

                      <div className="tenure-options">
                        {(selectedProduct.rentalTenures || [3, 6, 12]).map(
                          (months) => (
                            <button
                              key={months}
                              type="button"
                              className={
                                selectedTenure === months
                                  ? "tenure-option selected"
                                  : "tenure-option"
                              }
                              onClick={() => setSelectedTenure(months)}
                            >
                              {months} months
                            </button>
                          )
                        )}
                      </div>

                      <div className="rental-summary">
                        <div>
                          Monthly rent
                          <strong>
                            ₹{selectedProduct.price}
                          </strong>
                        </div>

                        <div>
                          Rental duration
                          <strong>{selectedTenure} months</strong>
                        </div>

                        <div>
                          Total rent for selected duration
                          <strong>
                            ₹{selectedProduct.price * selectedTenure}
                          </strong>
                        </div>

                        <div>
                          Security deposit
                          <strong>
                            ₹{selectedProduct.securityDeposit || 0}
                          </strong>
                        </div>
                      </div>

                      <button
                        className="details-add-button"
                        disabled={
                          !selectedProduct.available ||
                          selectedProduct.stockQuantity <= 0
                        }
                        onClick={() =>
                          addToCart(selectedProduct, selectedTenure)
                        }
                      >
                        {!selectedProduct.available ||
                        selectedProduct.stockQuantity <= 0
                          ? "Currently Unavailable"
                          : "Add to Rental Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCT GRID */}
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const productIndex =
                    products.findIndex(
                      (item) => item._id === product._id
                    ) + 1;

                  return (
                    <article
                      className="product-card"
                      key={product._id}
                    >
                      <div className={`product-art art-${productIndex}`}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                          />
                        ) : (
                          <span>{product.icon}</span>
                        )}

                        <small>{product.category}</small>
                      </div>

                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>

                        <div className="product-bottom">
                          <div>
                            <strong>₹{product.price}</strong>
                            <small> / month</small>
                          </div>

                          <button
                            onClick={() => openProductDetails(product)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <p className="empty-message">
                  No rentals found. Try a different search.
                </p>
              )}
            </>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how-it-works">
          <p className="eyebrow">SIMPLE BY DESIGN</p>
          <h2>Your home in three easy steps</h2>

          <div className="steps">
            <article>
              <span>01</span>
              <h3>Choose your items</h3>
              <p>
                Browse furniture and appliances that suit your needs.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Select your plan</h3>
              <p>
                Review monthly prices and choose your rental duration.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Enjoy your home</h3>
              <p>
                Arrange delivery and enjoy your rented essentials.
              </p>
            </article>
          </div>
        </section>

        {/* CART AND CHECKOUT */}
        <section className="cart-section" id="cart">
          <p className="eyebrow">YOUR SELECTION</p>
          <h2>Your rental cart ({cart.length})</h2>

          {cart.length === 0 ? (
            <p>
              Your cart is empty. Explore rentals to add your first item.
            </p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-row" key={item.cartId}>
                  <span>
                    {item.icon} {item.name}
                    <small className="cart-tenure">
                      {item.selectedTenure} months rental
                    </small>
                  </span>

                  <strong>₹{item.price}/month</strong>

                  <span>
                    Deposit: ₹{item.securityDeposit || 0}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.cartId)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <h3>Monthly rental total: ₹{monthlyTotal}</h3>
                <h3>Security deposit total: ₹{depositTotal}</h3>
                <h3>
                  Total rent for selected durations: ₹{rentalTotal}
                </h3>

                <p>
                  Security deposits are shown separately from rental charges.
                </p>
              </div>

              {/* CHECKOUT FORM */}
              <div className="checkout-section">
                <p className="eyebrow">COMPLETE YOUR ORDER</p>
                <h2>Delivery details</h2>

                <form onSubmit={handlePlaceOrder}>
                  <div className="checkout-field">
                    <label htmlFor="deliveryAddress">
                      Delivery address
                    </label>

                    <textarea
                      id="deliveryAddress"
                      rows="4"
                      placeholder="Enter your complete delivery address"
                      value={deliveryAddress}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="deliveryDate">
                      Preferred delivery date
                    </label>

                    <input
                      id="deliveryDate"
                      type="date"
                      min={getTomorrowDate()}
                      value={deliveryDate}
                      onChange={(event) =>
                        setDeliveryDate(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="checkout-summary">
                    <h3>Order summary</h3>
                    <p>Monthly rent: ₹{monthlyTotal}</p>
                    <p>Security deposit: ₹{depositTotal}</p>
                    <p>Rent for selected duration: ₹{rentalTotal}</p>
                    <p>
                      <strong>
                        Total including deposit: ₹{rentalTotal + depositTotal}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="details-add-button"
                    disabled={placingOrder || cart.length === 0}
                  >
                    {placingOrder
                      ? "Placing your order..."
                      : "Place Rental Order"}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {/* RENTAL HISTORY */}
        <section className="cart-section" id="history">
          <p className="eyebrow">YOUR ORDERS</p>
          <h2>My Rental History</h2>

          {historyLoading && (
            <p>Loading your rental history...</p>
          )}

          {historyError && (
            <p className="notice">{historyError}</p>
          )}

          {!historyLoading && rentals.length === 0 && (
            <p>
              You haven't placed any rental orders yet.
            </p>
          )}

          {rentals.map((rental) => (
            <article
              className="rental-history-card"
              key={rental._id}
            >
              <h3>
                Rental Order #{rental._id.slice(-6).toUpperCase()}
              </h3>

              <p>
                Status: <strong>{rental.status}</strong>
              </p>

              <p>
                Delivery address: {rental.deliveryAddress}
              </p>

              <p>
                Delivery date:{" "}
                {new Date(rental.deliveryDate).toLocaleDateString("en-IN")}
              </p>

              <div>
                <strong>Products:</strong>

                {rental.items.map((item, index) => (
                  <p key={`${rental._id}-${index}`}>
                    {item.productName} — {item.rentalTenure} months
                    — ₹{item.monthlyPrice}/month
                    — Quantity: {item.quantity}
                  </p>
                ))}
              </div>

              <p>Monthly total: ₹{rental.monthlyTotal}</p>
              <p>Security deposit: ₹{rental.depositTotal}</p>
              <p>Rental total: ₹{rental.rentalTotal}</p>

              {rental.status === "Pending" && (
                <button
                  className="cart-button"
                  disabled={cancellingRentalId === rental._id}
                  onClick={() => handleCancelRental(rental._id)}
                >
                  {cancellingRentalId === rental._id
                    ? "Cancelling..."
                    : "Cancel Rental"}
                </button>
              )}
            </article>
          ))}
        </section>

        {/* MAINTENANCE SUPPORT */}
        <MaintenanceSupport rentals={rentals} />

        {/* DAMAGE AND DISPUTE CLAIMS */}
        <DamageClaimSupport rentals={rentals} />

      </main>

      {/* FOOTER */}
      <footer>
        <a className="logo" href="#home">
          Rent<span>Ease</span>
        </a>

        <p>Make room for what matters.</p>

        <small>© 2026 RentEase | Internship project</small>
      </footer>

    </div>
  );
}

export default App;
