import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserPlus, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";
import GoogleSignInButton from "./GoogleSignInButton";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (idToken) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google`, { id_token: idToken });
      setToken(res.data.token, res.data.user);
      navigate("/write", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Google sign-in failed.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      setToken(res.data.token, res.data.user);
      navigate("/write", { replace: true });
    } catch (err) {
      const msg = err.response?.status === 404 || err.code === "ERR_NETWORK"
        ? "Backend not reached. Open a terminal, run: cd server && npm start (keep it running), then try again."
        : (err.response?.data?.error || err.message || "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
            <p className="text-slate-600 mt-1">RedPen</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Name (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaUser />
                </span>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaEnvelope />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaLock />
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaLock />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <FaUserPlus />
              )}
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="relative my-6">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </span>
              <span className="relative flex justify-center text-xs uppercase text-slate-400">
                Or continue with
              </span>
            </div>

            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in could not load.")}
                disabled={loading || googleLoading}
              />
            </div>
          </form>

          <p className="mt-6 text-center text-slate-600 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
