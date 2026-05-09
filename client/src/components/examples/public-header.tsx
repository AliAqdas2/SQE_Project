import { PublicHeader } from '../public-header';

export default function PublicHeaderExample() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="h-[200vh] pt-20 px-8">
        <p className="text-muted-foreground">Scroll to see header behavior</p>
      </div>
    </div>
  );
}
