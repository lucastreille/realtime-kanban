import { ReviewFlow } from '@/components/review';

export default function Home() {
  // Demo configuration - in production, these would come from API based on URL slug
  const demoConfig = {
    businessName: "Le Petit Bistrot",
    logoUrl: null, // Optional logo URL
    primaryColor: "#8B7355",
    accentColor: "#C9A86C",
    googleReviewUrl: "https://g.page/r/CfXqXqXqXqXqXq/review",
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-d123456",
    language: 'fr' as const,
  };

  return (
    <main>
      <ReviewFlow {...demoConfig} />
    </main>
  );
}
