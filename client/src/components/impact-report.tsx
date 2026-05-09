import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, FileText, TrendingUp, TrendingDown, Users, Coins, Target, Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

interface ImpactReportProps {
  campaignId: string;
  currency?: string;
  campaignName?: string;
  organizationName?: string;
  organizationLogo?: string;
}

interface ReportStats {
  totalRaised: number;
  goalAmount: number;
  progressPercentage: number;
  donationCount: number;
  uniqueDonors: number;
  averageDonation: number;
  largestDonation: number;
  smallestDonation: number;
  daysActive: number;
  daysRemaining: number | null;
  dailyAverage: number;
  recent7DaysTotal: number;
  previous7DaysTotal: number;
  momentumChange: number;
}

interface ReportData {
  report: string;
  statistics: ReportStats;
}

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 25,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#E2E8F0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    border: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statValuePositive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  statValueNegative: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricsLabel: {
    fontSize: 11,
    color: '#64748B',
    width: '50%',
  },
  metricsValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    width: '50%',
    textAlign: 'right',
  },
  analysisText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#334155',
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  badge: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    fontSize: 9,
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
});

// PDF Document Component
interface PDFDocumentProps {
  reportData: ReportData;
  campaignName: string;
  organizationName: string;
  organizationLogo?: string;
  currency: string;
}

const ImpactReportPDF = ({ reportData, campaignName, organizationName, organizationLogo, currency }: PDFDocumentProps) => {
  const { statistics, report } = reportData;
  const generatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const normalizedCurrency = (() => {
    const sanitized = String(currency || 'USD').toUpperCase().trim();
    if (sanitized.length === 3 && /^[A-Z]{3}$/.test(sanitized)) {
      return sanitized;
    }
    return 'USD';
  })();

  const formatPDFCurrency = (amount: number | string) => {
    const numericAmount = Number(amount ?? 0);
    if (isNaN(numericAmount)) {
      return `${normalizedCurrency} 0.00`;
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericAmount);
    } catch (error) {
      return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
    }
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          {organizationLogo && organizationLogo.trim() !== '' ? (
            <Image src={organizationLogo} style={pdfStyles.logo} />
          ) : (
            <View style={{ width: 120, height: 40, marginBottom: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', border: 1, borderColor: '#E2E8F0', borderRadius: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748B' }}>
                {organizationName.substring(0, 20)}
              </Text>
            </View>
          )}
          <Text style={pdfStyles.title}>Campaign Impact Report</Text>
          <Text style={pdfStyles.subtitle}>{campaignName}</Text>
          <Text style={pdfStyles.subtitle}>{organizationName}</Text>
          <Text style={pdfStyles.subtitle}>Generated on {generatedDate}</Text>
        </View>

        {/* Key Statistics */}
        <Text style={pdfStyles.sectionTitle}>Key Performance Indicators</Text>
        <View style={pdfStyles.statsGrid}>
          <View style={pdfStyles.statCard}>
            <Text style={pdfStyles.statLabel}>Progress</Text>
            <Text style={pdfStyles.statValue}>{statistics.progressPercentage.toFixed(1)}%</Text>
          </View>
          <View style={pdfStyles.statCard}>
            <Text style={pdfStyles.statLabel}>Total Raised</Text>
            <Text style={pdfStyles.statValue}>{formatPDFCurrency(statistics.totalRaised)}</Text>
          </View>
          <View style={pdfStyles.statCard}>
            <Text style={pdfStyles.statLabel}>Unique Donors</Text>
            <Text style={pdfStyles.statValue}>{statistics.uniqueDonors}</Text>
          </View>
          <View style={pdfStyles.statCard}>
            <Text style={pdfStyles.statLabel}>Momentum</Text>
            <Text style={statistics.momentumChange >= 0 ? pdfStyles.statValuePositive : pdfStyles.statValueNegative}>
              {statistics.momentumChange >= 0 ? '+' : ''}{statistics.momentumChange.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Performance Metrics */}
        <Text style={pdfStyles.sectionTitle}>Detailed Metrics</Text>
        <View>
          <View style={pdfStyles.metricsRow}>
            <Text style={pdfStyles.metricsLabel}>Average Donation</Text>
            <Text style={pdfStyles.metricsValue}>{formatPDFCurrency(statistics.averageDonation)}</Text>
          </View>
          <View style={pdfStyles.metricsRow}>
            <Text style={pdfStyles.metricsLabel}>Daily Average</Text>
            <Text style={pdfStyles.metricsValue}>{formatPDFCurrency(statistics.dailyAverage)}</Text>
          </View>
          <View style={pdfStyles.metricsRow}>
            <Text style={pdfStyles.metricsLabel}>Days Active</Text>
            <Text style={pdfStyles.metricsValue}>{statistics.daysActive} days</Text>
          </View>
          <View style={pdfStyles.metricsRow}>
            <Text style={pdfStyles.metricsLabel}>Largest Gift</Text>
            <Text style={pdfStyles.metricsValue}>{formatPDFCurrency(statistics.largestDonation)}</Text>
          </View>
          <View style={pdfStyles.metricsRow}>
            <Text style={pdfStyles.metricsLabel}>Total Donations</Text>
            <Text style={pdfStyles.metricsValue}>{statistics.donationCount}</Text>
          </View>
          {statistics.daysRemaining !== null && (
            <View style={pdfStyles.metricsRow}>
              <Text style={pdfStyles.metricsLabel}>Days Remaining</Text>
              <Text style={pdfStyles.metricsValue}>{statistics.daysRemaining} days</Text>
            </View>
          )}
        </View>

        {/* AI Analysis */}
        <Text style={pdfStyles.sectionTitle}>AI Analysis & Recommendations</Text>
        <View style={pdfStyles.badge}>
          <Text>AI Generated</Text>
        </View>
        <Text style={pdfStyles.analysisText}>{report}</Text>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>© {new Date().getFullYear()} {organizationName}</Text>
          <Text style={pdfStyles.footerText}>Page 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export function ImpactReport({ campaignId, currency = "USD", campaignName = "Campaign", organizationName = "Your Organization", organizationLogo }: ImpactReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const normalizedCurrency = (() => {
    const sanitized = String(currency || 'USD').toUpperCase().trim();
    if (sanitized.length === 3 && /^[A-Z]{3}$/.test(sanitized)) {
      return sanitized;
    }
    return 'USD';
  })();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/impact-report`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({
        title: "Report Generated",
        description: "Your campaign impact report is ready to view.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate impact report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | string) => {
    const numericAmount = Number(amount ?? 0);
    if (isNaN(numericAmount)) {
      return `${normalizedCurrency} 0.00`;
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numericAmount);
    } catch (error) {
      return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !reportData && !generateMutation.isPending) {
      generateMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-impact-report">
          <FileText className="h-4 w-4 mr-2" />
          Impact Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Impact Report</DialogTitle>
        </DialogHeader>

        {generateMutation.isPending && (
          <div className="flex items-center justify-center py-12" data-testid="loading-report">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing campaign performance...</p>
            </div>
          </div>
        )}

        {generateMutation.isError && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-4" data-testid="text-error">
              Failed to generate report. Please try again.
            </p>
            <Button onClick={() => generateMutation.mutate()} variant="outline" data-testid="button-retry">
              Retry
            </Button>
          </div>
        )}

        {reportData && (
          <div className="space-y-6">
            {/* Key Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card data-testid="card-stat-progress">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold" data-testid="text-stat-progress">
                      {reportData.statistics.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-raised">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold" data-testid="text-stat-raised">
                      {formatCurrency(reportData.statistics.totalRaised)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-donors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Donors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold" data-testid="text-stat-donors">
                      {reportData.statistics.uniqueDonors}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-momentum">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Momentum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {reportData.statistics.momentumChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-2xl font-bold ${reportData.statistics.momentumChange >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-stat-momentum">
                      {reportData.statistics.momentumChange >= 0 ? '+' : ''}{reportData.statistics.momentumChange.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <Card data-testid="card-metrics">
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Average Donation</p>
                    <p className="text-lg font-semibold mt-1" data-testid="text-metric-avg">
                      {formatCurrency(reportData.statistics.averageDonation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Average</p>
                    <p className="text-lg font-semibold mt-1" data-testid="text-metric-daily">
                      {formatCurrency(reportData.statistics.dailyAverage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Active</p>
                    <p className="text-lg font-semibold mt-1 flex items-center" data-testid="text-metric-days">
                      <Calendar className="h-4 w-4 mr-1" />
                      {reportData.statistics.daysActive}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Largest Gift</p>
                    <p className="text-lg font-semibold mt-1" data-testid="text-metric-largest">
                      {formatCurrency(reportData.statistics.largestDonation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Donations</p>
                    <p className="text-lg font-semibold mt-1" data-testid="text-metric-count">
                      {reportData.statistics.donationCount}
                    </p>
                  </div>
                  {reportData.statistics.daysRemaining !== null && (
                    <div>
                      <p className="text-muted-foreground">Days Remaining</p>
                      <p className="text-lg font-semibold mt-1" data-testid="text-metric-remaining">
                        {reportData.statistics.daysRemaining}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card data-testid="card-analysis">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Analysis & Recommendations</CardTitle>
                  <Badge variant="outline" className="bg-primary/10">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap" data-testid="text-analysis">
                  {reportData.report}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="default"
                onClick={async () => {
                  try {
                    const doc = (
                      <ImpactReportPDF
                        reportData={reportData}
                        campaignName={campaignName}
                        organizationName={organizationName}
                        organizationLogo={organizationLogo}
                        currency={normalizedCurrency}
                      />
                    );
                    const blob = await pdf(doc).toBlob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${campaignName.replace(/\s+/g, '_')}_Impact_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    toast({
                      title: "PDF Generation Failed",
                      description: "Failed to generate PDF. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={() => generateMutation.mutate()} 
                variant="outline"
                disabled={generateMutation.isPending}
                data-testid="button-regenerate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Regenerate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
