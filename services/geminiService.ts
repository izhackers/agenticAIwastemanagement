import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { WasteFacility } from "../types";

// =================================================================================
// 🚨 PANDUAN API KEY (SILA BACA):
// 
// 1. CARA PALING MUDAH (Local/Testing):
//    Gantikan teks "MASUKKAN_API_KEY_ANDA_DI_SINI" di bawah dengan kunci sebenar.
//    Contoh: const MANUAL_API_KEY = "AIzaSy...";
//
// 2. CARA VERCEL (Production):
//    Di Vercel Dashboard > Settings > Environment Variables:
//    Nama: VITE_API_KEY
//    Value: (Kunci AIzaSy... anda)
//    PENTING: Mesti ada awalan 'VITE_' atau 'REACT_APP_' supaya boleh dibaca oleh browser.
// =================================================================================

const MANUAL_API_KEY: string = "MASUKKAN_API_KEY_ANDA_DI_SINI"; 

// =================================================================================

let client: GoogleGenAI | null = null;

// Fungsi pembantu untuk membaca variable dari pelbagai sumber (Vite, Webpack, Node)
const getEnvVariable = (key: string): string | undefined => {
  // 1. Cuba baca dari process.env (Standard Node/CRA/Webpack)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Abaikan
  }

  // 2. Cuba baca dari import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Abaikan
  }

  return undefined;
};

export const initializeGemini = () => {
  let apiKey = "";

  // 1. Check Hardcoded Key first
  if (MANUAL_API_KEY && !MANUAL_API_KEY.includes("MASUKKAN_API_KEY")) {
    apiKey = MANUAL_API_KEY;
    console.log("EcoInsight: Menggunakan MANUAL_API_KEY");
  }

  // 2. Check Environment Variables (Vercel requires VITE_ or REACT_APP_ prefix for client-side)
  if (!apiKey) {
    apiKey = 
      getEnvVariable('VITE_API_KEY') || 
      getEnvVariable('REACT_APP_API_KEY') || 
      getEnvVariable('NEXT_PUBLIC_API_KEY') ||
      getEnvVariable('API_KEY') || // Vercel usually blocks this on client-side, but worth a try
      "";
      
    if (apiKey) console.log("EcoInsight: Menggunakan Environment Variable");
  }

  if (!apiKey) {
    console.error("EcoInsight CRITICAL: Tiada API Key ditemui. Sila set VITE_API_KEY di Vercel atau guna MANUAL_API_KEY.");
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
  
  if (!ai) {
    return "RALAT: API Key tidak ditemui.\n\nJika di Vercel: Pastikan anda namakan variable sebagai 'VITE_API_KEY' (bukan sekadar API_KEY).\nJika Local: Masukkan key di fail services/geminiService.ts.";
  }

  try {
    // 1. Context Optimization
    const overCapacity = data
      .filter(d => d.usage_num > d.capacity_num)
      .sort((a, b) => b.utilization_rate - a.utilization_rate);
    
    const topRisks = overCapacity.slice(0, 10).map(d => 
      `- ${d.nama_fasil} (${d.negeri}): Beban ${d.usage_num} / Kapasiti ${d.capacity_num} (${d.utilization_rate.toFixed(1)}%)`
    ).join('\n');

    const totalCapacity = data.reduce((acc, curr) => acc + curr.capacity_num, 0);
    const totalUsage = data.reduce((acc, curr) => acc + curr.usage_num, 0);

    const summarizedContext = `
      RINGKASAN DATASET:
      - Jumlah Tapak: ${data.length}
      - Jumlah Kapasiti Sistem: ${totalCapacity}
      - Jumlah Penggunaan Sistem: ${totalUsage}
      - Tapak Melebihi Kapasiti: ${overCapacity.length}
      
      RISIKO UTAMA (Fasiliti Melebihi Kapasiti):
      ${topRisks}

      CONTOH DATA MENTAH (30 baris):
      ${JSON.stringify(data.slice(0, 30))}
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
          parts: [{ text: `Berikut adalah konteks analisis data:\n${summarizedContext}` }],
        },
        {
          role: 'model',
          parts: [{ text: "Saya telah menganalisis dataset ini. Sila tanya soalan anda." }],
        },
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
      ]
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "Tiada respons dijana.";

  } catch (error: any) {
    console.error("Gemini API Full Error:", error);
    
    // Detailed Error Handling for User Feedback
    let errorMessage = "Maaf, ralat berlaku semasa menghubungi AI.";
    
    if (error.message?.includes("403")) {
      errorMessage = "Ralat 403 (Permission Denied): API Key anda mungkin tidak sah atau tiada akses ke model 'gemini-2.5-flash'. Sila jana key baru di aistudio.google.com.";
    } else if (error.message?.includes("429")) {
      errorMessage = "Ralat 429 (Quota Exceeded): Anda telah melebihi had penggunaan API percuma seminit.";
    } else if (error.message?.includes("404")) {
      errorMessage = "Ralat 404 (Not Found): Model 'gemini-2.5-flash' mungkin belum tersedia untuk akaun/wilayah anda.";
    } else if (error.message?.includes("API key not valid")) {
        errorMessage = "API Key tidak sah. Sila semak semula huruf yang tertinggal.";
    }

    return `${errorMessage}\n\n(Semak Console pelayar [F12] untuk log penuh)`;
  }
};
