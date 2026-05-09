import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Menu, X, ChevronDown, Target, Users, Calendar, Radio, QrCode, BarChart3, HeartHandshake, GraduationCap, Mail, Video, Bot, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@assets/Plegit Logo Blue_1761395766884.png";

const toolsMenu = [
  {
    icon: Target,
    title: "Campaign Management",
    description: "Create and manage fundraising campaigns",
    link: "/tools/campaigns",
    available: true,
  },
  {
    icon: Users,
    title: "Donor CRM",
    description: "Track donor relationships and giving history",
    link: "/tools/donor-crm",
    available: true,
  },
  {
    icon: Calendar,
    title: "Event Ticketing",
    description: "Sell tickets and manage registrations",
    link: "/tools/events",
    available: true,
  },
  {
    icon: Radio,
    title: "Livestream Giving",
    description: "Accept donations during livestreams",
    link: "/tools/livestream",
    available: true,
  },
  {
    icon: QrCode,
    title: "QR Donations",
    description: "Instant giving with QR codes",
    link: "/tools/qr-donations",
    available: true,
  },
  {
    icon: UserCheck,
    title: "Volunteer Management",
    description: "Coordinate volunteers and track hours",
    link: "/tools/volunteers",
    available: true,
  },
  {
    icon: HeartHandshake,
    title: "Beneficiary Tracking",
    description: "Track support and measure impact",
    link: "/tools/beneficiaries",
    available: true,
  },
  {
    icon: GraduationCap,
    title: "Classes & Activities",
    description: "Manage classes and attendance",
    link: "/tools/classes",
    available: true,
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your organisation's performance",
    link: "/tools/analytics",
    available: true,
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Build and send beautiful emails",
    link: "/tools/email-campaigns",
    available: true,
  },
  {
    icon: Video,
    title: "Sermon & Media Library",
    description: "Store and share sermons and videos",
    link: "/tools/media-library",
    available: true,
  },
  {
    icon: Bot,
    title: "AI Chatbot",
    description: "Your AI assistant for donors",
    link: "/tools/ai-chatbot",
    available: true,
  },
];

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <img 
              src={logoImage} 
              alt="Plegit" 
              className="h-8 w-auto cursor-pointer"
              onClick={() => setLocation("/")}
              data-testid="img-logo"
            />
            
            <nav className="hidden md:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-sm font-medium gap-1"
                    data-testid="button-tools-menu"
                  >
                    Plegit Tools
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-2" align="start">
                  {toolsMenu.map((tool, index) => (
                    <DropdownMenuItem 
                      key={index}
                      className={`flex items-start gap-3 p-3 ${tool.available ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                      onClick={() => tool.link && setLocation(tool.link)}
                      disabled={!tool.available}
                      data-testid={`dropdown-tool-${index}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <tool.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{tool.title}</p>
                          {!tool.available && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <a
                href="#modules"
                className="text-sm font-medium text-foreground transition-colors hover-elevate px-3 py-2 rounded-md"
                data-testid="link-modules"
              >
                Modules
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-foreground transition-colors hover-elevate px-3 py-2 rounded-md"
                data-testid="link-faq"
              >
                FAQ
              </a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Login
            </Button>
            <Button 
              onClick={() => setLocation("/register")}
              data-testid="button-start-free"
            >
              Start Free
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Plegit Tools
              </p>
              {toolsMenu.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (tool.link) {
                      setLocation(tool.link);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-left ${tool.available ? 'hover-elevate' : 'opacity-60 cursor-default'}`}
                  disabled={!tool.available}
                  data-testid={`mobile-tool-${index}`}
                >
                  <tool.icon className="h-4 w-4 text-primary" />
                  <span className="flex-1">{tool.title}</span>
                  {!tool.available && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                  )}
                </button>
              ))}
              <div className="border-t my-2" />
              <a
                href="#modules"
                className="px-3 py-2 text-sm font-medium hover-elevate rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="link-modules-mobile"
              >
                Modules
              </a>
              <a
                href="#faq"
                className="px-3 py-2 text-sm font-medium hover-elevate rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="link-faq-mobile"
              >
                FAQ
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    setLocation("/login");
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="button-login-mobile"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => {
                    setLocation("/register");
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="button-start-free-mobile"
                >
                  Start Free
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
