
const API_URL = "http://localhost:5000/api/damage-claims";

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

// Submit a damage claim
export const createDamageClaim = async (claimData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(claimData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to submit damage claim."
    );
  }

  return data;
};

// Get logged-in customer's damage claims
export const getMyDamageClaims = async () => {
  const response = await fetch(`${API_URL}/my-claims`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to fetch damage claims."
    );
  }

  return data;
};
