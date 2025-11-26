
'use server';

/**
 * @fileOverview A conversational AI flow for a therapy session.
 * 
 * - therapyConversation - A function that provides a conversational response.
 * - TherapyConversationInput - The input type for the therapyConversation function.
 * - TherapyConversationOutput - The return type for the therapyConversation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';
import type { MessageData } from 'genkit';

const TherapyConversationInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
      text: z.string()
    }))
  })).describe('The conversation history.'),
  message: z.string().describe("The user's latest message."),
  voiceName: z.string().optional().describe("The voice to use for the TTS response."),
  userContext: z.object({
    mood: z.string(),
    sleepHours: z.number(),
    steps: z.number(),
    name: z.string().optional(),
  }).optional().describe("The user's wellness context."),
});

export type TherapyConversationInput = z.infer<typeof TherapyConversationInputSchema>;

const TherapyConversationOutputSchema = z.object({
  response: z.string().describe("The AI's conversational response."),
  audio: z.string().optional().describe("The AI's response as a base64 encoded WAV audio string in a data URI format."),
});

export type TherapyConversationOutput = z.infer<typeof TherapyConversationOutputSchema>;

export async function therapyConversation(input: TherapyConversationInput): Promise<TherapyConversationOutput> {
  return therapyConversationFlow(input);
}

const therapySystemPrompt = `You are an AI therapist named Bloom. Your goal is to provide a safe, supportive, and empathetic space for the user to share their thoughts and feelings.
  
  - Listen actively and respond with empathy and understanding.
  - Ask open-ended questions to encourage reflection.
  - Do not give direct advice, but help the user explore their own solutions.
  - Keep your responses concise and conversational.
  - Maintain a calm and non-judgmental tone.
  - Do not diagnose or provide medical advice.
  - If the user is in crisis, provide a supportive message and gently suggest they contact a crisis hotline or a mental health professional.
  `;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const therapyConversationFlow = ai.defineFlow(
  {
    name: 'therapyConversationFlow',
    inputSchema: TherapyConversationInputSchema,
    outputSchema: TherapyConversationOutputSchema,
  },
  async (input) => {

    // Step 1: Generate the text response.
    let systemPrompt = therapySystemPrompt;
    if (input.userContext) {
      systemPrompt += `\n\nUser Context:\n- Current Mood: ${input.userContext.mood}\n- Sleep Last Night: ${input.userContext.sleepHours} hours\n- Steps Today: ${input.userContext.steps}`;
      if (input.userContext.name) {
        systemPrompt += `\n- User Name: ${input.userContext.name}`;
      }
      systemPrompt += `\n\nUse this context to personalize your response. If the user's mood is low or sleep is poor, acknowledge it gently.`;
    }

    // Ensure the user message has actual content
    const userMessageText = input.message?.trim();
    if (!userMessageText) {
      console.warn('Empty or invalid user message:', input.message);
      return {
        response: "I didn't quite catch that. Could you please speak again?",
        audio: undefined,
      };
    }

    const messages = [
      ...(input.history as any[]),
      { role: 'user', content: [{ text: userMessageText }] },
    ];

    console.log('Sending to AI:', {
      messageCount: messages.length,
      lastMessage: userMessageText,
      systemPromptLength: systemPrompt.length
    });

    let textResponse;
    try {
      textResponse = await ai.generate({
        model: 'groq/llama-3.1-8b-instant',
        system: systemPrompt,
        messages: messages,
        config: {
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      });
    } catch (error: any) {
      console.error('AI generate error:', error);
      // Provide a fallback response
      return {
        response: "I apologize, but I'm having trouble processing your message right now. Could you please try rephrasing that?",
        audio: undefined,
      };
    }

    const responseText = textResponse.text?.trim();

    console.log('AI Response:', {
      hasText: !!responseText,
      textLength: responseText?.length || 0,
      fullResponse: textResponse
    });

    if (!responseText) {
      console.error('Empty response from model. Full response object:', JSON.stringify(textResponse, null, 2));
      // Provide a fallback response
      return {
        response: "I'm here and listening. Could you tell me more?",
        audio: undefined,
      };
    }

    // Step 2: Try to generate the audio from the text response.
    try {
      const audioResponse = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        prompt: responseText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: input.voiceName || 'Algenib' },
            },
          },
        },
      });

      const media = audioResponse.media;
      if (!media) {
        throw new Error('No media was returned from the TTS model.');
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      const audioBase64 = await toWav(audioBuffer);

      return {
        response: responseText,
        audio: 'data:audio/wav;base64,' + audioBase64,
      };

    } catch (error) {
      console.error("Could not generate TTS audio, returning text only. Error:", error);
      // If TTS fails (e.g., rate limit), return the text response without audio.
      return {
        response: responseText,
        audio: undefined, // Or an empty string
      };
    }
  }
);
