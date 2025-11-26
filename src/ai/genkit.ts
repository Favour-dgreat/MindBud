import { genkit } from 'genkit';
import { groq } from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq()],
  model: 'groq/llama-3.1-8b-instant',
});
