import ActivitySurvey from "@/components/activities/ActivitySurvey";
import InsightCards from "@/components/insights/InsightCards";
import PastGratitudeEntries from "@/components/insights/PastGratitudeEntries";
import { Separator } from "@/components/ui/separator";

export default function InsightsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Wellness Insights</h1>
        <p className="text-muted-foreground mt-1">Connecting the dots between your activities and your mood.</p>
      </div>
      <div className="space-y-12">
        <InsightCards />
        <Separator />
        <PastGratitudeEntries />
        <Separator />
        
      </div>
    </div>
  );
}
