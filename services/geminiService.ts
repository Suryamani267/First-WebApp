import { GoogleGenAI } from "@google/genai";
import { ProcessedPlantData } from "../types";

const getAIClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePlantAnalysis = async (
  currentPlant: ProcessedPlantData, 
  allPlants: ProcessedPlantData[]
): Promise<string> => {
  const ai = getAIClient();
  
  // Filter out the current plant from the peer list for cleaner comparison, but keep it in if we want to rank it.
  // The prompt expects "all plants" to rank.
  
  const comparisonContext = allPlants.map(p => {
    return `Plant: ${p.plantName} | SEC: ${p.sec.toFixed(4)} | EII: ${p.eii.toFixed(2)}% | Total Emissions: ${p.ghgTotal.toFixed(2)} | Gas Flared: ${p.gasFlared}`;
  }).join('\n');

  const prompt = `
    Role: Analytical Engine for ONGC Energy Intelligence Dashboard.
    Task: Analyze the performance of Plant "${currentPlant.plantName}" on ${currentPlant.date}.

    Data for "${currentPlant.plantName}":
    - SEC: ${currentPlant.sec.toFixed(4)} (MMBTU/MMBTU)
    - EII: ${currentPlant.eii.toFixed(2)}%
    - Emission Intensity: ${currentPlant.emissionIntensity.toFixed(6)}
    - Gas Flared: ${currentPlant.gasFlared} SCM
    - Energy Expended: ${currentPlant.totalEnergyExpendedMMBTU.toFixed(2)} MMBTU
    
    Comparative Data (All Plants):
    ${comparisonContext}

    Required Output:
    1. **Rank**: Where does this plant stand compared to others based on SEC and EII? (e.g., 1st out of 5).
    2. **Performance Assessment**: Identify if the plant is a "Best Performer" or "Lagging".
    3. **Inefficiency Detection**: Highlight specific areas (e.g., "High Flaring detected compared to peers", "SEC is 15% higher than average").
    4. **Actionable Suggestions**: Provide 3 specific bullet points to improve energy efficiency and reduce emissions.

    Keep the tone professional, technical, and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for analytical consistency
      }
    });
    return response.text || "Analysis could not be generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating analysis. Please ensure API Key is configured and internet is available.";
  }
};

export const chatWithData = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentContext: ProcessedPlantData,
  userMessage: string
): Promise<string> => {
  const ai = getAIClient();
  
  const contextStr = `
    You are the AI Chatbot for the Pan-ONGC Energy Intelligence Dashboard.
    Current Plant Context:
    Name: ${currentContext.plantName}
    Date: ${currentContext.date}
    SEC: ${currentContext.sec.toFixed(4)}
    EII: ${currentContext.eii.toFixed(2)}%
    Gas Flared: ${currentContext.gasFlared} SCM
    GHG Emissions: ${currentContext.ghgTotal.toFixed(2)} tonnes
    
    Instructions:
    - Answer questions strictly based on the provided data.
    - If asked "Which plant is most energy efficient?", explain that you are currently viewing specific data for ${currentContext.plantName}, but generally lower SEC is better.
    - Provide insights on why emissions might be high (e.g., check Flaring or HSD consumption).
    - Be concise and helpful.
  `;

  const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
          systemInstruction: contextStr,
          temperature: 0.7
      },
      history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
      }))
  });

  try {
    const response = await chat.sendMessage({ message: userMessage });
    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I am unable to connect to the intelligence engine right now.";
  }
};
