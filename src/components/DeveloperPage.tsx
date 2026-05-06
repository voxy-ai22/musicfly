import { motion } from "motion/react";
import { ArrowLeft, Globe, Youtube, Twitter, Instagram, Coffee, Download, CheckCircle2 } from "lucide-react";

interface DeveloperPageProps {
  onBack: () => void;
}

export default function DeveloperPage({ onBack }: DeveloperPageProps) {
  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-[60] overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <header className="h-14 flex items-center px-4 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 -ml-2">
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="ml-4 font-bold text-lg">Tentang</h1>
      </header>

      <main className="p-6">
        <span className="text-[#1db954] text-xs font-bold uppercase tracking-widest">Lead Developer</span>
        
        {/* Profile Card */}
        <div className="flex flex-col items-center mt-12 mb-8">
          <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-tr from-green-500/20 to-transparent rounded-full blur-2xl animate-pulse" />
             <div className="size-48 rounded-full overflow-hidden border-4 border-[#1f1f1f] shadow-2xl relative mb-6">
               <img 
                 src="https://c.termai.cc/i165/w1eLXm.jpg" 
                 className="w-full h-full object-cover bg-black" 
                 alt="NexaDev" 
               />
             </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
             <h2 className="text-2xl font-black tracking-tight">NexaDev</h2>
             <CheckCircle2 className="size-5 text-blue-500 fill-current" />
          </div>
          <p className="text-white/60 text-center text-sm leading-relaxed max-w-xs">
            Platform streaming musik modern gratis tanpa iklan. Nikmati jutaan lagu, buat daftar putar Anda sendiri, dan temukan musik baru setiap hari dengan kualitas audio premium tanpa batasan.
          </p>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-4 gap-3 mb-6">
           {[
             { icon: Globe, label: "Website" },
             { icon: Youtube, label: "Saluran" },
             { icon: Twitter, label: "X" },
             { icon: Instagram, label: "Instagram" }
           ].map((social) => (
             <button key={social.label} className="bg-[#1f1f1f] p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-white/5 transition-colors">
               <social.icon className="size-5" />
               <span className="text-[10px] text-white/40">{social.label}</span>
             </button>
           ))}
        </div>

        {/* Buy Me Coffee */}
        <button className="w-full bg-[#1f1f1f] p-4 rounded-xl flex items-center gap-4 mb-6 hover:bg-white/5 transition-colors">
          <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
             <Coffee className="size-5 text-green-500" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">Like what I do?</div>
            <div className="text-xs text-white/40">Buy me a coffee</div>
          </div>
        </button>

        {/* Download APK */}
        <button className="w-full bg-[#1f1f1f] p-5 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-white/5 transition-colors border border-white/5">
          <Download className="size-5" />
          <span>Download APK</span>
        </button>
      </main>
    </div>
  );
}
