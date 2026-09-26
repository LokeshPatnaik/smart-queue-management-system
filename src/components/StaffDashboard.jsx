import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const API = "";

function StaffDashboard({ services }) {
    const [tickets, setTickets] = useState([]);
    const [selectedService, setSelectedService] = useState(
        services?.[0] || null
    );

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // =========================================================
    // LOAD TICKETS
    // =========================================================

    const loadTickets = async () => {
        try {
            const response = await fetch(`${API}/api/tickets`);

            if (!response.ok) {
                throw new Error(`Tickets API returned ${response.status}`);
            }

            const data = await response.json();

            setTickets(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("STAFF TICKETS ERROR:", error);
            setMessage("Unable to synchronize queue data.");
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        loadTickets();
    }, []);

    // =========================================================
    // AUTO REFRESH
    // =========================================================

    useEffect(() => {
        const interval = setInterval(() => {
            loadTickets();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // =========================================================
    // SERVICE UPDATE
    // =========================================================

    useEffect(() => {
        if (services?.length > 0) {
            setSelectedService((current) => {
                if (!current) return services[0];

                const updated = services.find(
                    (service) => service.id === current.id
                );

                return updated || services[0];
            });
        }
    }, [services]);

    // =========================================================
    // FILTER CURRENT SERVICE
    // =========================================================

    const serviceTickets = useMemo(() => {
        if (!selectedService) return [];

        return tickets
            .filter(
                (ticket) =>
                    ticket.service?.id === selectedService.id
            )
            .sort(
                (a, b) =>
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
            );
    }, [tickets, selectedService]);

    const waitingTickets = serviceTickets.filter(
        (ticket) => ticket.status === "WAITING"
    );

    const servingTicket = serviceTickets.find(
        (ticket) => ticket.status === "SERVING"
    );

    const completedTickets = serviceTickets.filter(
        (ticket) => ticket.status === "COMPLETED"
    );

    const nextTicket = waitingTickets[0] || null;

    const totalTickets = serviceTickets.length;

    const queueProgress =
        totalTickets > 0
            ? Math.min(
                100,
                Math.round(
                    (completedTickets.length /
                        totalTickets) *
                    100
                )
            )
            : 0;

    // =========================================================
    // CALL NEXT
    // =========================================================

    const callNext = async () => {
        if (!selectedService) {
            setMessage("Please select a service.");
            return;
        }

        if (servingTicket) {
            setMessage(
                "Complete the current customer before calling the next."
            );
            return;
        }

        if (!nextTicket) {
            setMessage("There are no customers waiting.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API}/api/tickets/call-next/${selectedService.id}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}: ${responseText}`
                );
            }

            await loadTickets();

            setMessage(
                `${nextTicket.tokenNumber} is now being served.`
            );
        } catch (error) {
            console.error("CALL NEXT ERROR:", error);
            setMessage(
                `Unable to call next: ${error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // COMPLETE CURRENT
    // =========================================================

    const completeCurrent = async () => {
        if (!servingTicket) {
            setMessage(
                "There is no customer currently being served."
            );
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API}/api/tickets/${servingTicket.id}/complete`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}: ${responseText}`
                );
            }

            await loadTickets();

            setMessage(
                `${servingTicket.tokenNumber} has been completed successfully.`
            );
        } catch (error) {
            console.error("COMPLETE ERROR:", error);

            setMessage(
                `Unable to complete ticket: ${error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // TIME FORMAT
    // =========================================================

    const formatTime = (dateValue) => {
        if (!dateValue) return "—";

        return new Date(dateValue).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <section className="staff-dashboard">

            {/* =================================================
                TOP COMMAND HEADER
            ================================================= */}

            <motion.div
                className="staff-topbar"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >

                <div className="staff-heading">

                    <div className="staff-eyebrow">
                        <span className="staff-eyebrow-line" />
                        OPERATIONS CENTER
                    </div>

                    <h1>
                        Queue
                        <span> Control.</span>
                    </h1>

                    <p>
                        Monitor customer flow and manage
                        counter operations in real time.
                    </p>

                </div>

                <div className="staff-controls">

                    <div className="sync-status">

                        <span className="sync-dot" />

                        <div>
                            <small>LIVE SYSTEM</small>
                            <strong>
                                Updated {formatTime(lastUpdated)}
                            </strong>
                        </div>

                    </div>

                    <div className="staff-service-control">

                        <label>
                            ACTIVE SERVICE
                        </label>

                        <select
                            value={selectedService?.id || ""}
                            onChange={(event) => {

                                const service =
                                    services.find(
                                        (item) =>
                                            item.id ===
                                            Number(
                                                event.target.value
                                            )
                                    );

                                setSelectedService(
                                    service || null
                                );

                                setMessage("");
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

                </div>

            </motion.div>


            {/* =================================================
                METRIC STRIP
            ================================================= */}

            <motion.div
                className="staff-metrics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    delay: 0.08,
                }}
            >

                <div className="metric-card">

                    <div className="metric-top">
                        <span>WAITING</span>
                        <span className="metric-icon">01</span>
                    </div>

                    <strong>
                        {String(waitingTickets.length).padStart(
                            2,
                            "0"
                        )}
                    </strong>

                    <small>
                        Customers in queue
                    </small>

                </div>


                <div className="metric-card metric-active">

                    <div className="metric-top">
                        <span>NOW SERVING</span>
                        <span className="metric-icon">02</span>
                    </div>

                    <strong>
                        {servingTicket?.tokenNumber || "—"}
                    </strong>

                    <small>
                        {servingTicket
                            ? "Customer at counter"
                            : "Counter available"}
                    </small>

                </div>


                <div className="metric-card">

                    <div className="metric-top">
                        <span>COMPLETED</span>
                        <span className="metric-icon">03</span>
                    </div>

                    <strong>
                        {String(
                            completedTickets.length
                        ).padStart(2, "0")}
                    </strong>

                    <small>
                        Served today
                    </small>

                </div>


                <div className="metric-card">

                    <div className="metric-top">
                        <span>QUEUE FLOW</span>
                        <span className="metric-icon">04</span>
                    </div>

                    <strong>
                        {queueProgress}%
                    </strong>

                    <div className="metric-progress">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${queueProgress}%`,
                            }}
                            transition={{
                                duration: 0.8,
                            }}
                        />
                    </div>

                </div>

            </motion.div>


            {/* =================================================
                MAIN OPERATIONS GRID
            ================================================= */}

            <div className="operations-grid">


                {/* =================================================
                    CURRENT CUSTOMER
                ================================================= */}

                <motion.div
                    className="command-panel"
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.55,
                        delay: 0.12,
                    }}
                >

                    <div className="command-panel-header">

                        <div>
                            <span className="panel-kicker">
                                COUNTER STATUS
                            </span>

                            <h2>
                                Current customer
                            </h2>
                        </div>

                        <div
                            className={
                                servingTicket
                                    ? "counter-badge serving-badge"
                                    : "counter-badge ready-badge"
                            }
                        >
                            <span />
                            {servingTicket
                                ? "IN SERVICE"
                                : "READY"}
                        </div>

                    </div>


                    <div className="current-customer-large">

                        <div className="current-caption">
                            NOW SERVING
                        </div>

                        <AnimatePresence mode="wait">

                            <motion.div
                                key={
                                    servingTicket?.tokenNumber ||
                                    "empty"
                                }
                                className="hero-token"
                                initial={{
                                    opacity: 0,
                                    scale: 0.92,
                                    y: 8,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 1.04,
                                }}
                                transition={{
                                    duration: 0.35,
                                }}
                            >
                                {servingTicket?.tokenNumber ||
                                    "—"}
                            </motion.div>

                        </AnimatePresence>

                        <div className="current-service-large">

                            <span>
                                {servingTicket?.service?.name ||
                                    selectedService?.name ||
                                    "No active service"}
                            </span>

                            {servingTicket?.calledAt && (
                                <small>
                                    Called at{" "}
                                    {formatTime(
                                        servingTicket.calledAt
                                    )}
                                </small>
                            )}

                        </div>

                    </div>


                    <div className="command-actions">

                        <motion.button
                            className="call-button"
                            onClick={callNext}
                            disabled={
                                loading ||
                                !!servingTicket ||
                                !nextTicket
                            }
                            whileHover={
                                !loading &&
                                !servingTicket &&
                                nextTicket
                                    ? {
                                        y: -3,
                                        scale: 1.01,
                                    }
                                    : {}
                            }
                            whileTap={{
                                scale: 0.98,
                            }}
                        >

                            <span>
                                {loading
                                    ? "PROCESSING"
                                    : "CALL NEXT"}
                            </span>

                            <b>→</b>

                        </motion.button>


                        <motion.button
                            className="complete-button"
                            onClick={completeCurrent}
                            disabled={
                                loading ||
                                !servingTicket
                            }
                            whileHover={
                                !loading &&
                                servingTicket
                                    ? {
                                        y: -3,
                                    }
                                    : {}
                            }
                            whileTap={{
                                scale: 0.98,
                            }}
                        >
                            COMPLETE
                        </motion.button>

                    </div>

                </motion.div>


                {/* =================================================
                    NEXT CUSTOMER
                ================================================= */}

                <motion.div
                    className="next-panel"
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.55,
                        delay: 0.18,
                    }}
                >

                    <div className="next-panel-header">

                        <div>
                            <span className="panel-kicker">
                                UP NEXT
                            </span>

                            <h2>
                                Next customer
                            </h2>
                        </div>

                        <div className="next-number">
                            {nextTicket
                                ? "01"
                                : "—"}
                        </div>

                    </div>


                    {nextTicket ? (

                        <div className="next-customer">

                            <div className="next-token">
                                {nextTicket.tokenNumber}
                            </div>

                            <div className="next-service">
                                {nextTicket.service?.name}
                            </div>

                            <div className="next-meta">

                                <div>
                                    <span>POSITION</span>
                                    <strong>
                                        01
                                    </strong>
                                </div>

                                <div>
                                    <span>ARRIVED</span>
                                    <strong>
                                        {formatTime(
                                            nextTicket.createdAt
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="next-empty">

                            <div className="next-empty-icon">
                                ✓
                            </div>

                            <strong>
                                Queue is clear
                            </strong>

                            <p>
                                No customers are currently
                                waiting for this service.
                            </p>

                        </div>

                    )}

                </motion.div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            <AnimatePresence>

                {message && (
                    <motion.div
                        className="staff-message-premium"
                        initial={{
                            opacity: 0,
                            y: -8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -8,
                        }}
                    >

                        <span className="message-indicator" />

                        {message}

                    </motion.div>
                )}

            </AnimatePresence>


            {/* =================================================
                QUEUE TABLE
            ================================================= */}

            <motion.div
                className="queue-console"
                initial={{
                    opacity: 0,
                    y: 20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.55,
                    delay: 0.24,
                }}
            >

                <div className="queue-console-header">

                    <div>

                        <span className="panel-kicker">
                            LIVE QUEUE
                        </span>

                        <h2>
                            Waiting customers
                        </h2>

                        <p>
                            Customers are ordered by arrival time.
                        </p>

                    </div>

                    <div className="queue-total">

                        <strong>
                            {String(
                                waitingTickets.length
                            ).padStart(2, "0")}
                        </strong>

                        <span>
                            WAITING
                        </span>

                    </div>

                </div>


                {waitingTickets.length === 0 ? (

                    <div className="premium-empty">

                        <div className="premium-empty-mark">
                            ✓
                        </div>

                        <div>
                            <strong>
                                No active queue
                            </strong>

                            <p>
                                New customers will appear here
                                automatically.
                            </p>
                        </div>

                    </div>

                ) : (

                    <div className="premium-table">

                        <div className="table-head">

                            <span>
                                POSITION
                            </span>

                            <span>
                                TOKEN
                            </span>

                            <span>
                                SERVICE
                            </span>

                            <span>
                                ARRIVAL
                            </span>

                            <span>
                                STATUS
                            </span>

                        </div>


                        <div className="table-body">

                            {waitingTickets.map(
                                (ticket, index) => (

                                    <motion.div
                                        className="queue-row"
                                        key={ticket.id}
                                        initial={{
                                            opacity: 0,
                                            x: -12,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        transition={{
                                            delay:
                                                index *
                                                0.035,
                                        }}
                                    >

                                        <div className="row-position">
                                            {String(
                                                index + 1
                                            ).padStart(
                                                2,
                                                "0"
                                            )}
                                        </div>


                                        <div className="row-token">
                                            {ticket.tokenNumber}
                                        </div>


                                        <div className="row-service">
                                            <strong>
                                                {ticket.service?.name ||
                                                    "—"}
                                            </strong>

                                            <small>
                                                Queue customer
                                            </small>
                                        </div>


                                        <div className="row-time">
                                            {formatTime(
                                                ticket.createdAt
                                            )}
                                        </div>


                                        <div>
                                            <span className="waiting-pill">
                                                <i />
                                                WAITING
                                            </span>
                                        </div>

                                    </motion.div>

                                )
                            )}

                        </div>

                    </div>

                )}

            </motion.div>


            {/* =================================================
                FOOTER STATUS
            ================================================= */}

            <div className="staff-footer">

                <div>
                    <span className="footer-live-dot" />
                    LIVE QUEUE MONITORING
                </div>

                <span>
                    AUTO REFRESH · 5 SEC
                </span>

                <span>
                    SMARTQUEUE OPERATIONS
                </span>

            </div>

        </section>
    );
}

export default StaffDashboard;