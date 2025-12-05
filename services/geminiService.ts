import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { WasteFacility } from "../types";

// =================================================================================
// 🔑 RUANGAN KHAS UNTUK API KEY ANDA
// Jika Vercel Environment Variables tidak berfungsi, sila 'paste' API Key anda 
// terus di dalam tanda petik di bawah ini.
//
// Contoh: const MANUAL_API_KEY = "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxx";
// =================================================================================
const MANUAL_API_KEY = "AIzaSyAO-hSIToKL7vg2E1NNWrFxELe_7aHFMcI"; 
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
    // Abaikan jika process tidak wujud
  }

  // 2. Cuba baca dari import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Abaikan ralat syntax jika bukan module
  }

  return undefined;
};

export const initializeGemini = () => {
  // Susunan Keutamaan:
  // 1. Manual Key (Hardcoded oleh pengguna)
  // 2. Environment Variables (Vercel/Sistem)
  
  let apiKey = MANUAL_API_KEY;

  if (!apiKey) {
    apiKey = 
      getEnvVariable('API_KEY') || 
      getEnvVariable('VITE_API_KEY') || 
      getEnvVariable('REACT_APP_API_KEY') || 
      getEnvVariable('NEXT_PUBLIC_API_KEY') ||
      "";
  }

  // Debugging: Cetak status di konsol
  if (apiKey) {
    // console.log("EcoInsight: API Key berjaya dikesan."); 
  } else {
    console.warn("EcoInsight: API Key TIDAK dikesan. Sila isikan 'MANUAL_API_KEY' di fail services/geminiService.ts atau tetapkan environment variable.");
  }

  if (!apiKey) {
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
    return "RALAT KONFIGURASI: API Key tidak ditemui. Sila buka fail 'services/geminiService.ts' dan masukkan API Key anda di bahagian 'MANUAL_API_KEY'.";
  }

  try {
    // 1. Context Optimization: Pre-calculate critical insights so the AI doesn't miss them in truncation
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

      CONTOH DATA MENTAH (50 baris pertama JSON):
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
          parts: [{ text: `Berikut adalah konteks analisis data:\n${summarizedContext}` }],
        },
        {
          role: 'model',
          parts: [{ text: "Saya telah menganalisis dataset ini, termasuk penggunaan kapasiti dan risiko kritikal. Saya bersedia menjawab soalan spesifik dalam Bahasa Melayu." }],
        },
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
      ]
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "Tiada respons dijana.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, saya menghadapi masalah semasa menghubungi AI. Sila pastikan API Key anda sah dan mempunyai kuota yang mencukupi.";
  }
};
