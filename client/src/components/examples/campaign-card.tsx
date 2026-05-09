import { CampaignCard } from '../campaign-card';
import educationImage from '@assets/generated_images/Education_campaign_impact_photo_8d1f19fe.png';

export default function CampaignCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <CampaignCard
        id="1"
        title="Education for All Children"
        organization="Hope Community Church"
        imageUrl={educationImage}
        raised={45000}
        goal={75000}
        donorCount={234}
        category="Education"
      />
    </div>
  );
}
