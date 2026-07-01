"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "../../lib/authActions";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "#111",
  border: "1px solid #1e1e1e",
  borderRadius: 6,
  color: "#f0f0f0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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

    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Correo/celular o contraseña incorrectos");
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  };

  const handleGoogle = () => signIn("google", { callbackUrl: "/" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0c0c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#111",
        borderRadius: 12,
        padding: 36,
        border: "1px solid #1e1e1e",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#f0f0f0", letterSpacing: -0.5 }}>
            Finance
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            {mode === "login" ? "Inicia sesión en tu cuenta" : "Crea tu cuenta"}
          </div>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width: "100%",
          padding: "10px",
          borderRadius: 6,
          border: "none",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          background: "#fff",
          color: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 20,
        }}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.05 29.53 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.1 5.52C12.4 13.65 17.73 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.57C43.18 37.16 46.52 31.32 46.52 24.5z"/>
            <path fill="#FBBC05" d="M10.74 28.26A14.6 14.6 0 0 1 9.5 24c0-1.48.26-2.9.72-4.26l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.5 2.56 10.72l8.18-6.46z"/>
            <path fill="#34A853" d="M24 47c5.53 0 10.17-1.83 13.56-4.97l-7.18-5.57C28.6 37.8 26.42 38.5 24 38.5c-6.27 0-11.6-4.15-13.26-9.74l-8.18 6.46C6.07 42.55 14.4 47 24 47z"/>
          </svg>
          Continuar con Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          <span style={{ fontSize: 11, color: "#333" }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "register" && (
            <input
              placeholder="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          )}
          <input
            placeholder="Correo electrónico o celular"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            style={INPUT_STYLE}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={INPUT_STYLE}
          />

          {error && (
            <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</div>
          )}
          {success && (
            <div style={{ fontSize: 12, color: "#4ade80", textAlign: "center" }}>{success}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%",
            padding: "10px",
            borderRadius: 6,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#1a1a1a" : "#f0f0f0",
            color: loading ? "#555" : "#0c0c0c",
            marginTop: 4,
          }}>
            {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#555" }}>
          {mode === "login" ? (
            <>¿No tienes cuenta?{" "}
              <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                Regístrate
              </button>
            </>
          ) : (
            <>¿Ya tienes cuenta?{" "}
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
