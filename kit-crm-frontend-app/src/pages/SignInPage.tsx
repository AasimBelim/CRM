import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { checkEmailFormat } from "@/utils/helpers";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import authService from "@/services/authService";

import loginBanner from "@/assets/Horizontal Logo White.png";
import ohrmLogo from "@/assets/ohrm_logo.png";

const SignInPage = () => {
  const navigate = useNavigate();
  const { user, setToken, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!email || !password) { toast.error("Please fill in all fields."); return; }
      if (!checkEmailFormat(email)) { toast.error("Please enter a valid email address."); return; }
      setIsLoading(true);
      const response = await authService.login(email, password);
      console.log("LOGIN RESPONSE:", response);
      console.log("EMAIL:", email);
      console.log("RESPONSE EMAIL:", response?.data?.email);

      if (response?.data?.email !== email) {
        toast.error("Invalid email or password");
        return;
      }

      // ✅ ONLY trust token (ignore backend status)
      if (!response?.data?.token) {
        toast.error("Invalid email or password");
        return;
      }

      const { message, data } = response;

      // ✅ success flow
      setEmail("");
      setPassword("");
      toast.success(message || "Sign in successful!");

      setToken(data.token);
      setUser({
        email: data.email,
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        roleId: data.roleId,
        userName: data.userName,
      });


      navigate("/");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Invalid email or password";

      toast.error(msg);
    } finally {
      setIsLoading(false);
    }

  };

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ── LEFT panel — desktop only, NO mobile ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col flex-shrink-0"
        style={{ backgroundColor: "#1e2d6b" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-14">

          {/* White card with shadow for logo */}
          <div
            className=" rounded-2xl px-10 py-7 mb-10 flex items-center justify-center w-full"
            style={{
              maxWidth: "340px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            <img src={loginBanner} alt="Ker Infotech" className="w-full object-contain" style={{ maxHeight: "70px" }} />
          </div>

          {/* Description with icons */}
          <div className="text-center" style={{ maxWidth: "300px" }}>
            {/* <h2
              className="font-bold text-xl mb-4 inline-block px-6 py-2 rounded-xl"
              style={{
                color: "#1e2d6b",
                backgroundColor: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(4px)",
                letterSpacing: "0.05em",
              }}
            >
              KIT CRM
            </h2> */}

            <div className="flex flex-col gap-3 text-left">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  text: "Manage leads, contacts & companies in one place",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  ),
                  text: "Track deals and opportunities through your pipeline",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  ),
                  text: "Real-time analytics and activity reports",
                },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    {f.icon}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-10 py-5">
          <p className="text-white/30 text-xs text-center">
            © {new Date().getFullYear()} Ker Infotech. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT panel — full screen on mobile ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 min-h-screen px-4 py-10 sm:px-8">

        {/* White form card — like OrangeHRM reference */}
        <div
          className="bg-white rounded-2xl w-full px-8 py-10"
          style={{
            maxWidth: "420px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          {/* Round icon logo */}
          <div className="flex justify-center mb-5">
            <div
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
            >
              <img src={ohrmLogo} alt="Kit CRM" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Login</h2>
            <p className="text-gray-400 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email" disabled={isLoading} required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all disabled:opacity-50"
                  onFocus={(e) => { e.target.style.borderColor = "#1e2d6b"; e.target.style.boxShadow = "0 0 0 3px rgba(30,45,107,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-600">Password</label>
                <a href="/reset-password" className="text-xs font-medium hover:underline" style={{ color: "#1e2d6b" }}>
                  Forgot your password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password" disabled={isLoading} required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all disabled:opacity-50"
                  onFocus={(e) => { e.target.style.borderColor = "#1e2d6b"; e.target.style.boxShadow = "0 0 0 3px rgba(30,45,107,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 px-6 rounded-lg text-sm font-semibold text-white transition-all duration-200 focus:outline-none active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1e2d6b", boxShadow: "0 4px 12px rgba(30,45,107,0.35)" }}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : "Login"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Kit CRM &nbsp;·&nbsp; © {new Date().getFullYear()} Ker Infotech
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;