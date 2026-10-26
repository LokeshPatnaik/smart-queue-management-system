
import { useState } from "react";

function CustomerLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "https://smartqueue-u108.onrender.com/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const responseText = await response.text();

            console.log("LOGIN STATUS:", response.status);
            console.log("LOGIN RESPONSE:", responseText);

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    if (response.ok) {
                        throw new Error(
                            "Server returned an invalid login response."
                        );
                    }
                }
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Login failed. Check your email and password."
                );
            }

            if (!data.token) {
                throw new Error(
                    "No authentication token received from the server."
                );
            }

            localStorage.setItem("customerToken", data.token);
            onLogin(data.token);

        } catch (error) {
            console.error("CUSTOMER LOGIN ERROR:", error);

            setError(
                error.message === "Failed to fetch"
                    ? "Unable to connect to the server. Check the backend connection and CORS settings."
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="staff-login-page">
            <div className="staff-login-card">
                <div className="staff-login-icon">S</div>

                <div className="eyebrow">
                    CUSTOMER ACCESS
                </div>

                <h1>Customer Login</h1>

                <p>
                    Sign in to reserve your place in the
                    SmartQueue.
                </p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="customer@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="staff-login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default CustomerLogin;
