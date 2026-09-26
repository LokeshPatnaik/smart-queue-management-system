import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API = "";

function StaffDashboard({ services, token, onLogout }) {

    const [tickets, setTickets] = useState([]);
    const [selectedService, setSelectedService] = useState(
        services?.[0] || null
    );

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // =====================================================
    // AUTH
    // =====================================================

    const getAuthHeaders = () => ({
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    });

    // =====================================================
    // LOAD TICKETS
    // =====================================================

    const loadTickets = async () => {

        if (!token) return;

        try {

            const response = await fetch(
                `${API}/api/tickets`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                onLogout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    `Tickets API returned ${response.status}`
                );
            }

            const data = await response.json();

            setTickets(data);

        } catch (error) {

            console.error(
                "STAFF TICKETS ERROR:",
                error
            );

            setMessage(
                "Unable to load queue data."
            );
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        if (token) {
            loadTickets();
        }

    }, [token]);

    // =====================================================
    // AUTO REFRESH
    // =====================================================

    useEffect(() => {

        if (!token) return;

        const interval = setInterval(
            loadTickets,
            5000
        );

        return () => clearInterval(interval);

    }, [token]);

    // =====================================================
    // SERVICE
    // =====================================================

    useEffect(() => {

        if (
            services?.length > 0 &&
            !selectedService
        ) {
            setSelectedService(services[0]);
        }

    }, [services, selectedService]);

    // =====================================================
    // FILTER
    // =====================================================

    const serviceTickets = tickets
        .filter(
            ticket =>
                selectedService &&
                ticket.service?.id === selectedService.id
        )
        .sort(
            (a, b) =>
                new Date(a.createdAt) -
                new Date(b.createdAt)
        );

    const waitingTickets =
        serviceTickets.filter(
            ticket =>
                ticket.status === "WAITING"
        );

    const servingTicket =
        serviceTickets.find(
            ticket =>
                ticket.status === "SERVING"
        );

    const completedTickets =
        serviceTickets.filter(
            ticket =>
                ticket.status === "COMPLETED"
        );

    const nextTicket =
        waitingTickets[0] || null;

    // =====================================================
    // CALL NEXT
    // =====================================================

    const callNext = async () => {

        if (!selectedService) {

            setMessage(
                "Please select a service."
            );

            return;
        }

        if (servingTicket) {

            setMessage(
                "Complete the current ticket first."
            );

            return;
        }

        if (!nextTicket) {

            setMessage(
                "No customers are waiting."
            );

            return;
        }

        setLoading(true);
        setMessage("");

        try {

            const response = await fetch(
                `${API}/api/tickets/call-next/${selectedService.id}`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                }
            );

            const responseText =
                await response.text();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                onLogout();
                return;
            }

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

            console.error(
                "CALL NEXT ERROR:",
                error
            );

            setMessage(
                `Unable to call next: ${error.message}`
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // COMPLETE
    // =====================================================

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
                    headers: getAuthHeaders(),
                }
            );

            const responseText =
                await response.text();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                onLogout();
                return;
            }

            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}: ${responseText}`
                );
            }

            await loadTickets();

            setMessage(
                `${servingTicket.tokenNumber} has been completed.`
            );

        } catch (error) {

            console.error(
                "COMPLETE ERROR:",
                error
            );

            setMessage(
                `Unable to complete ticket: ${error.message}`
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        onLogout();
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <section className="staff-dashboard">

            {/* =================================================
                TOP HEADER
            ================================================= */}

            <motion.div
                className="staff-topbar"
                initial={{
                    opacity: 0,
                    y: 15
                }}
                animate={{
                    opacity: 1,
                    y: 0
                }}
                transition={{
                    duration: 0.5
                }}
            >

                <div className="staff-heading">

                    <div className="staff-eyebrow">

                        <span className="staff-eyebrow-line" />

                        STAFF OPERATIONS

                    </div>

                    <h1>
                        Queue
                        <span> Dashboard</span>
                    </h1>

                    <p>
                        Manage customers and control
                        the live service queue.
                    </p>

                </div>


                {/* CONTROLS */}

                <div className="staff-controls">

                    <div className="sync-status">

                        <span className="sync-dot" />

                        <div>

                            <small>
                                SYSTEM STATUS
                            </small>

                            <strong>
                                Live &amp; synchronized
                            </strong>

                        </div>

                    </div>


                    <div className="staff-service-control">

                        <label>
                            ACTIVE SERVICE
                        </label>

                        <select
                            value={
                                selectedService?.id || ""
                            }
                            onChange={(event) => {

                                const service =
                                    services.find(
                                        item =>
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

                            {services?.map(
                                service => (

                                    <option
                                        key={service.id}
                                        value={service.id}
                                    >
                                        {service.name}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    <button
                        type="button"
                        className="staff-logout-button"
                        onClick={handleLogout}
                    >
                        LOG OUT
                    </button>

                </div>

            </motion.div>


            {/* =================================================
                METRICS
            ================================================= */}

            <div className="staff-metrics">

                <motion.div
                    className="metric-card"
                    whileHover={{ y: -4 }}
                >

                    <div className="metric-top">

                        <span>
                            WAITING
                        </span>

                        <span className="metric-icon">
                            QUEUE
                        </span>

                    </div>

                    <strong>
                        {waitingTickets.length}
                    </strong>

                    <small>
                        Customers currently waiting
                    </small>

                    <div className="metric-progress">

                        <div
                            style={{
                                width:
                                    `${Math.min(
                                        waitingTickets.length * 10,
                                        100
                                    )}%`
                            }}
                        />

                    </div>

                </motion.div>


                <motion.div
                    className="metric-card metric-active"
                    whileHover={{ y: -4 }}
                >

                    <div className="metric-top">

                        <span>
                            SERVING
                        </span>

                        <span className="metric-icon">
                            LIVE
                        </span>

                    </div>

                    <strong>
                        {servingTicket ? 1 : 0}
                    </strong>

                    <small>
                        Customer at the counter
                    </small>

                </motion.div>


                <motion.div
                    className="metric-card"
                    whileHover={{ y: -4 }}
                >

                    <div className="metric-top">

                        <span>
                            COMPLETED
                        </span>

                        <span className="metric-icon">
                            TODAY
                        </span>

                    </div>

                    <strong>
                        {completedTickets.length}
                    </strong>

                    <small>
                        Completed for this service
                    </small>

                </motion.div>


                <motion.div
                    className="metric-card"
                    whileHover={{ y: -4 }}
                >

                    <div className="metric-top">

                        <span>
                            NEXT
                        </span>

                        <span className="metric-icon">
                            READY
                        </span>

                    </div>

                    <strong>
                        {nextTicket
                            ? nextTicket.tokenNumber
                            : "—"}
                    </strong>

                    <small>
                        Next customer in line
                    </small>

                </motion.div>

            </div>


            {/* =================================================
                OPERATIONS
            ================================================= */}

            <div className="operations-grid">


                {/* COMMAND PANEL */}

                <motion.div
                    className="command-panel"
                    initial={{
                        opacity: 0,
                        y: 12
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    transition={{
                        duration: 0.5
                    }}
                >

                    <div className="command-panel-header">

                        <div>

                            <span className="panel-kicker">
                                SERVICE CONTROL
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

                        <div className="hero-token">

                            {servingTicket?.tokenNumber ||
                                "—"}

                        </div>


                        <div className="current-service-large">

                            <span>
                                {servingTicket?.service?.name ||
                                    selectedService?.name ||
                                    "No active service"}
                            </span>

                            <small>
                                {servingTicket
                                    ? "Customer currently being served"
                                    : "Ready for the next customer"}
                            </small>

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
                                    ? { y: -3 }
                                    : {}
                            }
                            whileTap={{
                                scale: 0.98
                            }}
                        >

                            <span>
                                {loading
                                    ? "PROCESSING..."
                                    : "CALL NEXT"}
                            </span>

                            <b>
                                →
                            </b>

                        </motion.button>


                        <motion.button
                            className="complete-button"
                            onClick={
                                completeCurrent
                            }
                            disabled={
                                loading ||
                                !servingTicket
                            }
                            whileHover={
                                !loading &&
                                servingTicket
                                    ? { y: -3 }
                                    : {}
                            }
                            whileTap={{
                                scale: 0.98
                            }}
                        >
                            COMPLETE
                        </motion.button>

                    </div>

                </motion.div>


                {/* NEXT CUSTOMER */}

                <div className="next-panel">

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

                                    <span>
                                        POSITION
                                    </span>

                                    <strong>
                                        01
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        STATUS
                                    </span>

                                    <strong>
                                        WAITING
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

                </div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <motion.div
                    className="staff-message-premium"
                    initial={{
                        opacity: 0,
                        y: -5
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                >

                    <span className="message-indicator" />

                    {message}

                </motion.div>

            )}


            {/* =================================================
                QUEUE CONSOLE
            ================================================= */}

            <div className="queue-console">

                <div className="queue-console-header">

                    <div>

                        <span className="panel-kicker">
                            LIVE QUEUE
                        </span>

                        <h2>
                            Waiting customers
                        </h2>

                        <p>
                            Customers currently waiting
                            for {selectedService?.name || "this service"}.
                        </p>

                    </div>


                    <div className="queue-total">

                        <strong>
                            {waitingTickets.length}
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
                                Queue is clear
                            </strong>

                            <p>
                                There are currently no waiting
                                customers for this service.
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
                                TIME
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
                                            x: -10
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0
                                        }}
                                        transition={{
                                            delay:
                                                index * 0.04
                                        }}
                                    >

                                        <div className="row-position">
                                            {String(
                                                index + 1
                                            ).padStart(2, "0")}
                                        </div>


                                        <div className="row-token">
                                            {ticket.tokenNumber}
                                        </div>


                                        <div className="row-service">

                                            <strong>
                                                {ticket.service?.name}
                                            </strong>

                                            <small>
                                                Queue customer
                                            </small>

                                        </div>


                                        <div className="row-time">

                                            {ticket.createdAt
                                                ? new Date(
                                                    ticket.createdAt
                                                ).toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )
                                                : "—"}

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

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="staff-footer">

                <div>

                    <span className="footer-live-dot" />

                    LIVE QUEUE MONITORING

                </div>

                <div>
                    AUTO REFRESH · 5 SEC
                </div>

            </div>

        </section>
    );
}

export default StaffDashboard;