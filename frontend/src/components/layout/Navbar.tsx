import { Sun, MessageSquare, Bell, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-[#1a1a1a] h-16 flex items-center px-6 sticky top-0 z-50 border-b border-[#262626]">
      {/* Logo e Dashboard */}
      <div className="flex items-center gap-6">
        {/* Logo fz */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">fz</span>
          </div>
          <span className="font-bold text-lg text-white">fazelo</span>
        </div>

        {/* Dashboard Link */}
        <div className="flex items-center gap-2 text-white cursor-pointer hover:opacity-80 transition-opacity">
          <LayoutGrid className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle (Sol) */}
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Sun className="w-5 h-5 text-orange-500" />
        </button>

        {/* Messages */}
        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="absolute -top-0.5 -right-0.5 bg-white text-black text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
            4
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute -top-0.5 -right-0.5 bg-white text-black text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Avatar */}
        <button className="flex items-center gap-2.5 p-2 hover:bg-white/5 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <span className="text-white font-semibold text-sm">A</span>
          </div>
          <span className="font-medium text-white hidden sm:block">ana_laura</span>
        </button>
      </div>
    </nav>
  );
}