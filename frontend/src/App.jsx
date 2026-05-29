import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import { getHealthStatus } from "./services/api.js";

function App() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getHealthStatus();
        setStatus(data.message);
      } catch (error) {
        setStatus("Backend not connected yet");
      }
    };

    loadStatus();
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <main className="hero">
        <section className="hero-card">
          <p className="eyebrow">MERN Stack Starter</p>
          <h1>Frontend and backend are separated and ready to build on.</h1>
          <p className="description">
            This starter gives you a React frontend, an Express backend, and a
            MongoDB connection layer with a simple API route.
          </p>
          <div className="status-box">
            <span className="status-label">API Status</span>
            <strong>{status}</strong>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
