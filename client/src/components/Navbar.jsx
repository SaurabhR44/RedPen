import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPencilAlt, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-800 dark:to-slate-900 text-white py-3 px-6 shadow-md relative z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-90">
            <FaPencilAlt className="text-2xl" />
            <span>RedPen</span>
          </Link>
          <div className="hidden md:flex gap-4">
            <Link to="/" className="hover:text-blue-100 dark:hover:text-slate-300 transition">Home</Link>
            <Link to="/about" className="hover:text-blue-100 dark:hover:text-slate-300 transition">About</Link>
            <Link to="/write" className="hover:text-blue-100 dark:hover:text-slate-300 transition font-medium">Write</Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          {/* Direct Write Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/write"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 flex items-center gap-2 transition"
            >
              <FaPencilAlt />
              Start Writing
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-blue-600 dark:bg-slate-900 border-t border-white/10 shadow-xl p-4 flex flex-col gap-4 animate-fadeIn">
          <Link to="/" className="hover:text-blue-100 dark:hover:text-slate-300 py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/about" className="hover:text-blue-100 dark:hover:text-slate-300 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/write" className="hover:text-blue-100 dark:hover:text-slate-300 py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Write</Link>
        </div>
      )}
    </nav>
  );
}
