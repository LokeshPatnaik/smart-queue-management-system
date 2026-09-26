import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StaffDashboard from "./components/StaffDashboard";
import StaffLogin from "./components/StaffLogin";
import CustomerLogin from "./components/CustomerLogin";
import "./App.css";

const API = "";

const fallbackServices = [
  {
    id: 1,
    name: "Cash Deposit",
    description: "Deposit cash into your bank account",
  },
  {
    id: 2,
    name: "Cash Withdrawal",
    description: "Withdraw cash from your bank account",
  },
  {
    id: 3,
    name: "Account Opening",
    description: "Open a new bank account",
  },
  {
    id: 4,
    name: "KYC Update",
    description: "Update your customer information",
  },
];

function App() {
  const [services, setServices] = useState([]);

  // CUSTOMER AUTHENTICATION
  const [customerToken, setCustomerToken] = useState(
      localStorage.getItem("customerToken")
  );

  const [selectedService, setSelectedService] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [myTicket, setMyTicket] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // CUSTOMER / STAFF VIEW
  const [view, setView] = useState("customer");

  // STAFF AUTHENTICATION
  const [staffToken, setStaffToken] = useState(
      localStorage.getItem("staffToken")
  );

  // =====================================================
  // LOAD SERVICES
  // =====================================================

  const loadServices = async () => {
    try {
      const response = await fetch(`${API}/api/services`);

      if (!response.ok) {
        throw new Error(`Services API returned ${response.status}`);
      }

      const data = await response.json();

      setServices(data);

      if (data.length > 0) {
        setSelectedService(data[0]);
      }
    } catch (error) {
      console.error("SERVICE ERROR:", error);

      setServices(fallbackServices);
      setSelectedService(fallbackServices[0]);

      setMessage(
          "Using available services. Server service list could not be loaded."
      );
    }
  };

  // =====================================================
  // LOAD TICKETS
  // =====================================================

  const loadTickets = async () => {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      } else if (staffToken) {
        headers.Authorization = `Bearer ${staffToken}`;
      }

      const response = await fetch(`${API}/api/tickets`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Tickets API returned ${response.status}`);
      }

      const data = await response.json();

      setTickets(data);
    } catch (error) {
      console.error("TICKETS ERROR:", error);
    }
  };

  // =====================================================
  // CREATE QUEUE TOKEN
  // =====================================================

  const getQueueToken = async () => {
    if (!selectedService) {
      setMessage("Please select a service first.");
      return;
    }

    if (!customerToken) {
      setMessage(
          "Please login as a customer before getting a queue token."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const requestBody = {
        user: {
          id: 1,
        },
        service: {
          id: selectedService.id,
        },
      };

      console.log("Creating ticket:", requestBody);

      const response = await fetch(`${API}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      console.log("Backend response:", responseText);

      if (response.status === 401 || response.status === 403) {
        setMessage(
            "Customer authentication is required. Please login again."
        );

        localStorage.removeItem("customerToken");
        setCustomerToken(null);

        return;
      }

      if (!response.ok) {
        throw new Error(
            `Server returned ${response.status}: ${responseText}`
        );
      }

      const ticket = JSON.parse(responseText);

      setMyTicket(ticket);

      await loadQueuePosition(ticket.id);
      await loadTickets();

      setMessage("Queue token generated successfully.");
    } catch (error) {
      console.error("CREATE TICKET ERROR:", error);

      setMessage(`Ticket creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD QUEUE POSITION
  // =====================================================

  const loadQueuePosition = async (ticketId) => {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      } else if (staffToken) {
        headers.Authorization = `Bearer ${staffToken}`;
      }

      const response = await fetch(
          `${API}/api/tickets/${ticketId}/queue-position`,
          {
            headers,
          }
      );

      if (response.status === 401 || response.status === 403) {
        console.error(
            "QUEUE POSITION AUTH ERROR:",
            response.status
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
            `Queue position returned ${response.status}`
        );
      }

      const data = await response.json();

      setQueuePosition(data);
    } catch (error) {
      console.error("QUEUE POSITION ERROR:", error);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadServices();
  }, []);

  // =====================================================
  // LOAD TICKETS AFTER AUTHENTICATION
  // =====================================================

  useEffect(() => {
    if (customerToken || staffToken) {
      loadTickets();
    }
  }, [customerToken, staffToken]);

  // =====================================================
  // AUTO REFRESH CUSTOMER QUEUE
  // =====================================================

  useEffect(() => {
    if (!myTicket) return;

    const interval = setInterval(async () => {
      await loadQueuePosition(myTicket.id);
      await loadTickets();
    }, 5000);

    return () => clearInterval(interval);
  }, [myTicket, customerToken, staffToken]);

  // =====================================================
  // QUEUE FILTERING
  // =====================================================

  const servingTicket = tickets.find(
      (ticket) =>
          ticket.status === "SERVING" &&
          selectedService &&
          ticket.service?.id === selectedService.id
  );

  const waitingTickets = tickets
      .filter(
          (ticket) =>
              ticket.status === "WAITING" &&
              selectedService &&
              ticket.service?.id === selectedService.id
      )
      .sort(
          (a, b) =>
              new Date(a.createdAt) - new Date(b.createdAt)
      );

  const nextTicket =
      waitingTickets.length > 0
          ? waitingTickets[0]
          : null;

  // =====================================================
  // CUSTOMER LOGIN
  // =====================================================

  const handleCustomerLogin = (token) => {
    localStorage.setItem("customerToken", token);
    setCustomerToken(token);
    setMessage("");
  };

  // =====================================================
  // CUSTOMER LOGOUT
  // =====================================================

  const handleCustomerLogout = () => {
    localStorage.removeItem("customerToken");

    setCustomerToken(null);
    setMyTicket(null);
    setQueuePosition(null);
    setTickets([]);
    setMessage("");
  };

  // =====================================================
  // STAFF LOGIN
  // =====================================================

  const handleStaffLogin = (token) => {
    setStaffToken(token);
    setView("staff");
  };

  // =====================================================
  // STAFF LOGOUT
  // =====================================================

  const handleStaffLogout = () => {
    localStorage.removeItem("staffToken");

    setStaffToken(null);
    setView("customer");
  };

  return (
      <div className="app">

        {/* =================================================
            NAVBAR
        ================================================= */}

        <header className="navbar">

          <motion.div
              className="brand"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
          >

            <div className="brand-mark">
              S
            </div>

            <div>

              <div className="brand-name">
                SMARTQUEUE
              </div>

              <div className="brand-subtitle">
                DIGITAL BANKING SERVICES
              </div>

            </div>

          </motion.div>


          {/* VIEW SWITCHER */}

          <div className="view-switcher">

            <button
                className={
                  view === "customer"
                      ? "view-button active"
                      : "view-button"
                }
                onClick={() => {
                  setView("customer");
                  setMessage("");
                }}
            >
              CUSTOMER
            </button>

            <button
                className={
                  view === "staff"
                      ? "view-button active"
                      : "view-button"
                }
                onClick={() => {
                  setView("staff");
                  setMessage("");
                }}
            >
              STAFF
            </button>

          </div>


          <div className="system-status">

            <span className="status-dot"></span>

            SYSTEM OPERATIONAL

          </div>

        </header>


        {/* =================================================
            CUSTOMER LOGIN
        ================================================= */}

        {view === "customer" && !customerToken && (

            <CustomerLogin
                onLogin={handleCustomerLogin}
            />

        )}


        {/* =================================================
            CUSTOMER VIEW
        ================================================= */}

        {view === "customer" && customerToken && (
            <>

              <main className="hero">

                {/* HERO CONTENT */}

                <motion.section
                    className="hero-content"
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.65,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                >

                  <div className="eyebrow">
                    DIGITAL QUEUE MANAGEMENT
                  </div>


                  <h1>

                    <span className="heading-main">
                      Your time
                    </span>

                    <br />

                    <span className="heading-elegant">
                      matters.
                    </span>

                  </h1>


                  <p>
                    Reserve your place in the queue before
                    reaching the counter. Track your position
                    and arrive when your service is ready.
                  </p>


                  {/* SERVICE SELECTOR */}

                  <div className="service-selector">

                    <div className="selector-label">
                      SELECT SERVICE
                    </div>

                    <select
                        value={selectedService?.id || ""}
                        onChange={(event) => {

                          const service =
                              services.find(
                                  (item) =>
                                      item.id ===
                                      Number(event.target.value)
                              );

                          setSelectedService(
                              service || null
                          );

                          setQueuePosition(null);

                        }}
                    >

                      {services.map((service) => (

                          <option
                              key={service.id}
                              value={service.id}
                          >
                            {service.name}
                          </option>

                      ))}

                    </select>

                  </div>


                  {/* GET TOKEN BUTTON */}

                  <motion.button
                      className="primary-button"
                      onClick={getQueueToken}
                      disabled={loading}
                      whileHover={
                        loading
                            ? {}
                            : { y: -2 }
                      }
                      whileTap={{
                        y: 0,
                      }}
                  >

                    <span>

                      {loading
                          ? "Generating..."
                          : "Get a Queue Token"}

                    </span>

                    <span className="button-arrow">
                      →
                    </span>

                  </motion.button>


                  {/* MESSAGE */}

                  {message && (

                      <motion.div
                          className="message"
                          initial={{
                            opacity: 0,
                            y: -4,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                      >
                        {message}
                      </motion.div>

                  )}

                  {/* CUSTOMER LOGOUT */}

                  <button
                      type="button"
                      className="staff-logout-button"
                      onClick={handleCustomerLogout}
                  >
                    Logout
                  </button>

                </motion.section>


                {/* =================================================
                    LIVE QUEUE CARD
                ================================================= */}

                <motion.section
                    className="live-card"
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                >

                  <div className="live-card-header">

                    <span>
                      LIVE QUEUE
                    </span>

                    <div className="live">

                      <span className="live-dot"></span>

                      LIVE

                    </div>

                  </div>


                  <div className="serving">

                    <div className="serving-label">
                      NOW SERVING
                    </div>


                    <motion.div
                        className="token"
                        key={
                            servingTicket?.tokenNumber ||
                            "empty"
                        }
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                    >

                      {servingTicket?.tokenNumber ||
                          "—"}

                    </motion.div>


                    <div className="service-name">

                      {servingTicket?.service?.name ||
                          selectedService?.name ||
                          "No active service"}

                    </div>

                  </div>


                  <div className="queue-info">

                    <div className="queue-stat">

                      <strong>

                        {queuePosition?.peopleAhead ??
                            0}

                      </strong>

                      <span>
                        PEOPLE AHEAD
                      </span>

                    </div>


                    <div className="divider"></div>


                    <div className="queue-stat">

                      <strong>

                        ~
                        {queuePosition?.estimatedWaitMinutes ??
                            0}

                      </strong>

                      <span>
                        MINUTES
                      </span>

                    </div>

                  </div>

                </motion.section>

              </main>


              {/* =================================================
                  MY QUEUE
              ================================================= */}

              {myTicket && (

                  <motion.section
                      className="my-queue"
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.45,
                      }}
                  >

                    <div className="my-queue-header">

                      <div>

                        <div className="eyebrow">
                          YOUR QUEUE
                        </div>

                        <h2>
                          {myTicket.tokenNumber}
                        </h2>

                      </div>


                      <div
                          className={`ticket-status ${myTicket.status.toLowerCase()}`}
                      >
                        {myTicket.status}
                      </div>

                    </div>


                    <div className="my-queue-grid">

                      <div className="my-stat">

                        <span>
                          PEOPLE AHEAD
                        </span>

                        <strong>

                          {queuePosition?.peopleAhead ??
                              "—"}

                        </strong>

                      </div>


                      <div className="my-stat">

                        <span>
                          ESTIMATED WAIT
                        </span>

                        <strong>

                          {queuePosition
                              ? `~${queuePosition.estimatedWaitMinutes} min`
                              : "—"}

                        </strong>

                      </div>


                      <div className="my-stat">

                        <span>
                          NEXT IN QUEUE
                        </span>

                        <strong>

                          {nextTicket?.tokenNumber ||
                              "—"}

                        </strong>

                      </div>

                    </div>

                  </motion.section>

              )}


              {/* =================================================
                  SERVICES
              ================================================= */}

              <section className="services">

                <motion.div
                    className="services-heading"
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.3,
                    }}
                    transition={{
                      duration: 0.5,
                    }}
                >

                  <div>

                    <div className="eyebrow">
                      BANKING SERVICES
                    </div>

                    <h2>
                      Choose what you need.
                    </h2>

                  </div>


                  <div className="service-total">

                    {services.length
                        .toString()
                        .padStart(2, "0")}{" "}

                    SERVICES

                  </div>

                </motion.div>


                <div className="service-grid">

                  {services.map(
                      (service, index) => (

                          <motion.div
                              className="service-card"
                              key={service.id}
                              onClick={() => {

                                setSelectedService(
                                    service
                                );

                                setQueuePosition(
                                    null
                                );

                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });

                              }}
                              initial={{
                                opacity: 0,
                                y: 14,
                              }}
                              whileInView={{
                                opacity: 1,
                                y: 0,
                              }}
                              viewport={{
                                once: true,
                                amount: 0.15,
                              }}
                              transition={{
                                duration: 0.45,
                                delay: index * 0.06,
                              }}
                              whileHover={{
                                y: -4,
                              }}
                          >

                            <div className="service-number">

                              {String(index + 1).padStart(
                                  2,
                                  "0"
                              )}

                            </div>


                            <div className="service-content">

                              <h3>
                                {service.name}
                              </h3>

                              <p>
                                {service.description}
                              </p>

                            </div>


                            <div className="service-arrow">
                              ↗
                            </div>

                          </motion.div>

                      )
                  )}

                </div>

              </section>


              {/* FOOTER */}

              <footer>

                <span className="footer-brand">
                  SMARTQUEUE
                </span>

                <span>
                  Smart Queue Management System · 2026
                </span>

              </footer>

            </>
        )}


        {/* =================================================
            STAFF VIEW
        ================================================= */}

        {view === "staff" && !staffToken && (

            <StaffLogin
                onLogin={handleStaffLogin}
            />

        )}


        {view === "staff" && staffToken && (

            <StaffDashboard
                services={services}
                token={staffToken}
                onLogout={handleStaffLogout}
            />

        )}

      </div>
  );
}

export default App;