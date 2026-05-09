import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart,
  Users,
  Calendar,
  Video,
  BarChart3,
  Smartphone,
  Palette,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Mail,
  Zap,
  Building2,
  ImageIcon,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  settings: {
    onboardingCompleted?: boolean;
  };
}

const TOTAL_STEPS = 5;

const features = [
  {
    icon: Heart,
    title: "Campaign Management",
    description: "Create and manage fundraising campaigns with AI-powered content generation",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Donor & Volunteer CRM",
    description: "Build lasting relationships with comprehensive contact management",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Calendar,
    title: "Event Ticketing",
    description: "Host events with multi-currency ticketing and QR check-in",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Video,
    title: "Livestream Giving",
    description: "Accept real-time donations during your live broadcasts",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance with customizable widgets and insights",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Design beautiful emails with our drag-and-drop builder",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

const pwaFeatures = [
  {
    icon: Smartphone,
    title: "Install on Any Device",
    description: "Add Plegit to your home screen for instant access",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Works offline and loads instantly, even on slow connections",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description: "Manage your fundraising from your phone, tablet, or desktop",
  },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#00BCD4");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/org"],
    enabled: !!orgId,
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { logoUrl?: string; primaryColor?: string; settings?: { onboardingCompleted?: boolean } }) => {
      const res = await apiRequest("PATCH", `/api/org/${orgId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org"] });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      const res = await fetch(`/api/org/${orgId}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        setLogoPreview(data.url);
        updateOrgMutation.mutate({ logoUrl: data.url });
        toast({
          title: "Logo uploaded",
          description: "Your organization logo has been saved.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadLogoMutation.mutate(file);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    updateOrgMutation.mutate({ primaryColor: color });
  };

  const completeOnboarding = async () => {
    await updateOrgMutation.mutateAsync({ 
      settings: { 
        ...organization?.settings,
        onboardingCompleted: true 
      } 
    });
    toast({
      title: "Welcome to Plegit!",
      description: "Your organization is all set up. Let's start fundraising!",
    });
    navigate("/dashboard");
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const brandColors = [
    "#00BCD4", // Cyan (default)
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#22C55E", // Green
    "#14B8A6", // Teal
    "#6366F1", // Indigo
  ];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="welcome"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl -z-10 rounded-full" />
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome to Plegit
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                The modern fundraising platform built for faith-based organizations like{" "}
                <span className="font-semibold text-foreground">{organization?.name || "yours"}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>AI-powered campaigns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Multi-currency support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Complete donor CRM</span>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="features"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold">Powerful Features</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Everything you need to run successful fundraising campaigns
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover-elevate transition-all duration-300 border-transparent hover:border-primary/20">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="pwa"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Works on All Devices</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Plegit is a Progressive Web App - install it on any device for the best experience
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {pwaFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className="text-center space-y-3 p-6"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Look for the install prompt in your browser or add to home screen on mobile
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="branding"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Brand Your Platform</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload your logo and choose your brand color to personalize your dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <Card className="p-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Organization Logo
                  </Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer border-2 border-dashed rounded-xl p-8 hover:border-primary/50 transition-colors bg-muted/30"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-logo-upload"
                    />
                    {logoPreview || organization?.logoUrl ? (
                      <div className="relative">
                        <img
                          src={logoPreview || organization?.logoUrl || ""}
                          alt="Logo preview"
                          className="w-32 h-32 mx-auto object-contain rounded-lg"
                          data-testid="img-logo-preview"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Click to upload logo</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadLogoMutation.isPending && (
                    <p className="text-sm text-muted-foreground text-center">Uploading...</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Brand Color
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {brandColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110 ${
                          selectedColor === color
                            ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`button-color-${color.replace("#", "")}`}
                      />
                    ))}
                  </div>
                  <div className="pt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">Custom color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                        data-testid="input-custom-color"
                      />
                      <Input
                        type="text"
                        value={selectedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        placeholder="#00BCD4"
                        className="flex-1 font-mono"
                        data-testid="input-color-hex"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="complete"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 blur-3xl -z-10 rounded-full" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6"
              >
                <Check className="w-12 h-12 text-green-500" />
              </motion.div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">You're All Set!</h2>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                Your organization is ready to start accepting donations and running campaigns
              </p>
            </div>

            {(logoPreview || organization?.logoUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">Your branded dashboard preview:</p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <img
                    src={logoPreview || organization?.logoUrl || ""}
                    alt="Your logo"
                    className="w-10 h-10 object-contain rounded"
                  />
                  <span className="font-semibold">{organization?.name}</span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Dashboard ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Logo uploaded</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Brand colors set</span>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {TOTAL_STEPS}
              </span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-onboarding" />
          </div>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-10">
              <div className="min-h-[400px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
              data-testid="button-onboarding-prev"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={nextStep}
              className="gap-2 min-w-[140px]"
              disabled={updateOrgMutation.isPending}
              data-testid="button-onboarding-next"
            >
              {currentStep === TOTAL_STEPS - 1 ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-primary w-6"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                }`}
                data-testid={`button-step-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
