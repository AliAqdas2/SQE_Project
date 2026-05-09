import { EventCard } from '../event-card';
import eventImage from '@assets/generated_images/Community_faith_gathering_hero_1955183e.png';

export default function EventCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <EventCard
        id="1"
        title="Community Thanksgiving Dinner"
        date="November 23, 2025"
        time="6:00 PM - 9:00 PM"
        location="Hope Community Church, 123 Main St"
        attendees={145}
        capacity={200}
        price={0}
        imageUrl={eventImage}
        status="upcoming"
      />
    </div>
  );
}
