import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import ScheduledSessions from "@/components/dashboard/ScheduledSessions";
import MedicationReminders from "@/components/dashboard/MedicationReminders";
import GratitudeJournal from "@/components/dashboard/GratitudeJournal";
import { Separator } from "@/components/ui/separator";
import ActivitySurvey from "@/components/activities/ActivitySurvey";

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <WelcomeHeader />
        <DashboardMetrics />
        <Separator />
        <GratitudeJournal />
       <div>
           <div className="text-center mb-8">
            <h2 className="text-3xl font-headline font-bold">Daily Check-in</h2>
            <p className="text-muted-foreground mt-1">Answer a few questions to see how your activities impact your mood.</p>
          </div>
          <ActivitySurvey />
        </div>
        <MedicationReminders />
      </div>
    </div>
  );
}
