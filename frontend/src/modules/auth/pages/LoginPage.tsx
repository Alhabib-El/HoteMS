import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { useAuth } from "../../../shared/auth/AuthContext";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleKey(key: string) {
    setError(null);
    if (key === "clear") {
      setPin("");
    } else if (key === "back") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((p) => p + key);
    }
  }

  async function handleSubmit() {
    if (!pin) return;
    setLoading(true);
    setError(null);
    try {
      await login(pin);
      navigate("/");
    } catch {
      setError("Invalid PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-80">
        <h1 className="text-lg font-bold text-center mb-1">HoteMS</h1>
        <p className="text-sm text-slate-500 text-center mb-4">Enter your staff PIN</p>

        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center ${
                i < pin.length ? "bg-slate-900" : "bg-white"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center mb-2">{error}</p>}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="h-12 rounded-md bg-slate-50 hover:bg-slate-200 text-sm font-medium border border-slate-200"
            >
              {key === "clear" ? "Clear" : key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={!pin || loading}>
          {loading ? "Checking…" : "Log in"}
        </Button>
      </Card>
    </div>
  );
}
