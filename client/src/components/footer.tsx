import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Heart } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Plegit Logo Blue_1761395766884.png";

export function Footer() {
  const [_, setLocation] = useLocation();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <img src={logoImage} alt="Plegit" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">
              The all-in-one platform helping charities and faith-based organisations go digital.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Bank-level Security</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Plegit Tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => setLocation("/tools/campaigns")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Campaign Management
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/donor-crm")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Donor CRM
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/events")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Event Ticketing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/livestream")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Livestream Giving
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/qr-donations")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  QR Donations
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/analytics")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analytics Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/volunteers")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volunteer Management
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/beneficiaries")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Beneficiary Tracking
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/classes")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Classes & Activities
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/email-campaigns")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Email Campaigns
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/media-library")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sermon & Media Library
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/tools/ai-chatbot")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI Chatbot
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#modules" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Modules
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get tips on fundraising and platform updates
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Your email" 
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button data-testid="button-subscribe">
                Subscribe
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <Lock className="h-3 w-3" />
              <span>We respect your privacy</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>for communities worldwide</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <span>&copy; {new Date().getFullYear()} Plegit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
