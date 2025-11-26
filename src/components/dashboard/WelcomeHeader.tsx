'use client';

import { Lightbulb } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "../shared/ThemeToggle";
import { useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, getFirestore } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { useMemoFirebase } from "@/firebase/provider";
import { Button } from "../ui/button";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";

export default function WelcomeHeader() {
  const { user } = useUser();
  const firestore = getFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const getFirstName = () => {
    if (userProfile) {
      return userProfile.firstName;
    }
    if (user && user.displayName) {
      return user.displayName.split(' ')[0];
    }
    return "User";
  };
  
  const getInitials = () => {
    if (userProfile) {
        return `${userProfile.firstName?.[0] || ''}${userProfile.lastName?.[0] || ''}`;
    }
    if (user && user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('');
    }
    return "U";
  }


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">
                Good Morning, {getFirstName()}
                </h1>
                <p className="text-muted-foreground mt-1">
                Welcome to MindBud - Your AI powered mental wellness companion  
                </p>
            </div>
            <div className="flex items-center gap-4 md:hidden">
                <ThemeToggle />
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} alt="User Avatar" />
                ) : (
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                )}
                </Avatar>
            </div>
        </div>

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2 bg-primary/20 rounded-full">
                  <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-semibold text-lg mb-2">Proactive Insight</h3>
                <p className="text-sm text-foreground/80 mb-4">
                  Remember that asking for help is not a sign of weakness; it’s a sign of strength.
                </p>
                <Link href="/therapy" passHref>
                  <Button size="sm" className="elevation-2 font-semibold">Start a Mental Wellness Session Today!</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
