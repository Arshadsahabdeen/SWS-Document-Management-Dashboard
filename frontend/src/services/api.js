const API_BASE_URL = "http://localhost:5000/api";

export const getHealthStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Failed to fetch health status");
  }

  return response.json();
};
