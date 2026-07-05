"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "../../lib/authActions";

export default function LoginPage() {
  const [mode, setMode]             = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [name, setName]             = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState("");

  const handleCredentials = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const res = await registerUser({ name, identifier, password });
      if (res.error) { setError(res.error); setLoading(false); return; }
      setSuccess("Cuenta creada. Ahora inicia sesión.");
      setMode("login");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", { identifier, password, redirect: false });
    if (res?.error) setError("Correo/celular o contraseña incorrectos");
    else window.location.href = "/summary";
    setLoading(false);
  };

  const inputCls = "w-full px-3 py-2.5 bg-surface border border-border rounded-md text-text text-[13px] outline-none placeholder:text-muted";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-surface border border-border rounded-xl p-9">

        <div className="text-center mb-7">
          <div className="text-[22px] font-semibold text-text tracking-tight">Finance</div>
          <div className="text-[12px] text-muted mt-1.5">
            {mode === "login" ? "Inicia sesión en tu cuenta" : "Crea tu cuenta"}
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/summary" })}
          className="w-full py-2.5 rounded-md text-[13px] font-medium cursor-pointer bg-white text-[#111] flex items-center justify-center gap-2.5 mb-5 border-none"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.05 29.53 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.1 5.52C12.4 13.65 17.73 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.57C43.18 37.16 46.52 31.32 46.52 24.5z"/>
            <path fill="#FBBC05" d="M10.74 28.26A14.6 14.6 0 0 1 9.5 24c0-1.48.26-2.9.72-4.26l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.5 2.56 10.72l8.18-6.46z"/>
            <path fill="#34A853" d="M24 47c5.53 0 10.17-1.83 13.56-4.97l-7.18-5.57C28.6 37.8 26.42 38.5 24 38.5c-6.27 0-11.6-4.15-13.26-9.74l-8.18 6.46C6.07 42.55 14.4 47 24 47z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-dim">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleCredentials} className="flex flex-col gap-2.5">
          {mode === "register" && (
            <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
          )}
          <input placeholder="Correo electrónico o celular" value={identifier} onChange={e => setIdentifier(e.target.value)} required className={inputCls} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />

          {error   && <div className="text-[12px] text-[#f87171] text-center">{error}</div>}
          {success && <div className="text-[12px] text-[#4ade80] text-center">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-md text-[13px] font-semibold mt-1 border-none transition-colors
              ${loading ? "bg-btn text-dim cursor-not-allowed" : "bg-text text-bg cursor-pointer"}`}
          >
            {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <div className="text-center mt-5 text-[12px] text-muted">
          {mode === "login" ? (
            <>¿No tienes cuenta?{" "}
              <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className="bg-transparent border-none text-muted cursor-pointer text-[12px] underline">
                Regístrate
              </button>
            </>
          ) : (
            <>¿Ya tienes cuenta?{" "}
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="bg-transparent border-none text-muted cursor-pointer text-[12px] underline">
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
