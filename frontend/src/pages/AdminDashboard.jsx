
import { useEffect, useState } from "react";
import DeliveryPickupManagement from "./DeliveryPickupManagement";
import AdminMaintenanceManagement from "./AdminMaintenanceManagement";
import AdminDamageClaimManagement from "./AdminDamageClaimManagement";
import AdminReturnManagement from "../components/AdminReturnManagement";

const API_URL = "https://rent-ease-nine-coral.vercel.app/api/admin";

const emptyProduct = {
  name: "",
  category: "Furniture",
  price: "",
  securityDeposit: "",
  rentalTenures: [3, 6, 12],
  icon: "🏠",
  imageUrl: "",
  description: "",
  stockQuantity: "1"
};

const rentalStatuses = [
  "Pending",
  "Confirmed",
  "Delivered",
  "Active",
  "Completed"
];

function AdminDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rentals, setRentals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [rentalLoading, setRentalLoading] = useState(true);

  const [error, setError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [productError, setProductError] = useState("");
  const [rentalError, setRentalError] = useState("");

  const [productMessage, setProductMessage] = useState("");
  const [rentalMessage, setRentalMessage] = useState("");

  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingRentalId, setUpdatingRentalId] = useState(null);

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

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/dashboard`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard.");
      }

      setDashboard(data.dashboard);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      setCustomerLoading(true);
      setCustomerError("");

      const response = await fetch(`${API_URL}/customers`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load customers.");
      }

      setCustomers(data.customers || []);
    } catch (err) {
      setCustomerError(err.message || "Unable to load customer details.");
    } finally {
      setCustomerLoading(false);
    }
  }

  async function loadProducts() {
    try {
      setProductLoading(true);
      setProductError("");

      const response = await fetch(`${API_URL}/products`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(data.products || []);
    } catch (err) {
      setProductError(err.message || "Unable to load products.");
    } finally {
      setProductLoading(false);
    }
  }

  async function loadRentals() {
    try {
      setRentalLoading(true);
      setRentalError("");

      const response = await fetch(`${API_URL}/rentals`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load rental orders.");
      }

      setRentals(data.rentals || []);
    } catch (err) {
      setRentalError(err.message || "Unable to load rental orders.");
    } finally {
      setRentalLoading(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([
      loadDashboard(),
      loadCustomers(),
      loadProducts(),
      loadRentals()
    ]);
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleTenureChange(tenure) {
    setForm((previous) => {
      const selected = previous.rentalTenures.includes(tenure);

      return {
        ...previous,
        rentalTenures: selected
          ? previous.rentalTenures.filter((item) => item !== tenure)
          : [...previous.rentalTenures, tenure].sort((a, b) => a - b)
      };
    });
  }

  function resetProductForm() {
    setForm(emptyProduct);
    setEditingId(null);
    setProductMessage("");
  }

  function editProduct(product) {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      category: product.category || "Furniture",
      price: String(product.price ?? ""),
      securityDeposit: String(product.securityDeposit ?? 0),
      rentalTenures: product.rentalTenures || [3, 6, 12],
      icon: product.icon || "🏠",
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      stockQuantity: String(product.stockQuantity ?? 0)
    });

    setProductMessage("");

    document.getElementById("product-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    setProductMessage("");

    if (form.rentalTenures.length === 0) {
      setProductMessage("Please select at least one rental tenure.");
      return;
    }

    if (!form.name.trim() || !form.description.trim()) {
      setProductMessage("Please enter the product name and description.");
      return;
    }

    const price = Number(form.price);
    const securityDeposit = Number(form.securityDeposit);
    const stockQuantity = Number(form.stockQuantity);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(securityDeposit) ||
      securityDeposit < 0 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setProductMessage(
        "Enter valid rent, deposit and whole-number stock values."
      );
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      price,
      securityDeposit,
      rentalTenures: form.rentalTenures,
      icon: form.icon.trim() || "🏠",
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
      stockQuantity
    };

    try {
      setSavingProduct(true);

      const url = editingId
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save product.");
      }

      setProductMessage(
        editingId
          ? "Product updated successfully!"
          : "New product added successfully!"
      );

      resetProductForm();

      await Promise.all([loadProducts(), loadDashboard()]);
    } catch (err) {
      setProductMessage(err.message || "Unable to save product.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function toggleAvailability(product) {
    try {
      setProductMessage("");

      const response = await fetch(
        `${API_URL}/products/${product._id}/availability`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            available: !product.available
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update availability.");
      }

      setProductMessage(data.message);
      await loadProducts();
    } catch (err) {
      setProductMessage(err.message || "Unable to update availability.");
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setProductMessage("");

      const response = await fetch(
        `${API_URL}/products/${product._id}`,
        {
          method: "DELETE",
          headers: getHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove product.");
      }

      setProductMessage(data.message);

      if (editingId === product._id) {
        resetProductForm();
      }

      await Promise.all([loadProducts(), loadDashboard()]);
    } catch (err) {
      setProductMessage(err.message || "Unable to remove product.");
    }
  }

  async function updateRentalStatus(rental, nextStatus) {
    const currentIndex = rentalStatuses.indexOf(rental.status);

    if (
      currentIndex < 0 ||
      rentalStatuses[currentIndex + 1] !== nextStatus
    ) {
      setRentalMessage("This status transition is not allowed.");
      return;
    }

    const confirmed = window.confirm(
      `Update rental #${rental._id.slice(-6).toUpperCase()} from ${rental.status} to ${nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingRentalId(rental._id);
      setRentalMessage("");

      const response = await fetch(
        `${API_URL}/rentals/${rental._id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ status: nextStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update rental status.");
      }

      setRentalMessage(
        data.message || "Rental status updated successfully."
      );

      await Promise.all([
        loadRentals(),
        loadDashboard()
      ]);
    } catch (err) {
      setRentalMessage(err.message || "Unable to update rental status.");
    } finally {
      setUpdatingRentalId(null);
    }
  }

  function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function formatDate(date) {
    return date
      ? new Date(date).toLocaleDateString("en-IN")
      : "Not available";
  }

  function getStatusStyle(status) {
    const colors = {
      Pending: { color: "#9a6414", background: "#fff2d5" },
      Confirmed: { color: "#245c91", background: "#e5f0fc" },
      Delivered: { color: "#65469b", background: "#eee7fa" },
      Active: { color: "#246b45", background: "#e5f3e9" },
      Completed: { color: "#246b45", background: "#e5f3e9" },
      Cancelled: { color: "#a83232", background: "#f8e8e4" }
    };

    return {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      ...colors[status]
    };
  }

  const cards = [
    {
      title: "Total Customers",
      value: dashboard?.totalCustomers ?? 0,
      icon: "👥"
    },
    {
      title: "Total Products",
      value: dashboard?.totalProducts ?? 0,
      icon: "🛋️"
    },
    {
      title: "Total Rentals",
      value: dashboard?.totalRentals ?? 0,
      icon: "📦"
    },
    {
      title: "Pending Rentals",
      value: dashboard?.pendingRentals ?? 0,
      icon: "⏳"
    },
    {
      title: "Active Rentals",
      value: dashboard?.activeRentals ?? 0,
      icon: "🏠"
    },
    {
      title: "Completed Rentals",
      value: dashboard?.completedRentals ?? 0,
      icon: "✅"
    },
    {
      title: "Cancelled Rentals",
      value: dashboard?.cancelledRentals ?? 0,
      icon: "↩️"
    }
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f5f0e6",
      color: "#243b35",
      fontFamily: "Arial, sans-serif"
    },
    header: {
      background: "#123c3a",
      color: "#fffdf8",
      padding: "22px 6%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "15px"
    },
    logo: {
      fontSize: "25px",
      fontWeight: "bold"
    },
    accent: {
      color: "#e5b28f"
    },
    button: {
      background: "#c87952",
      color: "white",
      border: "none",
      borderRadius: "7px",
      padding: "11px 18px",
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
    dangerButton: {
      background: "#f8e8e4",
      color: "#a83232",
      border: "1px solid #edc8c0",
      borderRadius: "7px",
      padding: "9px 12px",
      cursor: "pointer",
      fontWeight: "bold"
    },
    content: {
      maxWidth: "1150px",
      margin: "auto",
      padding: "45px 22px"
    },
    eyebrow: {
      color: "#c87952",
      fontSize: "12px",
      fontWeight: "bold",
      letterSpacing: "2px"
    },
    heading: {
      fontSize: "30px",
      margin: "10px 0"
    },
    subtitle: {
      color: "#64736d",
      marginBottom: "30px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "18px"
    },
    card: {
      background: "#fffdf8",
      borderRadius: "12px",
      padding: "23px",
      border: "1px solid #e7dfd1",
      boxShadow: "0 5px 16px rgba(36, 59, 53, 0.05)"
    },
    cardIcon: {
      fontSize: "27px"
    },
    cardTitle: {
      color: "#64736d",
      fontSize: "14px",
      marginTop: "15px"
    },
    cardValue: {
      fontSize: "30px",
      fontWeight: "bold",
      marginTop: "8px"
    },
    panel: {
      background: "#fffdf8",
      borderRadius: "12px",
      padding: "25px",
      marginTop: "25px",
      border: "1px solid #e7dfd1"
    },
    value: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#123c3a",
      marginTop: "12px"
    },
    message: {
      background: "#fffdf8",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "20px"
    },
    tableWrapper: {
      overflowX: "auto",
      marginTop: "20px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "550px"
    },
    th: {
      textAlign: "left",
      padding: "15px",
      background: "#123c3a",
      color: "#fffdf8",
      fontSize: "13px"
    },
    td: {
      padding: "15px",
      borderBottom: "1px solid #e7dfd1",
      fontSize: "14px",
      verticalAlign: "top"
    },
    empty: {
      textAlign: "center",
      padding: "25px",
      color: "#64736d"
    },
    customerCount: {
      background: "#e9f0e9",
      color: "#123c3a",
      padding: "7px 12px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: "bold"
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "18px",
      marginTop: "20px"
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    input: {
      padding: "12px",
      border: "1px solid #d8d1c5",
      borderRadius: "7px",
      background: "#fffdf8",
      color: "#243b35",
      fontSize: "14px",
      width: "100%",
      boxSizing: "border-box"
    },
    textarea: {
      padding: "12px",
      border: "1px solid #d8d1c5",
      borderRadius: "7px",
      background: "#fffdf8",
      color: "#243b35",
      fontSize: "14px",
      width: "100%",
      minHeight: "90px",
      resize: "vertical",
      boxSizing: "border-box"
    },
    label: {
      fontSize: "13px",
      fontWeight: "bold",
      color: "#40564d"
    },
    productImage: {
      width: "65px",
      height: "55px",
      objectFit: "cover",
      borderRadius: "7px",
      background: "#f5f0e6"
    },
    actionGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: "7px"
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logo}>
          Rent<span style={styles.accent}>Ease</span>
          <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "5px" }}>
            ADMINISTRATION
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span>Welcome, {user?.name || "Administrator"}</span>
          <button style={styles.button} onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.content}>
        <p style={styles.eyebrow}>MANAGEMENT OVERVIEW</p>
        <h1 style={styles.heading}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          Monitor customers, products and rental activity in RentEase.
        </p>

        <button
          style={styles.button}
          onClick={refreshDashboard}
          disabled={
            loading ||
            customerLoading ||
            productLoading ||
            rentalLoading
          }
        >
          {loading || customerLoading || productLoading || rentalLoading
            ? "Loading..."
            : "↻ Refresh Dashboard"}
        </button>

        {loading && (
          <div style={styles.message}>
            Loading dashboard statistics...
          </div>
        )}

        {error && (
          <div style={{ ...styles.message, color: "#a83232" }}>
            <p>{error}</p>
            <button style={styles.button} onClick={loadDashboard}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && dashboard && (
          <>
            <h2 style={{ margin: "35px 0 18px" }}>
              Platform Statistics
            </h2>

            <div style={styles.grid}>
              {cards.map((card) => (
                <div style={styles.card} key={card.title}>
                  <div style={styles.cardIcon}>{card.icon}</div>
                  <div style={styles.cardTitle}>{card.title}</div>
                  <div style={styles.cardValue}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={styles.panel}>
              <p style={styles.eyebrow}>RENTAL VALUE</p>
              <h2>Active Monthly Rental Value</h2>
              <p style={{ color: "#64736d" }}>
                Combined monthly rental amount of confirmed, delivered
                and active rental orders.
              </p>
              <div style={styles.value}>
                {formatCurrency(dashboard.monthlyRentalRevenue)}
              </div>
            </div>
          </>
        )}

        {/* RENTAL ORDER MANAGEMENT */}
        <section style={styles.panel}>
          <p style={styles.eyebrow}>ORDER ADMINISTRATION</p>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <h2 style={{ margin: "10px 0" }}>Rental Order Management</h2>

            <span style={styles.customerCount}>
              {rentals.length} Orders
            </span>
          </div>

          <p style={{ color: "#64736d" }}>
            Review customer rental orders, delivery information and payment
            summaries. Update each order as it moves through the rental process.
          </p>

          <button
            style={styles.secondaryButton}
            onClick={loadRentals}
            disabled={rentalLoading}
          >
            {rentalLoading ? "Loading..." : "↻ Refresh Orders"}
          </button>

          {rentalMessage && (
            <div style={{
              ...styles.message,
              color: rentalMessage.toLowerCase().includes("success")
                ? "#246b45"
                : "#a83232"
            }}>
              {rentalMessage}
            </div>
          )}

          {rentalLoading && (
            <div style={styles.message}>Loading rental orders...</div>
          )}

          {rentalError && (
            <div style={{ ...styles.message, color: "#a83232" }}>
              <p>{rentalError}</p>
              <button style={styles.button} onClick={loadRentals}>
                Try Again
              </button>
            </div>
          )}

          {!rentalLoading && !rentalError && (
            <div style={styles.tableWrapper}>
              <table style={{ ...styles.table, minWidth: "1100px" }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Products</th>
                    <th style={styles.th}>Delivery Details</th>
                    <th style={styles.th}>Rental Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Update Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rentals.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.empty}>
                        No rental orders have been placed yet.
                      </td>
                    </tr>
                  ) : (
                    rentals.map((rental) => {
                      const currentIndex = rentalStatuses.indexOf(rental.status);
                      const nextStatus =
                        currentIndex >= 0
                          ? rentalStatuses[currentIndex + 1]
                          : null;

                      const isCancelled = rental.status === "Cancelled";

                      return (
                        <tr key={rental._id}>
                          <td style={styles.td}>
                            <strong>
                              #{rental._id.slice(-6).toUpperCase()}
                            </strong>
                            <div style={{
                              fontSize: "12px",
                              color: "#64736d",
                              marginTop: "6px"
                            }}>
                              {formatDate(rental.createdAt)}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <strong>
                              {rental.customer?.name || "Customer"}
                            </strong>
                            <div style={{
                              fontSize: "12px",
                              color: "#64736d",
                              marginTop: "6px"
                            }}>
                              {rental.customer?.email || "Email unavailable"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            {rental.items?.map((item, index) => (
                              <div
                                key={`${rental._id}-${index}`}
                                style={{ marginBottom: "10px" }}
                              >
                                <strong>
                                  {item.product?.icon || "📦"}{" "}
                                  {item.product?.name ||
                                    item.productName ||
                                    "Product"}
                                </strong>
                                <div style={{
                                  fontSize: "12px",
                                  color: "#64736d",
                                  marginTop: "4px"
                                }}>
                                  Qty: {item.quantity} | {item.rentalTenure} months
                                </div>
                                <div style={{
                                  fontSize: "12px",
                                  color: "#64736d"
                                }}>
                                  {formatCurrency(item.monthlyPrice)}/month
                                </div>
                              </div>
                            ))}
                          </td>

                          <td style={styles.td}>
                            <div style={{ maxWidth: "210px" }}>
                              {rental.deliveryAddress || "Address unavailable"}
                            </div>
                            <div style={{
                              fontSize: "12px",
                              color: "#64736d",
                              marginTop: "8px"
                            }}>
                              Delivery: {formatDate(rental.deliveryDate)}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <div>
                              Monthly: <strong>{formatCurrency(rental.monthlyTotal)}</strong>
                            </div>
                            <div style={{ marginTop: "6px" }}>
                              Deposit: {formatCurrency(rental.depositTotal)}
                            </div>
                            <div style={{
                              marginTop: "6px",
                              color: "#123c3a",
                              fontWeight: "bold"
                            }}>
                              Total: {formatCurrency(rental.rentalTotal)}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span style={getStatusStyle(rental.status)}>
                              {rental.status}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {isCancelled ? (
                              <span style={{ color: "#a83232", fontSize: "12px" }}>
                                Cancelled by customer
                              </span>
                            ) : nextStatus ? (
                              <button
                                style={styles.secondaryButton}
                                disabled={updatingRentalId === rental._id}
                                onClick={() =>
                                  updateRentalStatus(rental, nextStatus)
                                }
                              >
                                {updatingRentalId === rental._id
                                  ? "Updating..."
                                  : `Mark ${nextStatus}`}
                              </button>
                            ) : (
                              <span style={{
                                color: "#246b45",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}>
                                Process completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DELIVERY AND PICKUP MANAGEMENT */}
        <DeliveryPickupManagement
          rentals={rentals}
          onRefresh={loadRentals}
        />

        {/* MAINTENANCE REQUEST MANAGEMENT */}
        <AdminMaintenanceManagement />

        {/* DAMAGE AND DISPUTE MANAGEMENT */}
        <AdminDamageClaimManagement />

        {/* RETURN INSPECTION MANAGEMENT */}
        <AdminReturnManagement />

        {/* CUSTOMER MANAGEMENT */}
        <section style={styles.panel}>
          <p style={styles.eyebrow}>USER ADMINISTRATION</p>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <h2 style={{ margin: "10px 0" }}>Customer Management</h2>

            <span style={styles.customerCount}>
              {customers.length} Customers
            </span>
          </div>

          <p style={{ color: "#64736d" }}>
            View registered RentEase customers and their account details.
          </p>

          {customerLoading && (
            <div style={styles.message}>
              Loading customer records...
            </div>
          )}

          {customerError && (
            <div style={{ ...styles.message, color: "#a83232" }}>
              <p>{customerError}</p>
              <button style={styles.button} onClick={loadCustomers}>
                Try Again
              </button>
            </div>
          )}

          {!customerLoading && !customerError && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Customer Name</th>
                    <th style={styles.th}>Email Address</th>
                    <th style={styles.th}>Account Type</th>
                    <th style={styles.th}>Registered On</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={styles.empty}>
                        No customers have registered yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer._id}>
                        <td style={styles.td}>
                          <strong>{customer.name}</strong>
                        </td>
                        <td style={styles.td}>{customer.email}</td>
                        <td style={styles.td}>Customer</td>
                        <td style={styles.td}>
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString("en-IN")
                            : "Not available"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PRODUCT MANAGEMENT */}
        <section style={styles.panel}>
          <p style={styles.eyebrow}>INVENTORY ADMINISTRATION</p>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <h2 style={{ margin: "10px 0" }}>Product Management</h2>

            <span style={styles.customerCount}>
              {products.length} Products
            </span>
          </div>

          <p style={{ color: "#64736d" }}>
            Add products and manage monthly rent, deposits, rental plans and inventory.
          </p>

          <div
            id="product-form"
            style={{
              background: "#f8f5ee",
              border: "1px solid #e7dfd1",
              borderRadius: "10px",
              padding: "20px",
              marginTop: "20px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingId ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleProductSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    style={styles.input}
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Example: Wooden Study Table"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Category *</label>
                  <select
                    style={styles.input}
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                  >
                    <option value="Furniture">Furniture</option>
                    <option value="Appliances">Appliances</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Monthly Rent (₹) *</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="Example: 899"
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Security Deposit (₹)</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="securityDeposit"
                    min="0"
                    step="0.01"
                    value={form.securityDeposit}
                    onChange={handleFormChange}
                    placeholder="Example: 2000"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Stock Quantity *</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="stockQuantity"
                    min="0"
                    step="1"
                    value={form.stockQuantity}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Product Icon (Emoji)</label>
                  <input
                    style={styles.input}
                    name="icon"
                    value={form.icon}
                    onChange={handleFormChange}
                    placeholder="Example: 🛋️"
                  />
                </div>

                <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Product Image URL (Optional)</label>
                  <input
                    style={styles.input}
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleFormChange}
                    placeholder="Paste an image URL here"
                  />
                  <span style={{ fontSize: "12px", color: "#64736d" }}>
                    Leave empty if you do not have a product image.
                  </span>
                </div>

                <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Product Description *</label>
                  <textarea
                    style={styles.textarea}
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Describe the product and its features..."
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: "22px" }}>
                <label style={styles.label}>Available Rental Tenures *</label>

                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "22px",
                  marginTop: "12px"
                }}>
                  {[3, 6, 12].map((tenure) => (
                    <label
                      key={tenure}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "14px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.rentalTenures.includes(tenure)}
                        onChange={() => handleTenureChange(tenure)}
                      />
                      {tenure} Months
                    </label>
                  ))}
                </div>
              </div>

              {productMessage && (
                <div style={{
                  ...styles.message,
                  color: productMessage.toLowerCase().includes("success")
                    ? "#246b45"
                    : "#a83232"
                }}>
                  {productMessage}
                </div>
              )}

              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "22px"
              }}>
                <button
                  type="submit"
                  style={styles.button}
                  disabled={savingProduct}
                >
                  {savingProduct
                    ? "Saving..."
                    : editingId
                      ? "Update Product"
                      : "Add Product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={resetProductForm}
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "35px"
          }}>
            <h3>Existing Inventory</h3>

            <button
              style={styles.secondaryButton}
              onClick={loadProducts}
              disabled={productLoading}
            >
              {productLoading ? "Loading..." : "↻ Refresh Products"}
            </button>
          </div>

          {productLoading && (
            <div style={styles.message}>Loading product inventory...</div>
          )}

          {productError && (
            <div style={{ ...styles.message, color: "#a83232" }}>
              <p>{productError}</p>
              <button style={styles.button} onClick={loadProducts}>
                Try Again
              </button>
            </div>
          )}

          {!productLoading && !productError && (
            <div style={styles.tableWrapper}>
              <table style={{ ...styles.table, minWidth: "850px" }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Monthly Rent</th>
                    <th style={styles.th}>Deposit</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Availability</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.empty}>
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td style={styles.td}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                style={styles.productImage}
                              />
                            ) : (
                              <span style={{ fontSize: "28px" }}>
                                {product.icon || "🏠"}
                              </span>
                            )}

                            <strong>{product.name}</strong>
                          </div>
                        </td>

                        <td style={styles.td}>{product.category}</td>

                        <td style={styles.td}>
                          {formatCurrency(product.price)}/month
                        </td>

                        <td style={styles.td}>
                          {formatCurrency(product.securityDeposit)}
                        </td>

                        <td style={styles.td}>{product.stockQuantity}</td>

                        <td style={styles.td}>
                          <span style={{
                            color: product.available ? "#246b45" : "#a83232",
                            fontWeight: "bold"
                          }}>
                            {product.available ? "Available" : "Unavailable"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.actionGroup}>
                            <button
                              style={styles.secondaryButton}
                              onClick={() => editProduct(product)}
                            >
                              Edit
                            </button>

                            <button
                              style={styles.secondaryButton}
                              onClick={() => toggleAvailability(product)}
                              disabled={
                                !product.available &&
                                product.stockQuantity === 0
                              }
                            >
                              {product.available ? "Disable" : "Enable"}
                            </button>

                            <button
                              style={styles.dangerButton}
                              onClick={() => deleteProduct(product)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
