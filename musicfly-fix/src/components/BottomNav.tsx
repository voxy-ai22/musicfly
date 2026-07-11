import { Home, Search, Library, User } from "lucide-react";
import { cn } from "../lib/utils";

interface BottomNavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function BottomNavItem({ icon: Icon, label, active, onClick }: BottomNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 flex-1 py-1 transition-colors",
        active ? "text-white" : "text-white/40"
      )}
    >
      <Icon className={cn("size-6", active && "text-green-500")} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 z-50">
      <BottomNavItem 
        icon={Home} 
        label="Beranda" 
        active={activeTab === "Home"} 
        onClick={() => setActiveTab("Home")} 
      />
      <BottomNavItem 
        icon={Search} 
        label="Mencari" 
        active={activeTab === "Search"} 
        onClick={() => setActiveTab("Search")} 
      />
      <BottomNavItem 
        icon={Library} 
        label="Pustaka" 
        active={activeTab === "Library"} 
        onClick={() => setActiveTab("Library")} 
      />
      <BottomNavItem 
        icon={User} 
        label="Profil" 
        active={activeTab === "Developer"} 
        onClick={() => setActiveTab("Developer")} 
      />
    </div>
  );
}
