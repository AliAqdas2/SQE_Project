import { StatCard } from '../stat-card';
import { Coins, Users, TrendingUp, Heart } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Raised"
        value="$124,580"
        change={{ value: 12.5, trend: "up" }}
        icon={Coins}
      />
      <StatCard 
        title="Active Donors"
        value="1,234"
        change={{ value: 8.2, trend: "up" }}
        icon={Users}
      />
      <StatCard 
        title="Campaigns"
        value="23"
        icon={TrendingUp}
      />
      <StatCard 
        title="This Month"
        value="$18,400"
        change={{ value: 3.1, trend: "down" }}
        icon={Heart}
      />
    </div>
  );
}
