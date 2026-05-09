"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight, Hexagon, Activity, ShieldCheck, Globe, Zap, Smartphone, Layers, ArrowUpRight, ArrowRight, Cpu, Coins, Wallet, LineChart, CreditCard } from "lucide-react";
import { useRef } from "react";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  // Reusable fade-up component for scroll
  const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-gray-100 font-sans selection:bg-white/20 overflow-x-hidden">
      
      {/* Absolute strict minimalist background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,#111827_0%,#000000_80%)] opacity-80" />

      {/* ULTRA MINIMAL HEADER */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center p-1.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-md group-hover:bg-white/10 transition-colors">
              <Hexagon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-medium tracking-wide text-white">
              9Aus
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-1.5 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 pt-32 pb-24 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-[1400px] mx-auto px-6 flex flex-col items-center text-center mt-12 md:mt-24 mb-32 relative">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            <SparkleIcon className="h-4 w-4 text-gray-300" />
            <span className="text-xs font-semibold tracking-widest text-gray-200 uppercase">The Ultra Architecture</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-white mb-6 drop-shadow-2xl"
          >
            Pro. <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700">
              Beyond.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light tracking-wide mb-10"
          >
            The ultimate trading experience engineered for precision. Zero friction. Absolute control. Unmatched speed.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-6 z-20"
          >
            <Link
              href="/signup"
              className="group flex flex-row w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              Start Trading 
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="group flex w-full sm:w-auto justify-center items-center gap-2 text-lg font-medium text-gray-300 hover:text-white transition-colors"
            >
              Explore Platform <ArrowUpRight className="h-5 w-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </section>

        {/* FLOATING GLASS CARDS SHOWCASE */}
        <section className="w-full max-w-6xl mx-auto px-6 mb-40 relative h-[600px] flex items-center justify-center perspective-1000">
          <motion.div 
             animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }} 
             transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-0 bg-blue-500 rounded-full blur-[150px] -z-10" 
          />
          
          {/* Center Main Card */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute z-30 w-full max-w-[350px] p-6 sm:p-8 rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          >
             <div className="flex items-center justify-between mb-8 sm:mb-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                   <Activity className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-right">
                   <div className="text-white font-medium text-lg tracking-wide">Bitcoin</div>
                   <div className="text-gray-500 text-sm font-medium">BTC/USD</div>
                </div>
             </div>
             <div className="text-5xl sm:text-6xl font-light text-white tracking-tighter mb-3">$73,709</div>
             <div className="text-green-400 font-medium flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> +2.45% Today</div>
             <div className="mt-8 sm:mt-10 h-20 sm:h-24 w-full relative">
                <svg className="absolute bottom-0 w-full h-full left-0 z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0 80 Q 20 60, 35 75 T 65 40 T 100 10" fill="none" stroke="#60a5fa" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <circle cx="100" cy="10" r="3" fill="#ffffff" className="drop-shadow-[0_0_10px_#ffffff]" />
                </svg>
             </div>
          </motion.div>

          {/* Left Floating Card */}
          <motion.div 
            initial={{ opacity: 0, x: -50, rotateY: 30, scale: 0.8 }}
            whileInView={{ opacity: 1, x: -280, rotateY: 15, scale: 0.9 }}
            whileHover={{ scale: 0.95, x: -290, rotateY: 5, zIndex: 40 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="absolute z-20 w-[320px] p-8 rounded-[2.5rem] bg-black/30 backdrop-blur-2xl border border-white/5 shadow-2xl origin-right hidden md:block"
          >
             <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                   <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                   <div className="text-white font-medium tracking-wide">Ethereum</div>
                   <div className="text-gray-500 text-sm">ETH/USD</div>
                </div>
             </div>
             <div className="text-4xl font-light text-white/90 tracking-tight mb-2">$2,155.03</div>
             <div className="text-green-400/90 text-sm flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />+1.70%</div>
          </motion.div>

          {/* Right Floating Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotateY: -30, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 280, rotateY: -15, scale: 0.9 }}
            whileHover={{ scale: 0.95, x: 290, rotateY: -5, zIndex: 40 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="absolute z-20 w-[320px] p-8 rounded-[2.5rem] bg-black/30 backdrop-blur-2xl border border-white/5 shadow-2xl origin-left hidden md:block"
          >
             <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                   <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="text-right">
                   <div className="text-white font-medium tracking-wide">Solana</div>
                   <div className="text-gray-500 text-sm">SOL/USD</div>
                </div>
             </div>
             <div className="text-4xl font-light text-white/90 tracking-tight mb-2">$92.50</div>
             <div className="text-red-400/90 text-sm flex items-center gap-1"><ArrowUpRight className="w-3 h-3 rotate-90" />-4.68%</div>
          </motion.div>
        </section>

        {/* INFINITE MARQUEE - TICKERS */}
        <section className="w-full border-y border-white/5 bg-white/[0.02] py-6 overflow-hidden mb-32 flex whitespace-nowrap">
           <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-12 px-6"
           >
              {[
                { name: "Bitcoin", sym: "BTC", val: "+2.4%" },
                { name: "Ethereum", sym: "ETH", val: "+1.8%" },
                { name: "S&P 500", sym: "SPY", val: "+0.9%" },
                { name: "Tesla", sym: "TSLA", val: "-1.2%" },
                { name: "Apple", sym: "AAPL", val: "+3.1%" },
                { name: "NVIDIA", sym: "NVDA", val: "+5.6%" },
                { name: "Gold", sym: "XAU", val: "+0.4%" },
                { name: "Solana", sym: "SOL", val: "+8.2%" },
              ].map((asset, i) => (
                <div key={i} className="flex items-center gap-3">
                   <span className="font-bold text-white text-lg">{asset.sym}</span>
                   <span className="text-gray-500">{asset.name}</span>
                   <span className={asset.val.startsWith('+') ? "text-green-400" : "text-red-400"}>{asset.val}</span>
                </div>
              ))}
              {/* Duplicate for infinite loop illusion */}
              {[
                { name: "Bitcoin", sym: "BTC", val: "+2.4%" },
                { name: "Ethereum", sym: "ETH", val: "+1.8%" },
                { name: "S&P 500", sym: "SPY", val: "+0.9%" },
                { name: "Tesla", sym: "TSLA", val: "-1.2%" },
                { name: "Apple", sym: "AAPL", val: "+3.1%" },
                { name: "NVIDIA", sym: "NVDA", val: "+5.6%" },
              ].map((asset, i) => (
                 <div key={'dup'+i} className="flex items-center gap-3">
                   <span className="font-bold text-white text-lg">{asset.sym}</span>
                   <span className="text-gray-500">{asset.name}</span>
                   <span className={asset.val.startsWith('+') ? "text-green-400" : "text-red-400"}>{asset.val}</span>
                </div>
              ))}
           </motion.div>
        </section>

        {/* PREMIUM BENTO GRID */}
        <section className="w-full max-w-[1400px] mx-auto px-6 mb-40">
          <FadeUp>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-6">Absolute Advantage.</h2>
              <p className="text-xl text-gray-400 font-light">Every tool you need, beautifully integrated into one single glass pane.</p>
            </div>
          </FadeUp>

          {/* Master Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto md:auto-rows-[400px]">
             
             {/* Card 1: Lightning Execution (Large, spans 8 cols) */}
             <FadeUp delay={0.1} className="md:col-span-8 h-full">
               <div className="relative h-full min-h-[400px] overflow-hidden rounded-[2.5rem] bg-[#0A0D14] border border-white/5 p-10 flex flex-col justify-between group shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                 
                 {/* Visual Background */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] -translate-y-1/3 translate-x-1/4 opacity-60">
                   <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                   <div className="absolute inset-8 border border-indigo-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                   <div className="absolute inset-16 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Zap className="w-32 h-32 text-blue-500 filter drop-shadow-[0_0_30px_#3b82f6]" />
                   </div>
                 </div>

                 <div className="relative z-10 max-w-md mt-auto">
                   <h3 className="text-4xl font-medium text-white mb-4">Lightning Execution.</h3>
                   <p className="text-gray-400 text-lg leading-relaxed">
                     Trade execution within 5 milliseconds. Never miss an entry or exit point again. Built directly on proprietary VIP routing networks.
                   </p>
                 </div>
               </div>
             </FadeUp>

             {/* Card 2: Security (Tall, spans 4 cols) */}
             <FadeUp delay={0.2} className="md:col-span-4 h-full">
               <div className="relative h-full min-h-[400px] overflow-hidden rounded-[2.5rem] bg-[#0A0D14] border border-white/5 p-10 flex flex-col items-center justify-center text-center group shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-green-500/10 blur-[80px] rounded-full group-hover:bg-green-500/20 transition-colors" />

                 <div className="relative z-10 w-full flex flex-col items-center">
                   <div className="mx-auto w-24 h-24 mb-10 rounded-3xl bg-[#0F141F] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-green-500/50 transition-all duration-500">
                     <ShieldCheck className="w-12 h-12 text-green-400" />
                   </div>
                   <h3 className="text-3xl font-medium text-white mb-4">Fort Knox.</h3>
                   <p className="text-gray-400 leading-relaxed text-sm">
                     Military grade encryption & cold storage for your digital assets.
                   </p>
                 </div>
               </div>
             </FadeUp>

             {/* Card 3: Global Liquidity (Spans 5 cols) */}
             <FadeUp delay={0.3} className="md:col-span-5 h-full">
               <div className="relative h-full min-h-[400px] overflow-hidden rounded-[2.5rem] bg-[#0A0D14] border border-white/5 p-10 flex flex-col justify-end group shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 right-0 w-full h-full opacity-10" 
                      style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
                 />
                 
                 <div className="absolute top-10 right-10 flex space-x-3">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" style={{animationDelay: '0.5s'}}></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                 </div>

                 <div className="relative z-10 w-full">
                   <div className="flex items-center gap-4 mb-6">
                      <Globe className="w-12 h-12 text-white/30 group-hover:text-blue-400 transition-colors duration-500 drop-shadow-md" />
                   </div>
                   <h3 className="text-3xl font-medium text-white mb-3">Global Array.</h3>
                   <p className="text-gray-400 text-lg leading-relaxed">
                     Aggregated internal order books from the world&apos;s deepest liquidity pools.
                   </p>
                 </div>
               </div>
             </FadeUp>

             {/* Card 4: Multi-platform (Spans 7 cols) */}
             <FadeUp delay={0.4} className="md:col-span-7 h-full">
               <div className="relative h-full min-h-[400px] overflow-hidden rounded-[2.5rem] bg-[#0A0D14] border border-white/5 p-10 flex flex-col justify-between group shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                 <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-gradient-to-tl from-purple-500/10 to-transparent translate-x-1/4 translate-y-1/4 rounded-tl-full pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex grow gap-10 items-center justify-end mb-10 opacity-30 group-hover:opacity-100 transition-opacity duration-700">
                       <Smartphone className="w-20 h-20 text-white" />
                       <div className="w-1.5 h-16 bg-white/20 rounded-full" />
                       <Layers className="w-24 h-24 text-white" />
                    </div>
                    
                    <div className="max-w-md">
                      <h3 className="text-3xl font-medium text-white mb-3">Perfect Sync.</h3>
                      <p className="text-gray-400 text-lg leading-relaxed">
                        A flawlessly tailored experience across web, responsive mobile, and native platforms everywhere.
                      </p>
                    </div>
                 </div>
               </div>
             </FadeUp>

          </div>
        </section>

        {/* QUANTUM ENGINE SHOWCASE (APPLE SILICON STYLE) */}
        <section className="w-full max-w-[1400px] mx-auto px-6 py-20 sm:py-40 overflow-hidden relative border-y border-white/5 bg-gradient-to-br from-black to-[#050A14]">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_right,#3b82f6_0%,transparent_50%)] opacity-10" />
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
             
             {/* Left Text */}
             <div className="flex-1 space-y-8 z-10">
                <FadeUp>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-4">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold tracking-widest text-blue-300 uppercase">Pro Core Engine</span>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white leading-tight">
                    M1-Grade <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                      Processing.
                    </span>
                  </h2>
                </FadeUp>
                <FadeUp delay={0.2}>
                  <p className="text-xl text-gray-400 font-light max-w-xl leading-relaxed">
                    A proprietary trading engine capable of routing 100,000 orders per second. We built our architecture from the ground up to eliminate slippage and guarantee absolute precision.
                  </p>
                </FadeUp>
                <FadeUp delay={0.4}>
                  <ul className="space-y-4">
                     <li className="flex items-center gap-4 text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                       </div>
                       Zero-latency institutional nodes
                     </li>
                     <li className="flex items-center gap-4 text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                       </div>
                       Machine learning risk mitigation
                     </li>
                  </ul>
                </FadeUp>
             </div>

             {/* Right Visualization (The "Chip") */}
             <div className="flex-1 relative flex items-center justify-center h-[500px]">
                {/* Circuit Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 500 500">
                  <path d="M 250 250 L 50 50 L 0 50" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_3s_linear_infinite]" />
                  <path d="M 250 250 L 450 50 L 500 50" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_3s_linear_infinite_reverse]" />
                  <path d="M 250 250 L 50 450 L 0 450" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />
                  <path d="M 250 250 L 450 450 L 500 450" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="5,5" />
                </svg>

                {/* The Chip */}
                <motion.div 
                  initial={{ rotateX: 30, rotateY: 30, scale: 0.8 }}
                  whileInView={{ rotateX: 0, rotateY: 0, scale: 1 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 100px rgba(59,130,246,0.4)" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative w-64 h-64 bg-black border border-white/20 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex items-center justify-center z-10"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute inset-2 border border-white/5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 blur-xl absolute" />
                  <span className="text-4xl font-bold text-white z-10 tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                    M9
                  </span>
                  
                  {/* Glowing edges */}
                  <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                </motion.div>
             </div>
          </div>
        </section>

        {/* ORBITING ECOSYSTEM SHOWCASE */}
        <section className="w-full relative py-20 sm:py-40 overflow-hidden text-center max-w-[1400px] mx-auto px-6">
          <FadeUp>
             <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-6">One continuous ecosystem.</h2>
             <p className="text-lg sm:text-xl text-gray-400 font-light mb-16 sm:mb-24 max-w-2xl mx-auto">Assets, cards, nodes and exchanges spinning in perfect harmony around your absolute control.</p>
          </FadeUp>

          <div className="relative w-[300px] h-[300px] md:w-[600px] md:h-[600px] mx-auto flex items-center justify-center mt-10 perspective-1000">
             
             {/* Center Logo */}
             <motion.div 
                whileHover={{ scale: 1.1 }}
                className="absolute z-30 w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center backdrop-blur-md"
             >
                <Hexagon className="w-12 h-12 text-white drop-shadow-[0_0_10px_#ffffff]" />
             </motion.div>

             {/* Orbit Ring 1 (Inner) */}
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[200px] h-[200px] md:w-[350px] md:h-[350px] border border-white/10 rounded-full"
             >
                {/* Icons counter-rotating to stay upright */}
                <motion.div 
                   animate={{ rotate: -360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 backdrop-blur-md border border-blue-500/30 rounded-full flex items-center justify-center"
                >
                   <Coins className="w-6 h-6 text-blue-400" />
                </motion.div>
                <motion.div 
                   animate={{ rotate: -360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-purple-500/10 backdrop-blur-md border border-purple-500/30 rounded-full flex items-center justify-center"
                >
                   <Wallet className="w-6 h-6 text-purple-400" />
                </motion.div>
             </motion.div>

             {/* Orbit Ring 2 (Outer) */}
             <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute w-[300px] h-[300px] md:w-[550px] md:h-[550px] border border-white/5 rounded-full border-dashed"
             >
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                   className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-green-500/10 backdrop-blur-md border border-green-500/30 rounded-full flex items-center justify-center"
                >
                   <LineChart className="w-5 h-5 text-green-400" />
                </motion.div>
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                   className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center"
                >
                   <Activity className="w-5 h-5 text-red-400" />
                </motion.div>
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                   className="absolute top-0 right-1/4 translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-full flex items-center justify-center"
                >
                   <CreditCard className="w-6 h-6 text-yellow-500" />
                </motion.div>
             </motion.div>

          </div>
        </section>

        {/* STATS SHOWCASE avec PARALLAX */}
        <section className="w-full bg-white/[0.02] border-y border-white/5 py-20 sm:py-32 relative overflow-hidden">
           <motion.div style={{ y: y1 }} className="hidden md:block absolute left-10 text-[10rem] lg:text-[20rem] font-black text-white/[0.03] select-none -z-10 tracking-tighter pointer-events-none">9AUS</motion.div>
           <motion.div style={{ y: y2 }} className="hidden md:block absolute right-10 bottom-0 text-[8rem] lg:text-[15rem] font-black text-white/[0.03] select-none -z-10 tracking-tighter pointer-events-none">TRADE</motion.div>
           
           <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <FadeUp delay={0.1}>
                 <div className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-4">$50B+</div>
                 <div className="text-lg text-gray-400 tracking-widest uppercase">Quarterly Volume</div>
              </FadeUp>
              <FadeUp delay={0.2}>
                 <div className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-4">2M+</div>
                 <div className="text-lg text-gray-400 tracking-widest uppercase">Active Traders</div>
              </FadeUp>
              <FadeUp delay={0.3}>
                 <div className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-4">0.0%</div>
                 <div className="text-lg text-gray-400 tracking-widest uppercase">Hidden Fees</div>
              </FadeUp>
           </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="w-full max-w-4xl mx-auto px-6 py-20 sm:py-40 text-center relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-[150px] rounded-full -z-10" />
          <FadeUp>
            <Hexagon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-6 sm:mb-8 opacity-50" />
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-8 sm:mb-10">Step into the future.</h2>
            <Link
              href="/signup"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-white text-black text-lg sm:text-xl font-semibold hover:scale-105 transition-transform duration-300 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
            >
              Open Your Account <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </FadeUp>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-white/10 bg-black backdrop-blur-3xl pt-16 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Hexagon className="h-6 w-6 text-gray-400" />
              <span className="text-xl font-medium text-gray-200">9Aus</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">The precision engineered trading platform for the modern era.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-sm text-gray-400">
             <div className="flex flex-col gap-3">
                <span className="text-white font-medium mb-2">Platform</span>
                <a href="#" className="hover:text-white transition-colors">Features</a>
                <a href="#" className="hover:text-white transition-colors">Pricing</a>
                <a href="#" className="hover:text-white transition-colors">Security</a>
             </div>
             <div className="flex flex-col gap-3">
                <span className="text-white font-medium mb-2">Company</span>
                <a href="#" className="hover:text-white transition-colors">About</a>
                <a href="#" className="hover:text-white transition-colors">Blog</a>
                <a href="#" className="hover:text-white transition-colors">Careers</a>
             </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 border-t border-white/5 pt-8">
           <p>© {new Date().getFullYear()} 9Aus Trading Ltd. All rights reserved.</p>
           <div className="flex gap-4">
             <a href="#" className="hover:text-gray-400">Privacy Policy</a>
             <a href="#" className="hover:text-gray-400">Terms of Service</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
