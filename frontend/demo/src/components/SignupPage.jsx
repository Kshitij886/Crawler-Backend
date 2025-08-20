import React, { useState } from "react";
import axios from 'axios'

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signin = async () => {
    if (!email || !password) {
      setError("All fields are necessary.");
      return
    }
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/sign-in", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      window.location.href = "/dashboard";
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className=" h-screen w-full grid grid-cols-1 lg:grid-cols-12">
        {/*Left side bar */}
        <div className="  lg:col-span-7 bg-gradient-to-br from-black to-zinc-800 text-white p-10  ">
          <h1 className="text-4xl font-semibold leading-tight flex item-center justify-center mt-25 mb-8 ml-20">
            Turn company website into qualified leads.
          </h1>
          <ul className="mt-6 space-y-3 text-lg text-zinc-200 ml-23">
            <li>• Crawl domains at scale with retries & backoff</li>
            <li>• Extract emails, phones, socials and locations</li>
            <li>• Detect tech stacks via Wappalyzer</li>
            <li>• Export to CSV, Google Sheets, AirTable, CRM</li>
          </ul>
          <div className="mt-12 text-zinc-400 text-sm ml-24">
            By continuing you agree to our Terms & Privacy.
          </div>
        </div>
        {/*Right side bar*/}
        <div className="lg:col-span-4  p-2">
          <div className="bg-white flex item-center justify-center rounded-2xl  p-6 mt-25 ml-10">
            <div className="w-full max-w-md">
              <div className="gap-3 mb-15 flex items-center">
                <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center font-semibold text-white shadow-xl">
                  LC
                </div>
                <div>
                  <div className="font-semibold text-shadow-sm">
                    Lead Crawler
                  </div>
                  <div className="text-xs text-zinc-500">Prospect smarter</div>
                </div>
              </div>
              <h1 className="font-semibold text-xl text-zinc-900">
                Welcome back
              </h1>
              <p className="text-zinc-500 text-sm font-semibold-sm mt-1">
                Sign in to manage crawls and exports.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-zinc-600 text-sm">Email</label>
                  <input
                    value={email}
                    placeholder="you@company.com"
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="mt-1 relative">
                  <label className="text-zinc-600 text-sm">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••"
                    type={show ? "text" : "password"}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    onClick={() => setShow(!show)}
                    className="absolute right-2 mt-3 text-xs px-2 py-1 rounded-md border border-zinc-300 bg-white cursor-pointer 
                     hover:bg-zinc-100 active:focus:ring-2 focus:ring-zinc-900 transition-all duration-100 ease-in-out "
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="text-red-400 text-xs mt-3">{error}</div>
                <div className="mt-10 text-white bg-black rounded-sm flex items-center verify-center ">
                  <button
                    onClick={signin}
                    disabled={loading}
                    className={`w-full rounded-lg shadow-2xl text-white py-2 text-sm active:bg-zinc-800 hover:bg-zinc-900 transition-colors duration-300 ${
                      loading
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SignupPage;
