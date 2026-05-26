import type { Metadata } from 'next';
import { MyFlyerSetupWizard } from './setup-wizard';

type MyFlyerSetupPageProps = Readonly<{ params: Promise<{ country: string }> }>;

export const metadata: Metadata = {
  title: 'MyFlyer Setup | GroceryView',
  description: 'First-time MyFlyer setup for country, favorite stores, and flyer ranking algorithm.'
};

export default async function MyFlyerSetupPage({ params }: MyFlyerSetupPageProps) {
  const { country } = await params;

  return (
    <main className="min-h-screen bg-[#f4efe5]">
      <MyFlyerSetupWizard routeCountry={country || 'se'} />
    </main>
  );
}
