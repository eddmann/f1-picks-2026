import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { register, clearError } from "../store/slices/authSlice";
import { X } from "lucide-react";

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await dispatch(
      register({ name, email, password, timezone }),
    );
    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-pit-black">
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.03) 40px,
              rgba(255,255,255,0.03) 80px
            )`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="F1 Picks" className="h-16 mx-auto mb-4" />
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-lighter rounded-2xl p-6 space-y-5"
        >
          {displayError && (
            <div className="bg-f1-red/10 border border-f1-red/30 text-f1-red px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
              <span className="text-sm">{displayError}</span>
              <button
                type="button"
                onClick={() => {
                  setLocalError("");
                  dispatch(clearError());
                }}
                className="p-1 hover:bg-f1-red/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-carbon border border-asphalt rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-f1-red transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-carbon border border-asphalt rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-f1-red transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-carbon border border-asphalt rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-f1-red transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-carbon border border-asphalt rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-f1-red transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-f1-red hover:bg-f1-red-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-base md:text-lg transition-all duration-200 btn-press glow-red flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-gray-400 pt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-f1-red hover:text-f1-red-glow font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
