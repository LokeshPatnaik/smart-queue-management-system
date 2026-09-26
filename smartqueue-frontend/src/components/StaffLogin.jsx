import { useState } from "react";

function StaffLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid email or password");
            }

            localStorage.setItem("staffToken", data.token);

            onLogin(data.token);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="staff-login-page">

            <div className="staff-login-card">

                <div className="staff-login-icon">
                    S
                </div>

                <div className="eyebrow">
                    SECURE ACCESS
                </div>

                <h1>Staff Portal</h1>

                <p>
                    Sign in to access the SmartQueue staff dashboard.
                </p>

                <form onSubmit={handleLogin}>

                    <div className="input-group">
                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="staff@smartqueue.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

export default StaffLogin;