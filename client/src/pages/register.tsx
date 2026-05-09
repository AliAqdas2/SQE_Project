import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Dashboard } from "@uppy/react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { detectBrowserLocation } from "@/lib/location-detection";
import { COUNTRY_CONFIGS, TIMEZONES, CURRENCIES, DATE_FORMATS, getCountryConfig } from "@shared/location-constants";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

interface RegistrationData {
  id?: string;
  charityName: string;
  religion: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  incorporationDocUrl: string;
  currentStep: number;
  status: string;
}

const STEPS = [
  { number: 1, title: "Organization Details", description: "Tell us about your organization" },
  { number: 2, title: "Contact Information", description: "How can we reach you?" },
  { number: 3, title: "Address", description: "Where is your organization located?" },
  { number: 4, title: "Proof of Incorporation", description: "Upload your incorporation document" },
  { number: 5, title: "Review & Submit", description: "Review your information before submitting" },
];

export default function RegisterPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  
  const detectedLocation = detectBrowserLocation();
  
  const [formData, setFormData] = useState<Partial<RegistrationData>>({
    charityName: "",
    religion: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: detectedLocation.country,
    timezone: detectedLocation.timezone,
    currency: detectedLocation.currency,
    dateFormat: detectedLocation.dateFormat,
    incorporationDocUrl: "",
    currentStep: 1,
    status: "draft",
  });
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Use ref to store file path to avoid closure issues and race conditions
  const uploadedFilePathRef = useRef<string | null>(null);

  // Initialize Uppy for file uploads
  useEffect(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
        maxFileSize: 10 * 1024 * 1024, // 10MB
      },
    }).use(AwsS3, {
      async getUploadParameters(file: any) {
        // Get presigned URL from backend with registration ID
        const response = await fetch(`/api/upload/url?registrationId=${registrationId || ""}`);
        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }
        const { uploadUrl, objectPath } = await response.json();

        // Store the objectPath in ref for use in upload-success handler
        // Uppy's AWS S3 plugin doesn't expose PUT response body, so we use the objectPath from the upload URL
        if (objectPath) {
          uploadedFilePathRef.current = objectPath;
          console.log("[Upload] Stored objectPath in ref:", objectPath);
        } else {
          // Fallback: extract objectPath from uploadUrl query params
          try {
            const url = new URL(uploadUrl);
            const pathParam = url.searchParams.get('objectPath');
            if (pathParam) {
              uploadedFilePathRef.current = decodeURIComponent(pathParam);
              console.log("[Upload] Extracted objectPath from URL:", uploadedFilePathRef.current);
            }
          } catch (e) {
            console.warn("Could not extract objectPath from uploadUrl:", e);
          }
        }

        return {
          method: "PUT",
          url: uploadUrl,
          fields: {},
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        };
      },
    } as any);

    uppyInstance.on("upload", () => {
      setIsUploading(true);
    });

    uppyInstance.on("upload-success", async (file, response) => {
      try {
        console.log("Upload success response:", response);
        console.log("Stored uploadedFilePath from ref:", uploadedFilePathRef.current);
        
        // Uppy's AWS S3 plugin doesn't expose PUT response body when using custom endpoints
        // So we use the objectPath we stored in ref when getting the upload URL
        let filePath = uploadedFilePathRef.current;
        
        // Try to get path from response as fallback (in case Uppy does provide it)
        if (!filePath && response) {
          let serverResponse: any = null;
          
          if (response && typeof response === 'object') {
            if (response.body && typeof response.body === 'object' && !response.body.path) {
              if (response.json && typeof response.json === 'function') {
                serverResponse = await response.json();
              } else if (response.text && typeof response.text === 'function') {
                const text = await response.text();
                serverResponse = JSON.parse(text);
              } else {
                serverResponse = response.body || response;
              }
            } else {
              serverResponse = response.body || response;
            }
            
            if (serverResponse?.path) {
              filePath = serverResponse.path;
            }
          }
        }
        
        if (!filePath) {
          console.error("No file path available. Response:", response, "Stored path:", uploadedFilePathRef.current);
          // Last resort: try to extract from upload URL if we have the file's upload URL
          // This shouldn't happen if the backend returns objectPath correctly
          throw new Error("No file path in upload response. The file may not have been saved correctly.");
        }
        
        // The path should already be in the format /objects/uploads/...
        // Ensure it starts with /objects/
        let normalizedPath = filePath;
        if (!normalizedPath.startsWith("/objects/")) {
          // If it doesn't start with /objects/, prepend it
          normalizedPath = `/objects/${normalizedPath.replace(/^\//, '')}`;
        }
        
        // Validate the path is not the upload endpoint
        if (normalizedPath.includes('/upload') && !normalizedPath.includes('/uploads/')) {
          console.error("Invalid path (upload endpoint):", normalizedPath);
          throw new Error("Invalid file path received from server");
        }
        
        console.log("Storing document path:", normalizedPath);
        setFormData((prev) => ({ ...prev, incorporationDocUrl: normalizedPath }));
        setIsUploading(false);
        uploadedFilePathRef.current = null; // Clear stored path
        
        toast({
          title: "Upload successful",
          description: "Your incorporation document has been uploaded.",
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        setIsUploading(false);
        uploadedFilePathRef.current = null; // Clear stored path on error
        toast({
          title: "Upload failed",
          description: error.message || "Failed to secure the uploaded document",
          variant: "destructive",
        });
      }
    });

    uppyInstance.on("upload-error", (file, error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "Failed to upload the document. Please try again.",
        variant: "destructive",
      });
    });

    setUppy(uppyInstance);

    return () => {
      uppyInstance.clear();
      uploadedFilePathRef.current = null;
    };
  }, [registrationId, toast]);

  // Load existing registration
  const { data: existingRegistration } = useQuery<RegistrationData>({
    queryKey: ["/api/registrations", registrationId],
    enabled: !!registrationId,
  });

  useEffect(() => {
    if (existingRegistration) {
      setFormData(existingRegistration);
      // Only update currentStep if moving forward, not backward
      // This prevents the step from resetting when query refetches after creation
      setCurrentStep((prev) => Math.max(prev, existingRegistration.currentStep || 1));
    }
  }, [existingRegistration]);

  // Create or update registration mutation
  const createRegistrationMutation = useMutation({
    mutationFn: async (data: Partial<RegistrationData>) => {
      const response = await apiRequest("POST", "/api/registrations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRegistrationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", data.id] });
    },
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RegistrationData> }) => {
      const response = await apiRequest("PATCH", `/api/registrations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", registrationId] });
    },
  });

  const submitRegistrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/registrations/${id}/submit`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration submitted!",
        description: "Your registration has been submitted for review. You'll receive an email when it's approved.",
      });
      setShowPWAPrompt(true);
      setTimeout(() => setLocation("/"), 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (registrationId && formData) {
        updateRegistrationMutation.mutate({
          id: registrationId,
          data: { ...formData, currentStep },
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, currentStep, registrationId]);

  const handleNext = () => {
    // Create registration on first step if not exists
    if (!registrationId && currentStep === 1) {
      if (!formData.charityName) {
        toast({
          title: "Required field",
          description: "Please enter your organization name",
          variant: "destructive",
        });
        return;
      }
      createRegistrationMutation.mutate(formData);
    }

    // Validate current step
    if (currentStep === 1) {
      if (!formData.charityName || !formData.religion) {
        toast({
          title: "Required fields",
          description: "Please fill in all organization details",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.contactFirstName || !formData.contactLastName || !formData.contactEmail) {
        toast({
          title: "Required fields",
          description: "Please fill in all contact information",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.street || !formData.city || !formData.state || !formData.zip || !formData.country || !formData.timezone || !formData.currency || !formData.dateFormat) {
        toast({
          title: "Required fields",
          description: "Please fill in all address and regional settings",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 4 && !formData.incorporationDocUrl) {
      toast({
        title: "Required document",
        description: "Please upload your incorporation document",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!registrationId) return;
    submitRegistrationMutation.mutate(registrationId);
  };

  const updateField = (field: keyof RegistrationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (countryCode: string) => {
    const config = getCountryConfig(countryCode);
    if (config) {
      setFormData((prev) => ({
        ...prev,
        country: countryCode,
        timezone: config.timezone,
        currency: config.currency,
        dateFormat: config.dateFormat,
      }));
    } else {
      updateField("country", countryCode);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-6">
            <Progress value={progress} className="h-2" data-testid="progress-registration" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>
          <CardTitle className="text-3xl" data-testid="text-step-title">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="text-lg" data-testid="text-step-description">
            {STEPS[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="charityName">Organization Name</Label>
                <Input
                  id="charityName"
                  data-testid="input-charity-name"
                  placeholder="e.g., Hope Community Church"
                  value={formData.charityName}
                  onChange={(e) => updateField("charityName", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="religion">Religion / Faith Tradition</Label>
                <Select
                  value={formData.religion}
                  onValueChange={(value) => updateField("religion", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="select-religion">
                    <SelectValue placeholder="Select your faith tradition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="christian" data-testid="option-christian">Christian</SelectItem>
                    <SelectItem value="muslim" data-testid="option-muslim">Muslim</SelectItem>
                    <SelectItem value="jewish" data-testid="option-jewish">Jewish</SelectItem>
                    <SelectItem value="hindu" data-testid="option-hindu">Hindu</SelectItem>
                    <SelectItem value="buddhist" data-testid="option-buddhist">Buddhist</SelectItem>
                    <SelectItem value="other" data-testid="option-other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactFirstName">First Name</Label>
                  <Input
                    id="contactFirstName"
                    data-testid="input-first-name"
                    placeholder="John"
                    value={formData.contactFirstName}
                    onChange={(e) => updateField("contactFirstName", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="contactLastName">Last Name</Label>
                  <Input
                    id="contactLastName"
                    data-testid="input-last-name"
                    placeholder="Doe"
                    value={formData.contactLastName}
                    onChange={(e) => updateField("contactLastName", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  data-testid="input-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone Number (Optional)</Label>
                <Input
                  id="contactPhone"
                  data-testid="input-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  data-testid="input-street"
                  placeholder="123 Main St"
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    data-testid="input-city"
                    placeholder="Springfield"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    data-testid="input-state"
                    placeholder="IL"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip">ZIP / Postal Code</Label>
                  <Input
                    id="zip"
                    data-testid="input-zip"
                    placeholder="62701"
                    value={formData.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="mt-2" data-testid="select-country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CONFIGS.map((country) => (
                        <SelectItem key={country.code} value={country.code} data-testid={`option-country-${country.code}`}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">Regional Settings</p>
                <p className="text-xs text-muted-foreground">
                  These settings are automatically configured based on your country but can be customized.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone" className="text-sm">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => updateField("timezone", value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz} data-testid={`option-timezone-${tz}`}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency" className="text-sm">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => updateField("currency", value)}
                    >
                      <SelectTrigger className="mt-1" data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code} data-testid={`option-currency-${curr.code}`}>
                            {curr.symbol} {curr.name} ({curr.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="dateFormat" className="text-sm">Date Format</Label>
                  <Select
                    value={formData.dateFormat}
                    onValueChange={(value) => updateField("dateFormat", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((df) => (
                        <SelectItem key={df.format} value={df.format} data-testid={`option-date-format-${df.format}`}>
                          {df.label} - {df.example}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                {uppy && !formData.incorporationDocUrl ? (
                  <Dashboard
                    uppy={uppy}
                    proudlyDisplayPoweredByUppy={false}
                    note="PDF, DOC, DOCX, JPG, PNG up to 10 MB"
                  />
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
                    <p className="text-lg font-semibold">Document Uploaded</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your incorporation document has been successfully uploaded.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, incorporationDocUrl: "" }))}
                      className="mt-4"
                      data-testid="button-reupload"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Different File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
                  <p className="text-lg" data-testid="text-review-charity-name">{formData.charityName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-lg" data-testid="text-review-contact">
                    {formData.contactFirstName} {formData.contactLastName}
                  </p>
                  <p className="text-sm" data-testid="text-review-email">{formData.contactEmail}</p>
                  {formData.contactPhone && <p className="text-sm" data-testid="text-review-phone">{formData.contactPhone}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-lg" data-testid="text-review-address">
                    {formData.street}<br />
                    {formData.city}, {formData.state} {formData.zip}<br />
                    {formData.country}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Incorporation Document</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Uploaded</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Next Steps:</strong> Once you submit, our team will review your application. 
                  You'll receive an email within 2-3 business days with instructions to set up your account.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                className="ml-auto"
                disabled={createRegistrationMutation.isPending || isUploading}
                data-testid="button-next"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="ml-auto"
                disabled={submitRegistrationMutation.isPending}
                data-testid="button-submit"
              >
                {submitRegistrationMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <PWAInstallPrompt trigger="registration" showImmediately={showPWAPrompt} />
    </div>
  );
}
