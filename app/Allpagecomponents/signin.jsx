
"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { serverurl } from "../utils/constants/serverurl";

const Signin = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
  const [otp, setOtp] = useState('');

  const handleInputChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Step 1: Submit Credentials & Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${serverurl}/auth/signinotp`, credentials);
      if (response.data.message === "OTP sent") {
        setStep(2); // Move to OTP verification screen
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${serverurl}/auth/verifysigninotp`, {
        email: credentials.email,
        otp: otp
      }, { 
        withCredentials: true // Crucial for receiving the HTTP-only cookie from your backend
      });

      if (response.data.success) {
        // Redirect to dashboard or home page after successful login
        window.location.href = '/dashboard'; 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Smooth spatial transitions
  const formVariants = {
    hidden: { opacity: 0, scale: 0.95, x: 20 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, scale: 0.95, x: -20, transition: { duration: 0.3, ease: 'easeIn' } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070214] relative overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Ambient Animated Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[140px] animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[140px] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-fuchsia-600/20 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md p-4">
        <motion.div 
          className="backdrop-blur-[40px] bg-[#110826]/60 border border-purple-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-8 sm:p-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(147,51,234,0.4)]"
            >
              <Lock className="w-7 h-7 text-white" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Welcome Back
            </h1>
            <p className="text-purple-200/50 text-sm font-medium">
              Khan Cosmetics
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="login-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleRequestOtp}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/40 group-focus-within:text-purple-400 transition-colors" />
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="Email Address" 
                      value={credentials.email} 
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.05] transition-all" 
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/40 group-focus-within:text-purple-400 transition-colors" />
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      placeholder="Password" 
                      value={credentials.password} 
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-purple-200/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.05] transition-all" 
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Forgot Password?
                  </a>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(147,51,234,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Sign In 
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
                
                <p className="text-center text-sm text-purple-200/40 mt-6">
                  Don't have an account? <a href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign up</a>
                </p>
              </motion.form>

            ) : (

              <motion.form 
                key="otp-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="text-center space-y-2 mb-2">
                  <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full border border-purple-500/20 mb-2">
                    <ShieldCheck className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">2-Step Verification</h3>
                  <p className="text-purple-200/50 text-sm leading-relaxed">
                    We sent a security code to <br/>
                    <span className="text-purple-300 font-medium">{credentials.email}</span>
                  </p>
                </div>

                <div className="relative group">
                  <input 
                    type="text" 
                    maxLength={6}
                    required 
                    placeholder="• • • • • •" 
                    value={otp} 
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-4 text-center text-3xl tracking-[0.5em] text-white placeholder-purple-200/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:bg-white/[0.05] transition-all font-mono" 
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(147,51,234,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || otp.length < 6}
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Authentication'}
                </motion.button>
                
                <div className="text-center mt-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                    }}
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to login
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Signin;