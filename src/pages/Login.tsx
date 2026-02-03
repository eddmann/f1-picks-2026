import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { login, clearError } from "../store/slices/authSlice";
import { X } from "lucide-react";

type DemoScenarioId = "showcase" | "fresh" | "locked" | "admin";

type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  description: string;
};

type DemoModule = typeof import("../demo");

const DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === "true";

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoScenario, setDemoScenarioState] = useState<DemoScenarioId | null>(
    null,
  );
  const [demoScenarios, setDemoScenarios] = useState<DemoScenario[]>([]);
  const [demoModule, setDemoModule] = useState<DemoModule | null>(null);
  const demoEnabled = DEMO_MODE && demoModule !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!DEMO_MODE) return;

    let isMounted = true;
    import("../demo").then((mod) => {
      if (!isMounted) return;
      setDemoModule(mod);
      setDemoScenarioState(mod.getDemoScenario());
      setDemoScenarios(mod.DEMO_SCENARIOS);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDemoLogin = async (scenarioId: DemoScenarioId) => {
    if (!demoModule) return;
    demoModule.setDemoScenario(scenarioId);
    demoModule.resetDemoData(scenarioId);
    setDemoScenarioState(scenarioId);
    const result = await dispatch(
      login({ email: "demo@f1picks.demo", password: "demo" }),
    );
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

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
          <p className="text-gray-400 mt-2">Sign in to make your picks</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-lighter rounded-2xl p-6 space-y-5"
        >
          {error && (
            <div className="bg-f1-red/10 border border-f1-red/30 text-f1-red px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
              <span className="text-sm">{error}</span>
              <button
                type="button"
                onClick={() => dispatch(clearError())}
                className="p-1 hover:bg-f1-red/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

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
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-gray-400 pt-2">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-f1-red hover:text-f1-red-glow font-medium transition-colors"
            >
              Register
            </Link>
          </p>
        </form>

        {demoEnabled && (
          <div className="mt-6 glass-lighter rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-200">
                  Demo Mode
                </h2>
                <p className="text-xs text-gray-500">
                  No backend required. Pick a scenario to sign in.
                </p>
              </div>
              <span className="text-xs text-f1-red bg-f1-red/10 px-2 py-1 rounded-lg">
                Enabled
              </span>
            </div>

            <div className="space-y-2">
              {demoScenarios.map((scenario) => {
                const isSelected = demoScenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => handleDemoLogin(scenario.id)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl border transition-all duration-200
                      ${isSelected ? "border-f1-red bg-f1-red/10" : "border-asphalt bg-carbon hover:bg-carbon-light"}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">
                        {scenario.label}
                      </span>
                      {isSelected && (
                        <span className="text-xs text-f1-red">Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {scenario.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
