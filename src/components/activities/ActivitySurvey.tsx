
"use client";

import { useState } from "react";
import { summarizeActivityLogs, SummarizeActivityLogsOutput } from "@/ai/flows/summarize-activity-logs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useWellnessStore } from "@/lib/data";
import { Slider } from "@/components/ui/slider";
import { jsPDF } from "jspdf";
import { useUser } from "@/firebase";

const surveyQuestions = [
  {
    id: "stress",
    label: "How would you describe your stress level today?",
    options: ["Very Low", "Low", "Moderate", "High", "Very High"],
    type: "radio",
  },
  {
    id: "energy",
    label: "How energetic did you feel today?",
    options: ["Very energetic", "Energetic", "Neutral", "Tired", "Exhausted"],
    type: "radio",
  },
  {
    id: "physicalActivity",
    label: "Did you engage in any physical activity or exercise?",
    options: ["Intense workout", "Light exercise", "Just walking", "Very little", "None"],
    type: "radio",
  },
  {
    id: "nutrition",
    label: "How would you rate your eating and hydration today?",
    options: ["Very healthy", "Mostly healthy", "Okay", "Could be better", "Poor"],
    type: "radio",
  },
  {
    id: "screenTime",
    label: "How much time did you spend on screens today?",
    options: ["Minimal (< 2 hrs)", "Moderate (2-4 hrs)", "High (4-6 hrs)", "Very High (6-8 hrs)", "Excessive (> 8 hrs)"],
    type: "radio",
  },
  {
    id: "location",
    label: "Where did you spend most of your day?",
    options: ["Home", "Work/School", "Outdoors", "Social places", "Traveling"],
    type: "checkbox",
  },
  {
    id: "accomplishment",
    label: "Did you accomplish your goals for today?",
    options: ["Exceeded expectations", "Met most goals", "Made some progress", "Struggled", "Couldn't focus"],
    type: "radio",
  },
  {
    id: "selfCare",
    label: "Did you take time for self-care or relaxation?",
    options: ["Yes, multiple times", "Yes, once", "Briefly", "Wanted to but didn't", "No"],
    type: "radio",
  },
  {
    id: "freshAir",
    label: "Did you spend time outdoors or get fresh air?",
    options: ["Yes, extended time", "Yes, some time", "Just a little", "Only indoors", "No"],
    type: "radio",
  },
  {
    id: "socialConnection",
    label: "How was your social interaction today?",
    options: ["Meaningful conversations", "Light interactions", "Minimal contact", "Avoided people", "Felt isolated"],
    type: "radio",
  },
  {
    id: "enjoyment",
    label: "Did you do something you genuinely enjoyed?",
    options: ["Yes, loved it", "Yes, enjoyed it", "It was okay", "Not really", "No"],
    type: "radio",
  },
  {
    id: "gratitude",
    label: "Can you think of something you're grateful for today?",
    options: ["Yes, many things", "Yes, a few things", "Yes, one thing", "Struggling to think", "No"],
    type: "radio",
  },
  {
    id: "medication",
    label: "Did you take your medication as prescribed?",
    options: ["Yes, all of it", "Yes, most of it", "Partially", "Forgot", "N/A - No medication"],
    type: "radio",
  },
];

type AnswersState = {
  [key: string]: string | string[];
};

export default function ActivitySurvey() {
  const [answers, setAnswers] = useState<AnswersState>({
    location: [],
  });
  const [summary, setSummary] = useState<SummarizeActivityLogsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentMood, sleepHours, setSleepHours, steps } = useWellnessStore();
  const { user } = useUser();

  const handleAnswerChange = (questionId: string, value: string, type: string) => {
    if (type === 'checkbox') {
      setAnswers(prev => {
        const existing = (prev[questionId] as string[]) || [];
        if (existing.includes(value)) {
          return { ...prev, [questionId]: existing.filter(item => item !== value) };
        } else {
          return { ...prev, [questionId]: [...existing, value] };
        }
      });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const allQuestionsAnswered = surveyQuestions.every(q => {
    const answer = answers[q.id];
    if (q.type === 'checkbox') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  });

  const handleSummarize = async () => {
    if (!allQuestionsAnswered || !currentMood) {
      toast({
        title: "Missing Information",
        description: "Please answer all the questions and select your mood.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary(null);

    const sleepMap: { [key: number]: string } = {
      0: 'Very Poor', 1: 'Very Poor', 2: 'Poor', 3: 'Poor', 4: 'Poor',
      5: 'Fair', 6: 'Fair', 7: 'Good', 8: 'Good', 9: 'Very Good', 10: 'Excellent', 11: 'Excellent', 12: 'Excellent'
    };
    const sleepQuality = sleepMap[Math.floor(sleepHours)] || 'Fair';


    try {
      const result = await summarizeActivityLogs({
        mood: currentMood,
        stress: answers.stress as string,
        energy: answers.energy as string,
        physicalActivity: answers.physicalActivity as string,
        nutrition: answers.nutrition as string,
        screenTime: answers.screenTime as string,
        location: answers.location as string[],
        accomplishment: answers.accomplishment as string,
        selfCare: answers.selfCare as string,
        freshAir: answers.freshAir as string,
        socialConnection: answers.socialConnection as string,
        enjoyment: answers.enjoyment as string,
        gratitude: answers.gratitude as string,
        sleep: sleepQuality,
        medication: answers.medication as string,
        steps: steps.toString(),
      });
      setSummary(result);
    } catch (error) {
      console.error("Error summarizing activity survey:", error);
      toast({
        title: "Summary Failed",
        description: "Could not generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!summary) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Helper to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 3; // Extra spacing after section
    };

    // Header
    doc.setFillColor(79, 70, 229); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MindBud Wellness Report", pageWidth / 2, 25, { align: "center" });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // User info and date
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    const userName = user?.displayName || "User";
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`${userName} | ${reportDate}`, margin, yPosition);
    yPosition += 15;

    // Wellness Metrics
    addText("Your Wellness Metrics", 16, true);
    addText(`Mood: ${currentMood}`, 11);
    addText(`Sleep: ${sleepHours.toFixed(1)} hours`, 11);
    addText(`Steps: ${steps.toLocaleString()}`, 11);
    yPosition += 5;

    // Survey Summary
    addText("Daily Check-In Responses", 16, true);
    surveyQuestions.forEach(q => {
      const answer = answers[q.id];
      const answerText = Array.isArray(answer) ? answer.join(", ") : answer || "Not answered";
      addText(`${q.label}`, 11, true);
      addText(`${answerText}`, 10);
    });
    yPosition += 5;

    // AI Insights
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Generated Insights", margin, yPosition + 5);
    yPosition += 20;

    addText("Summary", 12, true);
    addText(summary.summary, 10);

    addText("Personalized Insights", 12, true);
    addText(summary.insights, 10);

    if (summary.recommendations) {
      addText("Recommendations", 12, true);
      addText(summary.recommendations, 10);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by MindBud - Your AI-powered mental wellness companion", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Save
    doc.save(`MindBud-Wellness-Report-${reportDate.replace(/\s/g, '-')}.pdf`);

    toast({
      title: "PDF Downloaded",
      description: "Your wellness report has been saved successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Wellness Check-In</CardTitle>
        <CardDescription>
          Answer these questions about your day to receive personalized AI insights. Your current mood is <span className="font-bold text-primary">{currentMood}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <div key="sleep">
            <Label htmlFor="sleep-slider" className="font-semibold">How many hours did you sleep last night?</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="sleep-slider"
                min={0}
                max={12}
                step={0.5}
                value={[sleepHours]}
                onValueChange={(value) => setSleepHours(value[0])}
                disabled={loading}
              />
              <div className="font-bold text-lg text-primary w-20 text-center">{sleepHours.toFixed(1)} hrs</div>
            </div>
          </div>

          {surveyQuestions.map((q) => (
            <div key={q.id}>
              <Label className="font-semibold">{q.label}</Label>
              {q.type === 'radio' ? (
                <RadioGroup
                  value={answers[q.id] as string}
                  onValueChange={(value) => handleAnswerChange(q.id, value, q.type)}
                  className="mt-2"
                  disabled={loading}
                >
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {q.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                        <Label htmlFor={`${q.id}-${option}`} className="font-normal">{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {q.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${q.id}-${option}`}
                        checked={(answers[q.id] as string[]).includes(option)}
                        onCheckedChange={() => handleAnswerChange(q.id, option, q.type)}
                        disabled={loading}
                      />
                      <Label htmlFor={`${q.id}-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleSummarize} disabled={loading || !allQuestionsAnswered || !currentMood}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Insights
        </Button>
        {summary && (
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        )}
      </CardFooter>

      {summary && (
        <CardContent>
          <div className="mt-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 space-y-4">
            <div>
              <h4 className="font-semibold mb-2 font-headline text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                AI Summary
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 font-headline text-lg">Personalized Insights</h4>
              <p className="text-sm text-foreground leading-relaxed">{summary.insights}</p>
            </div>
            {summary.recommendations && (
              <div>
                <h4 className="font-semibold mb-2 font-headline text-lg">Recommendations</h4>
                <p className="text-sm text-foreground leading-relaxed">{summary.recommendations}</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
