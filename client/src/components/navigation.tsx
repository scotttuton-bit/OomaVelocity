import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Navigation() {
  return (
    <nav className="bg-surface border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <i className="fas fa-network-wired text-primary text-2xl mr-3"></i>
              <h1 className="text-xl font-semibold">Ooma Network Intelligence</h1>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <a href="#dashboard" className="text-primary border-b-2 border-primary px-1 pt-1 pb-4 text-sm font-medium">
                Dashboard
              </a>
              <a href="#analytics" className="text-gray-300 hover:text-white px-1 pt-1 pb-4 text-sm font-medium">
                Analytics
              </a>
              <a href="#alerts" className="text-gray-300 hover:text-white px-1 pt-1 pb-4 text-sm font-medium">
                Alerts
              </a>
              <a href="#devices" className="text-gray-300 hover:text-white px-1 pt-1 pb-4 text-sm font-medium">
                Devices
              </a>
              <a href="#maps" className="text-gray-300 hover:text-white px-1 pt-1 pb-4 text-sm font-medium">
                Network Map
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
              <i className="fas fa-bell"></i>
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-error rounded-full text-xs flex items-center justify-center">3</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <i className="fas fa-cog"></i>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64" />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
