
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Smile, Bed, Edit, Save, MessageCircle } from "lucide-react";
import { useWellnessStore } from "@/lib/data";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function DashboardMetrics() {
  const { steps, setSteps, sleepHours, setSleepHours, currentMood, setCurrentMood } = useWellnessStore();
  const router = useRouter();
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [localSteps, setLocalSteps] = useState(steps);

  const [isEditingMood, setIsEditingMood] = useState(false);
  const [localMood, setLocalMood] = useState(currentMood);

  const [isEditingSleep, setIsEditingSleep] = useState(false);
  const [localSleep, setLocalSleep] = useState(sleepHours);

  const moodMap: { [key: string]: { color: string, emoji: string } } = {
    "Great": { color: "text-green-500", emoji: "😄" },
    "Good": { color: "text-green-400", emoji: "😊" },
    "Okay": { color: "text-yellow-500", emoji: "😐" },
    "Bad": { color: "text-orange-500", emoji: "😕" },
    "Awful": { color: "text-red-500", emoji: "😩" }
  }
  const { color: moodColor, emoji: moodEmoji } = moodMap[currentMood] || { color: "text-gray-500", emoji: "🤔" };

  const handleSaveSteps = () => {
    setSteps(localSteps);
    setIsEditingSteps(false);
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setLocalSteps(Math.max(0, value));
    } else if (e.target.value === '') {
      setLocalSteps(0);
    }
  };

  const handleSaveMood = () => {
    setCurrentMood(localMood);
    setIsEditingMood(false);
  };

  const handleSaveSleep = () => {
    setSleepHours(localSleep);
    setIsEditingSleep(false);
  };

  const handleSleepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setLocalSleep(Math.max(0, value));
    } else if (e.target.value === '') {
      setLocalSleep(0);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-headline font-semibold mb-4">Your Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mood</CardTitle>
            <Smile className={`h-4 w-4 text-muted-foreground ${moodColor}`} />
          </CardHeader>
          <CardContent>
            {isEditingMood ? (
              <div className="flex items-center gap-2">
                <Select value={localMood} onValueChange={setLocalMood}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(moodMap).map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood} {moodMap[mood].emoji}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSaveMood}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{currentMood}</div>
                    <p className="text-xs text-muted-foreground">{moodEmoji}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setLocalMood(currentMood);
                    setIsEditingMood(true);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {(currentMood === 'Bad' || currentMood === 'Awful') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => router.push(`/therapy-session/immediate-${Date.now().toString()}`)}
                  >
                    <MessageCircle className="w-3 h-3 mr-2" />
                    Chat with Bloom
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground text-blue-500" />
          </CardHeader>
          <CardContent>
            {isEditingSleep ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={localSleep}
                  onChange={handleSleepChange}
                  className="h-9"
                />
                <Button size="icon" className="h-9 w-9" onClick={handleSaveSleep}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{sleepHours.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Last night</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setLocalSleep(sleepHours);
                  setIsEditingSleep(true);
                }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps Today</CardTitle>
            <Footprints className="h-4 w-4 text-muted-foreground text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isEditingSteps ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={localSteps}
                  onChange={handleStepChange}
                  className="h-9"
                />
                <Button size="icon" className="h-9 w-9" onClick={handleSaveSteps}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setLocalSteps(steps);
                  setIsEditingSteps(true);
                }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Click the pencil to edit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
