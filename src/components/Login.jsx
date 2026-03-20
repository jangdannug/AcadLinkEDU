import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useUIStore } from "../store.js";
import { LogIn, Shield, Cpu, Loader2 } from "lucide-react";
import { api } from "../api.js";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const setUser = useAuthStore((state) => state.setUser);
  const showNotification = useUIStore((s) => s.showNotification);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Futuristic loading simulation
    for (let i = 0; i <= 100; i += 2) {
      setLoadingProgress(i);
      await new Promise((r) => setTimeout(r, 20));
    }

    try {
      let data;
      if (isRegistering) {
        data = await api.register({ email, name, role });
      } else {
        data = await api.login(email);
      }

      if (data?.user) {
        setUser(data.user);
      } else {
        showNotification(
          data?.error || "Access Denied: Neural signature mismatch.",
          "error",
          6000,
        );
        setIsAuthenticating(false);
        setLoadingProgress(0);
      }
    } catch (err) {
      console.error("[Login] auth error", err);
      showNotification(
        err?.message || "Access Denied: Neural signature mismatch.",
        "error",
        6000,
      );
      setIsAuthenticating(false);
      setLoadingProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-blue/20 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {!isAuthenticating ? (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-8 w-full max-w-md relative z-10 neon-border"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-neon-blue/10 rounded-2xl flex items-center justify-center mb-4 border border-neon-blue/30">
                <Cpu className="text-neon-blue w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter neon-text">
                AcadLinkEdu
              </h1>
              <p className="text-white/50 text-sm mt-2">
                {isRegistering
                  ? "Create new neural identity"
                  : "Initialize neural connection"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors text-white placeholder:text-white/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 ml-1">
                      Sector Role
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          role === "student"
                            ? "border-neon-blue text-neon-blue bg-neon-blue/10"
                            : "border-white/10 text-white/40"
                        }`}
                      >
                        STUDENT
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          role === "teacher"
                            ? "border-neon-purple text-neon-purple bg-neon-purple/10"
                            : "border-white/10 text-white/40"
                        }`}
                      >
                        TEACHER
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 ml-1">
                  Identity Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@acadlink.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors text-white placeholder:text-white/20"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full cyber-button flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                {isRegistering ? "REGISTER IDENTITY" : "AUTHORIZE ACCESS"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-white/40 hover:text-neon-blue transition-colors uppercase tracking-widest"
              >
                {isRegistering
                  ? "Already have an identity? Login"
                  : "New sector member? Register"}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <Shield size={12} />
                SECURE LINK ACTIVE
              </div>
              <div>v2.0.26_ALPHA</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 relative z-10"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/5"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="502.6"
                  strokeDashoffset={502.6 - (502.6 * loadingProgress) / 100}
                  className="text-neon-blue"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold neon-text">
                  {loadingProgress}%
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
                  Syncing...
                </span>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-neon-blue font-mono text-sm animate-pulse">
                {loadingProgress < 30 && "Decrypting neural patterns..."}
                {loadingProgress >= 30 &&
                  loadingProgress < 60 &&
                  "Establishing secure tunnel..."}
                {loadingProgress >= 60 &&
                  loadingProgress < 90 &&
                  "Verifying academic credentials..."}
                {loadingProgress >= 90 && "Finalizing interface..."}
              </p>
              <div className="flex gap-1 justify-center">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-1 h-1 bg-neon-blue rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
