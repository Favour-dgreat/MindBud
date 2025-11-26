'use server';
/**
 * @fileOverview Summarizes user activity logs using AI to provide insights into how activities affect mood and well-being.
 *
 * - summarizeActivityLogs - A function that takes activity logs as input and returns a summary.
 * - SummarizeActivityLogsInput - The input type for the summarizeActivityLogs function.
 * - SummarizeActivityLogsOutput - The return type for the summarizeActivityLogs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeActivityLogsInputSchema = z.object({
  mood: z.string().describe("The user's reported mood for the day."),
  stress: z.string().describe("The user's stress level for the day."),
  energy: z.string().describe("The user's energy level for the day."),
  physicalActivity: z.string().describe("The user's physical activity level."),
  nutrition: z.string().describe("The user's eating and hydration quality."),
  screenTime: z.string().describe("The user's screen time duration."),
  location: z.array(z.string()).describe("A list of places the user spent their day."),
  accomplishment: z.string().describe("Whether the user felt they accomplished their goals."),
  selfCare: z.string().describe("Whether the user took time for self-care."),
  freshAir: z.string().describe("Whether the user got fresh air."),
  socialConnection: z.string().describe("The quality of user's social interactions."),
  enjoyment: z.string().describe("Whether the user did something enjoyable."),
  gratitude: z.string().describe("Whether the user can identify things they're grateful for."),
  sleep: z.string().describe("The user's sleep quality."),
  medication: z.string().describe("Whether the user took their medication."),
  steps: z.string().describe("Number of steps the user took."),
});

export type SummarizeActivityLogsInput = z.infer<typeof SummarizeActivityLogsInputSchema>;

const SummarizeActivityLogsOutputSchema = z.object({
  summary: z.string().describe('A warm, empathetic summary of the user\'s day and overall well-being.'),
  insights: z.string().describe('Specific insights connecting their activities, behaviors, and mood patterns.'),
  recommendations: z.string().describe('2-3 gentle, actionable recommendations tailored to their current state.'),
});

export type SummarizeActivityLogsOutput = z.infer<typeof SummarizeActivityLogsOutputSchema>;

export async function summarizeActivityLogs(input: SummarizeActivityLogsInput): Promise<SummarizeActivityLogsOutput> {
  return summarizeActivityLogsFlow(input);
}

const summarizeActivityLogsPrompt = ai.definePrompt({
  name: 'summarizeActivityLogsPrompt',
  input: { schema: SummarizeActivityLogsInputSchema },
  output: { schema: SummarizeActivityLogsOutputSchema },
  prompt: `You are a compassionate AI wellness companion analyzing a user's daily check-in to provide personalized mental health insights.

Today's Wellness Data:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Overall Mood: {{{mood}}}
• Sleep Quality: {{{sleep}}}
• Steps Taken: {{{steps}}}

Mental & Emotional:
• Stress Level: {{{stress}}}
• Energy Level: {{{energy}}}
• Sense of Accomplishment: {{{accomplishment}}}

Physical Well-being:
• Physical Activity: {{{physicalActivity}}}
• Nutrition & Hydration: {{{nutrition}}}
• Fresh Air/Outdoors: {{{freshAir}}}

Lifestyle Factors:
• Screen Time: {{{screenTime}}}
• Locations: {{#each location}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Social & Emotional Health:
• Social Connection: {{{socialConnection}}}
• Enjoyment Activities: {{{enjoyment}}}
• Self-Care: {{{selfCare}}}
• Gratitude: {{{gratitude}}}

Medication Adherence: {{{medication}}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your task:
1. **Summary**: Provide a warm, empathetic 2-3 sentence summary of their day and overall well-being. Acknowledge both positive aspects and challenges.

2. **Insights**: Identify 2-3 specific connections between their behaviors and mood. For example:
   - If mood is good and they exercised, got fresh air, and connected with others → highlight this positive pattern
   - If mood is low and sleep was poor, screen time high → gently note these potential factors
   - Look for correlations between physical activity, social connection, self-care, and emotional state

3. **Recommendations**: Provide 2-3 specific, actionable suggestions tailored to their current state:
   - If they're doing well → reinforce positive habits
   - If struggling → suggest small, achievable steps
   - Address key gaps (e.g., poor sleep → sleep hygiene tips, low social connection → reaching out to someone)
   - Keep recommendations realistic and non-judgmental

Tone: Warm, supportive, non-judgmental, encouraging. Use "you" language. Avoid medical advice. Focus on patterns and gentle guidance.
  `,
});

const summarizeActivityLogsFlow = ai.defineFlow(
  {
    name: 'summarizeActivityLogsFlow',
    inputSchema: SummarizeActivityLogsInputSchema,
    outputSchema: SummarizeActivityLogsOutputSchema,
  },
  async input => {
    const { output } = await summarizeActivityLogsPrompt(input);
    return output!;
  }
);
