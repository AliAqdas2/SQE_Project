import { CampaignCard } from "./campaign-card";
import { Button } from "@/components/ui/button";
import educationImage from "@assets/generated_images/Education_campaign_impact_photo_8d1f19fe.png";
import foodImage from "@assets/generated_images/Food_relief_campaign_photo_c3a323f5.png";
import housingImage from "@assets/generated_images/Housing_campaign_construction_photo_51f8402d.png";

const campaigns = [
  {
    id: "1",
    title: "Education for All Children",
    organization: "Hope Community Church",
    imageUrl: educationImage,
    raised: 45000,
    goal: 75000,
    donorCount: 234,
    category: "Education",
  },
  {
    id: "2",
    title: "Food Relief Program",
    organization: "Faith United Ministry",
    imageUrl: foodImage,
    raised: 28500,
    goal: 50000,
    donorCount: 156,
    category: "Relief",
  },
  {
    id: "3",
    title: "Build Homes for Families",
    organization: "Grace Building Project",
    imageUrl: housingImage,
    raised: 67800,
    goal: 100000,
    donorCount: 312,
    category: "Housing",
  },
];

export function CampaignsShowcase() {
  return (
    <section id="campaigns" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Active Campaigns
          </h2>
          <p className="text-xl text-muted-foreground">
            Support causes that are making a real difference
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            data-testid="button-view-all-campaigns"
          >
            View All Campaigns
          </Button>
        </div>
      </div>
    </section>
  );
}
