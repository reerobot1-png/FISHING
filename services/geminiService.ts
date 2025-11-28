import { GoogleGenAI, Type } from "@google/genai";
import { GenerateFishResponse } from '../types';

let genAI: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Helper to determine rarity based on probabilities
const pickRarity = (): string => {
  // User Requested Probabilities:
  // Common: 50%
  // Uncommon: 25%
  // Rare: 15%
  // Legendary: 10.9%
  // Secret: 0.1%
  // Note: Sum is 101%. Normalizing to standard 0-100 range.
  
  const rand = Math.random() * 100;
  
  if (rand < 50) return "Common";         // 0 - 50 (50%)
  if (rand < 75) return "Uncommon";       // 50 - 75 (25%)
  if (rand < 90) return "Rare";           // 75 - 90 (15%)
  if (rand < 99.9) return "Legendary";    // 90 - 99.9 (9.9%)
  return "Secret";                        // 99.9 - 100 (0.1%)
};

export const generateFishData = async (): Promise<GenerateFishResponse | null> => {
  if (!genAI) {
    console.warn("Gemini API Key not found. Using fallback.");
    return null;
  }

  // 1. Determine rarity client-side to enforce strict probabilities
  const selectedRarity = pickRarity();

  // 2. Define pricing rules based on the selected rarity
  let pricingInstruction = "";
  switch (selectedRarity) {
    case "Common": 
      pricingInstruction = "Price MUST be between $200 and $300."; 
      break;
    case "Uncommon": 
      pricingInstruction = "Price MUST be between $400 and $600."; 
      break;
    case "Rare": 
      pricingInstruction = "Price MUST be between $700 and $1800."; 
      break;
    case "Legendary": 
      pricingInstruction = "Price MUST be between $2000 and $4000."; 
      break;
    case "Secret": 
      pricingInstruction = "Price MUST be between $20000 and $25000."; 
      break;
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a unique, fictional 16-bit RPG style fish. 
      The rarity MUST be "${selectedRarity}". 
      ${pricingInstruction}
      Be creative with names and descriptions. 
      Secret fish should be extremely weird, glitchy, or cosmic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Creative name of the fish" },
            // Restrict the rarity enum to ONLY the selected one to force the model to comply
            rarity: { type: Type.STRING, enum: [selectedRarity] },
            weight: { type: Type.NUMBER, description: "Weight in lbs, appropriate for rarity" },
            description: { type: Type.STRING, description: "Short, witty, 16-bit RPG style description" },
            color: { type: Type.STRING, description: "Hex color code for the fish body, vibrant 16-bit palette" },
            price: { type: Type.INTEGER, description: "Gold value based on rarity rules provided." },
          },
          required: ["name", "rarity", "weight", "description", "color", "price"],
        },
      },
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText) as GenerateFishResponse;
    }
    return null;
  } catch (error) {
    console.error("Failed to generate fish:", error);
    return null;
  }
};