"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, 
  ArrowRight, Loader2, VenusAndMars, ShieldCheck 
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import khancosmeticslogo from "../../public/khancoslogo.png"

const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    mobile: "",
    gender: "",
    role: "User", // Required by your backend schema
  });

  const [otp, setOtp] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Request OTP via Axios
  const handleSignupDetails = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${serverurl}/auth/signupotp`, formData);

      if (data.success || data.message.includes("sent")) {
        toast.success(data.message || "Security code sent to your email!");
        setStep(2);
      } else {
        toast.error(data.message || "Failed to initiate signup.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Connection to secure server failed.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via Axios
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Endpoint matches your router spelling: /verifysignuptop
      const { data } = await axios.post(`${serverurl}/auth/verifysignuptop`, {
        email: formData.email,
        otp,
      });

      if (data.success) {
        toast.success("Account Verified,Signup Successfully!");
        // Add redirect logic here (e.g., window.location.href = "/dashboard")
      } else {
        toast.error(data.message || "Invalid OTP.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Verification failed.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] flex items-center justify-center p-6 font-sans selection:bg-purple-100 selection:text-purple-900">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Soft Premium Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-50/50 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100/30 blur-[120px] -z-10 rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row"
      >
        
        {/* Visual Brand Section */}
        <div className="w-full md:w-[40%] bg-black p-10 flex flex-col justify-between text-white relative">
          <div className="z-10">
            <h2 className="text-xl font-bold tracking-tighter mb-16">
              KHAN<span className="text-purple-500">COSMETICS</span>
            </h2>
            <div className="space-y-6">
              <h3 className="text-3xl font-medium leading-tight">
                Empowering <br /> beauty for <br /> 
                <span className="italic font-serif text-purple-400">everyone.</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Join our  global community and access world-class unisex skincare and cosmetics.
              </p>
            </div>
          </div>

          <div className="z-10 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            <ShieldCheck size={14} className="text-purple-500" />
            End-to-End Encrypted Verification
          </div>

          {/* Abstract Purple Accent for the Dark Side */}
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-purple-600/20 blur-[60px] rounded-full" />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-[60%] p-10 md:p-14 bg-white">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <header className="mb-10">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your Account</h1>
                  <p className="text-gray-500 text-sm mt-1">Experince the high quality international branded cosmetics</p>
                </header>

                <form onSubmit={handleSignupDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Fullname */}
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
                      <input 
                        name="fullname" type="text" required placeholder="Full Name"
                        value={formData.fullname} onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
                      />
                    </div>
                    {/* Email */}
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
                      <input 
                        name="email" type="email" required placeholder="Email Address"
                        value={formData.email} onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Password with Toggle */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
                    <input 
                      name="password" type={showPassword ? "text" : "password"} required placeholder="Secure Password"
                      value={formData.password} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-12 outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
                    />
                    <button 
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
                    <input 
                      name="mobile" type="tel" placeholder="Mobile "
                      value={formData.mobile} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-50 transition-all text-sm"
                    />
                  </div>

                  {/* Gender Selector */}
                  <div className="pt-2">
                    <div className="flex gap-3">
                      {["Male", "Female", "Other"].map((g) => (
                        <label key={g} className="flex-1">
                          <input 
                            type="radio" name="gender" value={g} required
                            className="hidden peer" onChange={handleInputChange}
                          />
                          <div className="w-full text-center py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold cursor-pointer peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-600 transition-all">
                            {g}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full mt-6 bg-purple-600 hover:bg-black text-white font-bold py-4 rounded-2xl flex justify-center items-center group transition-all duration-300 shadow-lg shadow-purple-100"
                  >
                    {loading ? <Loader2 className="animate-spin cursor-pointer" /> : (
                      <>
                        Request OTP
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-full flex flex-col justify-center"
              >
                <header className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-50 rounded-full text-purple-600 mb-4">
                    <ShieldCheck size={28} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verify Security Code</h1>
                  <p className="text-gray-500 text-sm mt-1">We sent a verification code to your email.</p>
                </header>

                <form onSubmit={handleVerifyOtp} className="space-y-6 max-w-sm mx-auto w-full">
                  <input 
                    type="text" maxLength={6} required
                    placeholder="0 0 0 0 0 0"
                    value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                  <button 
                    disabled={loading || otp.length < 6}
                    className="w-full bg-black hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-gray-200 flex justify-center items-center"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Sign Up"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-gray-400 text-sm hover:text-purple-600 transition-colors"
                  >
                    Back to edit details
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;