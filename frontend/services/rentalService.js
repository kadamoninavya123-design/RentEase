const API_URL = "https://rent-ease-nine-coral.vercel.app/api/rentals";

// Get authentication token
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// Create a rental order
export const createRentalOrder = async (orderData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to place rental order.");
  }

  return data;
};

// Get logged-in customer's rental history
export const getMyRentals = async () => {
  const response = await fetch(`${API_URL}/my-rentals`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch rental history.");
  }

  return data;
};

// Cancel a rental order
export const cancelRentalOrder = async (rentalId) => {
  const response = await fetch(`${API_URL}/${rentalId}/cancel`, {
    method: "PATCH",
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to cancel rental order."
    );
  }

  return data;
};