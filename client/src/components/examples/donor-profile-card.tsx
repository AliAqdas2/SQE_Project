import { DonorProfileCard } from '../donor-profile-card';

export default function DonorProfileCardExample() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="grid gap-4">
        <DonorProfileCard
          name="Sarah Johnson"
          email="sarah.j@email.com"
          phone="+1 (555) 123-4567"
          totalDonated={5420}
          donationCount={18}
          lastDonation="Oct 15, 2025"
          tier="gold"
        />
        <DonorProfileCard
          name="Michael Chen"
          email="m.chen@email.com"
          totalDonated={1250}
          donationCount={5}
          lastDonation="Oct 20, 2025"
          tier="silver"
        />
      </div>
    </div>
  );
}
