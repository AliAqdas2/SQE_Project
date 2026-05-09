import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Settings, Sunrise, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  hijriDate: string;
}

interface SessionResponse {
  user: {
    orgId: string;
  };
}

export function PrayerTimesWidget() {
  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = sessionData?.user?.orgId;

  const { data: prayerTimes, isLoading, error } = useQuery<PrayerTimes>({
    queryKey: [`/api/org/${orgId}/prayer-times`],
    enabled: !!orgId,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prayer Times
          </CardTitle>
          <CardDescription>Today's Islamic prayer times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Location Not Configured</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Set your organization's location to display accurate prayer times on your dashboard.
            </p>
            <Link href="/dashboard/prayer-settings">
              <Button data-testid="button-configure-prayer-times">
                <Settings className="h-4 w-4 mr-2" />
                Configure Location
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prayerTimes) {
    return null;
  }

  const prayers: Array<{ name: string; time: string; icon: LucideIcon }> = [
    { name: "Fajr", time: prayerTimes.fajr, icon: Sunrise },
    { name: "Sunrise", time: prayerTimes.sunrise, icon: Sun },
    { name: "Dhuhr", time: prayerTimes.dhuhr, icon: Sun },
    { name: "Asr", time: prayerTimes.asr, icon: CloudSun },
    { name: "Maghrib", time: prayerTimes.maghrib, icon: Sunset },
    { name: "Isha", time: prayerTimes.isha, icon: Moon },
  ];

  // Get current time and find next prayer
  const currentTime = new Date();
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  let nextPrayerIndex = -1;
  for (let i = 0; i < prayers.length; i++) {
    const [hours, minutes] = prayers[i].time.split(':').map(Number);
    const prayerTotalMinutes = hours * 60 + minutes;
    if (prayerTotalMinutes > currentTotalMinutes) {
      nextPrayerIndex = i;
      break;
    }
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Clock className="h-5 w-5" />
              Prayer Times
            </CardTitle>
            <CardDescription className="mt-1">
              {prayerTimes.date} • {prayerTimes.hijriDate} AH
            </CardDescription>
          </div>
          <Link href="/dashboard/prayer-settings">
            <Button variant="ghost" size="icon" data-testid="button-prayer-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {prayers.map((prayer, index) => {
          const isNext = index === nextPrayerIndex;
          const isPast = nextPrayerIndex !== -1 && index < nextPrayerIndex;

          return (
            <div
              key={prayer.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isNext ? 'bg-primary/10 border border-primary/20' : isPast ? 'opacity-50' : 'hover-elevate'
              }`}
              data-testid={`prayer-time-${prayer.name.toLowerCase()}`}
            >
              <div className="flex items-center gap-3">
                <prayer.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className={`font-semibold ${isNext ? 'text-primary' : ''}`}>
                    {prayer.name}
                  </p>
                  {isNext && (
                    <Badge variant="default" className="mt-1 text-xs">
                      Next Prayer
                    </Badge>
                  )}
                </div>
              </div>
              <p className={`text-lg font-mono font-semibold ${isNext ? 'text-primary' : ''}`}>
                {prayer.time}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
