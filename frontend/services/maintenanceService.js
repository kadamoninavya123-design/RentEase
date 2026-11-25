
const API_URL = "http://localhost:5000/api/maintenance";

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

// Submit a maintenance request
export const createMaintenanceRequest = async (requestData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to submit maintenance request."
    );
  }

  return data;
};

// Get logged-in customer's maintenance requests
export const getMyMaintenanceRequests = async () => {
  const response = await fetch(`${API_URL}/my-requests`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to fetch maintenance requests."
    );
  }

  return data;
};
