import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { WasteFacility } from "../types";

let client: GoogleGenAI | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const generateInsight = async (
  data: WasteFacility[],
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> => {
  const ai = initializeGemini();
  if (!ai) return "Error: API Key is missing. Please configure process.env.API_KEY.";

  try {
    // 1. Context Optimization: Pre-calculate critical insights so the AI doesn't miss them in truncation
    const overCapacity = data
      .filter(d => d.usage_num > d.capacity_num)
      .sort((a, b) => b.utilization_rate - a.utilization_rate);
    
    const topRisks = overCapacity.slice(0, 10).map(d => 
      `- ${d.nama_fasil} (${d.negeri}): Usage ${d.usage_num} / Cap ${d.capacity_num} (${d.utilization_rate.toFixed(1)}%)`
    ).join('\n');

    const totalCapacity = data.reduce((acc, curr) => acc + curr.capacity_num, 0);
    const totalUsage = data.reduce((acc, curr) => acc + curr.usage_num, 0);

    const summarizedContext = `
      DATASET SUMMARY:
      - Total Sites: ${data.length}
      - Total System Capacity: ${totalCapacity}
      - Total System Usage: ${totalUsage}
      - Sites Over Capacity: ${overCapacity.length}
      
      TOP SITES EXCEEDING CAPACITY (Critical Risks):
      ${topRisks}

      SAMPLE RAW DATA (First 50 rows JSON):
      ${JSON.stringify(data.slice(0, 50))}
    `;

    // 2. Chat Session Setup
    const modelId = "gemini-2.5-flash";
    
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: [
        {
          role: 'user',
          parts: [{ text: `Here is the analyzed dataset context:\n${summarizedContext}` }],
        },
        {
          role: 'model',
          parts: [{ text: "I have analyzed the dataset, including capacity utilization and critical risks. I am ready to answer specific questions." }],
        },
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
      ]
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "No response generated.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error analyzing the data. Please try again.";
  }
};