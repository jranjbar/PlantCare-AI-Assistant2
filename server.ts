import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large base64 body payloads for image processing
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Global mock database file for persisting user garden/reminders
const DB_PATH = path.join(process.cwd(), "user_garden_db.json");

// Helper to get Telegram environment variables
function getTelegramEnv() {
  return process.env.TELEGRAM_TOKEN || process.env.TG_TOKEN || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
}

// Helper to check Render external URL
function getWebhookEnv() {
  return process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/telegram` : "";
}

// Helper to read database
function readDB() {
  let db: any = { plants: [], notifications: [], cropPlans: [], subscription: null, telegramSettings: null };
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading database file, using empty default", e);
  }

  // Enforce default subscription if not present
  if (!db.subscription) {
    db.subscription = {
      tier: "free",
      scansCount: 0,
      plansCount: 0,
      chatsCount: 0,
      scansLimit: 3,
      plansLimit: 1,
      chatsLimit: 5
    };
  }

  // Enforce default telegram settings if not present, with environment fallbacks
  const envTgToken = getTelegramEnv();
  const envWebhook = getWebhookEnv();

  if (!db.telegramSettings) {
    db.telegramSettings = {
      tgToken: envTgToken || "729402518:AAFlw9C_SampleToken",
      webhookUrl: envWebhook || "https://my-plant-app.render.com/api/telegram",
      customWelcomeMsg: "سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم."
    };
  } else {
    // If the DB has the placeholder token but we have a real environment variable set, override it!
    if (envTgToken && (!db.telegramSettings.tgToken || db.telegramSettings.tgToken === "729402518:AAFlw9C_SampleToken" || db.telegramSettings.tgToken.includes("SampleToken"))) {
      db.telegramSettings.tgToken = envTgToken;
    }
    // If the DB has the fallback webhook URL but we have a real Render URL, override it!
    if (envWebhook && (!db.telegramSettings.webhookUrl || db.telegramSettings.webhookUrl.includes("my-plant-app.render.com") || db.telegramSettings.webhookUrl === "")) {
      db.telegramSettings.webhookUrl = envWebhook;
    }
  }
  return db;
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing database file", e);
  }
}

// Ensure database file is initialized
if (!fs.existsSync(DB_PATH)) {
  writeDB({
    plants: [],
    notifications: [],
    cropPlans: [],
    subscription: {
      tier: "free",
      scansCount: 0,
      plansCount: 0,
      chatsCount: 0,
      scansLimit: 3,
      plansLimit: 1,
      chatsLimit: 5
    }
  });
}

// Secure server-side Gemini AI client initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY variable is missing in environment!");
}

// Ensure we have a lazy-loaded AI or throw clear error
function getAIClient(): GoogleGenAI {
  if (!ai) {
    const freshKey = process.env.GEMINI_API_KEY;
    if (!freshKey) {
      throw new Error("کلید اختصاصی هوش مصنوعی (GEMINI_API_KEY) در سرور یافت نشد. لطفا در پنل Secrets آن را تنظیم کنید.");
    }
    ai = new GoogleGenAI({
      apiKey: freshKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// API: Check health and API key status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: Plant Identification & Disease Diagnosis Endpoint
app.post("/api/identify", async (req, res) => {
  try {
    const { image, mode } = req.body; // base64 payload, mode: 'identify' | 'disease' | 'both'
    if (!image) {
      return res.status(400).json({ error: "لطفاً تصویر گیاه خود را بارگذاری کنید." });
    }

    const db = readDB();
    if (db.subscription.tier === "free" && db.subscription.scansCount >= db.subscription.scansLimit) {
      return res.status(403).json({
        error: "محدودیت طرح رایگان: شما به سقف ۳ شناسایی و عارضه‌یابی رایگان رسیده‌اید. لطفاً جهت دریافت آنالیزهای نامحدود مزارع و گیاهان، حساب خود را بصورت آنی به کشاورز ویژه ارتقا دهید! 🌱"
      });
    }

    const client = getAIClient();

    // Extract mime and clean base64 data
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      }
    };

    const promptText = `
Analyze this plant image and provide detailed information in Persian (Farsi).
Analyze based on mode: "${mode || 'both'}".
Return a JSON response matching the following schema. Keep the text professional, scientific, but encouraging.

Required properties in Persian:
1. nameFarsi: Persian common name of the plant (e.g. حسن یوسف, پتوس).
2. nameEnglish: English name.
3. scientificName: Scientific/botanical name.
4. description: A brief, friendly summary about this plant.
5. confidence: An integer between 0 and 100 representing your prediction certainty.
6. careInfo: An object with:
   - watering: Watering frequency and amount (e.g. "هفته‌ای دو بار در فصول گرم، انگشت خود را فرو کرده...").
   - sunlight: Sunlight requirement details (e.g. "نور غیرمستقیم و روشن، حداقل ۵ ساعت در روز").
   - temperature: Ideal temperature range in Celsius (e.g. "۱۸ تا ۲۵ درجه سانتی‌گراد").
   - soil: Best soil mixture (e.g. "خاک سبک با زهکشی بسیار خوب").
   - toxicity: Toxicity info for dogs/cats.
7. healthStatus: An object containing:
   - healthScore: An integer between 0 and 100.
   - issuesFound: A boolean indicating if there are diseases/infestations.
   - symptoms: List of structural issues or symptoms analyzed from the image (e.g. "برگ‌های پایینی در حال زرد شدن هستند").
   - diagnoses: Title of identified disease/problem (in Persian, e.g. "قارچ طوقه" or "تنش کم‌آبی" or "سالم").
   - treatment: Detailed step-by-step treatment plan to cure or optimize the plant (in Persian).
8. quickTips: 3 short, actionable tips for immediate plant longevity.
9. cultivationAdvice: A brief introductory comment about growing this plant from scratch.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nameFarsi: { type: Type.STRING },
            nameEnglish: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            description: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            careInfo: {
              type: Type.OBJECT,
              properties: {
                watering: { type: Type.STRING },
                sunlight: { type: Type.STRING },
                temperature: { type: Type.STRING },
                soil: { type: Type.STRING },
                toxicity: { type: Type.STRING }
              },
              required: ["watering", "sunlight", "temperature", "soil", "toxicity"]
            },
            healthStatus: {
              type: Type.OBJECT,
              properties: {
                healthScore: { type: Type.INTEGER },
                issuesFound: { type: Type.BOOLEAN },
                symptoms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                diagnoses: { type: Type.STRING },
                treatment: { type: Type.STRING }
              },
              required: ["healthScore", "issuesFound", "diagnoses", "treatment"]
            },
            quickTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cultivationAdvice: { type: Type.STRING }
          },
          required: [
            "nameFarsi", "nameEnglish", "scientificName", "description",
            "confidence", "careInfo", "healthStatus", "quickTips", "cultivationAdvice"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText.trim());

    // Increment freemium scans count
    db.subscription.scansCount = (db.subscription.scansCount || 0) + 1;
    writeDB(db);

    res.json(resultObj);
  } catch (error: any) {
    console.error("Error identifying plant:", error);
    res.status(500).json({ error: error.message || "بروز خطا زیست‌محیطی در سرور" });
  }
});

// API: Generate Cultivation Plan (کشت تا برداشت زراعی و باغبانی)
app.post("/api/crop-plan", async (req, res) => {
  try {
    const { plantName, experienceLevel, plantingMethod, irrigationType, soilType, locationClimate } = req.body;

    if (!plantName) {
      return res.status(400).json({ error: "نام گیاه یا محصول زراعی الزامی است." });
    }

    const db = readDB();
    if (db.subscription.tier === "free" && db.subscription.plansCount >= db.subscription.plansLimit) {
      return res.status(403).json({
        error: "محدودیت طرح رایگان: تولید طرح‌های کشت پیشرفته و هوشمند در فاز آزمایشی فقط یک بار فعال است. برای دستیابی به آرشیو دائم برنامه‌های زراعی نامحدود، حساب خود را ویژه کنید."
      });
    }

    const client = getAIClient();

    const promptText = `
Create a comprehensive timeline-based cultivation and care plan (طرح جامع کشت، نگهداری و برداشت) for "${plantName}" in Persian.
Details provided:
- Method: ${plantingMethod || 'سفت‌کاری یا گلدانی یا صحرایی'}
- Experience level: ${experienceLevel || 'مبتدی'}
- Irrigation System: ${irrigationType || 'سنتی/قطره‌ای'}
- Soil Type: ${soilType || 'خاک معمولی باغچه'}
- Climate/Location: ${locationClimate || 'معتدل'}

Return a structured JSON response in Persian. Include coordinates of timeline phases from "Planting/Sowing" to "Harvesting" (کشت تا برداشت).

Required properties in Persian:
1. cropTitle: Title of the plan.
2. estimatedDurationWeeks: Integer number of weeks from seed/planting to harvest.
3. generalAdvice: General Persian summary outlining climate tips and critical details.
4. stages: An array of stages. Each stage has:
   - stageId: number (1, 2, 3...)
   - title: Title of stage (e.g. کاشت اولیه, جوانه زنی, رشد رویشی, گلدهی, برداشت)
   - durationWeeks: approximate duration in weeks (number)
   - temperatureIdeal: e.g. "۱۸-۲۴ درجه"
   - tasks: array of strings containing actionable instructions (watering, pest control, nutrition, pruning, soil check).
   - warningSigns: what to look out for (pests, root rot, yellowing).
5. pestControlTips: Specific integrated pest management ideas for this plant.
6. fertilizerTimeline: Suggested fertilizing schedule.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cropTitle: { type: Type.STRING },
            estimatedDurationWeeks: { type: Type.INTEGER },
            generalAdvice: { type: Type.STRING },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stageId: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  durationWeeks: { type: Type.INTEGER },
                  temperatureIdeal: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  warningSigns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["stageId", "title", "durationWeeks", "temperatureIdeal", "tasks", "warningSigns"]
              }
            },
            pestControlTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            fertilizerTimeline: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["cropTitle", "estimatedDurationWeeks", "generalAdvice", "stages", "pestControlTips", "fertilizerTimeline"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText.trim());

    // Increment freemium plans count
    db.subscription.plansCount = (db.subscription.plansCount || 0) + 1;
    writeDB(db);

    res.json(resultObj);
  } catch (error: any) {
    console.error("Error generating crop plan:", error);
    res.status(500).json({ error: error.message || "بروز خطا زراعی در سیستم پردازشگر" });
  }
});

// API: Chat Advisor (چت هوش مصنوعی متکی به تصویر یا متن)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, currentPlantImage } = req.body; // history = array of { role: 'user'|'model', text: string }

    const db = readDB();
    if (db.subscription.tier === "free" && db.subscription.chatsCount >= db.subscription.chatsLimit) {
      return res.status(403).json({
        error: "محدودیت طرح رایگان: شما به سقف ۵ پیام گفتگو با مشاور هوش مصنوعی رسیده‌اید. برای چت ۲۴ ساعته نامحدود زراعی با رویش‌بان، امتیاز حساب خود را ارتقا دهید!"
      });
    }

    const client = getAIClient();

    let contents: any[] = [];

    // Construct historical messages
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Prepare current user prompt
    const parts: any[] = [];
    if (currentPlantImage) {
      // Clean base64
      const matches = currentPlantImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = currentPlantImage;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        }
      });
    }

    parts.push({
      text: message || "درمورد نگهداری از گیاهان من صحبت کن."
    });

    contents.push({
      role: "user",
      parts: parts
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: `شما یک باغبان مجرب، مشاور کشاورزی متخصص و کارشناس گیاه‌پزشکی هستید. نام شما "رویش‌بان" است.
لحن شما صمیمی، دلسوزانه و بسیار علمی است. به زبان فارسی شیوا پاسخ تمام پرسش‌ها را بدهید.
پاسخ‌ها را در قالب پاراگراف‌های کوتاه و در صورت نیاز همراه با لیست‌های نشانه‌دار خروجی دهید.
اگر کاربری تصویر گیاهی فرستاد، بلافاصله آن را با نام فنی آن تحلیل کرده و به او بگویید که چه علائمی را مشاهده می‌کنید.
همواره نکات بهداشتی و زراعی مناسب را تأکید کنید و در آخر با یک عبارت انگیزاننده گفتگو را تمام کنید.`,
      }
    });

    // Increment freemium chats count
    db.subscription.chatsCount = (db.subscription.chatsCount || 0) + 1;
    writeDB(db);

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in AI chat support:", error);
    res.status(500).json({ error: error.message || "خطا در ارتباط با مشاور هوش مصنوعی" });
  }
});

// JSON Mock Store Endpoints (To load/save user plants data, crop timelines, notifications)
app.get("/api/garden", (req, res) => {
  const db = readDB();
  res.json(db);
});

app.post("/api/garden/plant", (req, res) => {
  const db = readDB();
  const newPlant = {
    id: "plant_" + Date.now(),
    addedDate: new Date().toISOString(),
    ...req.body
  };
  db.plants = db.plants || [];
  db.plants.push(newPlant);
  writeDB(db);
  res.json(newPlant);
});

app.put("/api/garden/plant/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.plants = db.plants || [];
  const index = db.plants.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    db.plants[index] = { ...db.plants[index], ...req.body };
    writeDB(db);
    return res.json(db.plants[index]);
  }
  res.status(404).json({ error: "گیاه پیدا نشد" });
});

app.delete("/api/garden/plant/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.plants = db.plants || [];
  db.plants = db.plants.filter((p: any) => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Notifications API
app.get("/api/notifications", (req, res) => {
  const db = readDB();
  res.json(db.notifications || []);
});

app.post("/api/notifications", (req, res) => {
  const db = readDB();
  const newNotif = {
    id: "notif_" + Date.now(),
    createdDate: new Date().toISOString(),
    completed: false,
    ...req.body
  };
  db.notifications = db.notifications || [];
  db.notifications.push(newNotif);
  writeDB(db);
  res.json(newNotif);
});

app.put("/api/notifications/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.notifications = db.notifications || [];
  const index = db.notifications.findIndex((n: any) => n.id === id);
  if (index !== -1) {
    db.notifications[index] = { ...db.notifications[index], ...req.body };
    writeDB(db);
    return res.json(db.notifications[index]);
  }
  res.status(404).json({ error: "یادآور پیدا نشد" });
});

app.delete("/api/notifications/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.notifications = db.notifications || [];
  db.notifications = db.notifications.filter((n: any) => n.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// --- Subscription management API (Freemium Model) ---
app.get("/api/subscription", (req, res) => {
  const db = readDB();
  res.json(db.subscription || {
    tier: "free",
    scansCount: 0,
    plansCount: 0,
    chatsCount: 0,
    scansLimit: 3,
    plansLimit: 1,
    chatsLimit: 5
  });
});

app.post("/api/subscription/upgrade", (req, res) => {
  const db = readDB();
  db.subscription = db.subscription || {};
  db.subscription.tier = "premium";
  writeDB(db);
  res.json({ success: true, subscription: db.subscription });
});

app.post("/api/subscription/reset-usage", (req, res) => {
  const db = readDB();
  db.subscription = {
    tier: "free",
    scansCount: 0,
    plansCount: 0,
    chatsCount: 0,
    scansLimit: 3,
    plansLimit: 1,
    chatsLimit: 5
  };
  writeDB(db);
  res.json({ success: true, subscription: db.subscription });
});

// --- Telegram configuration management API ---
app.get("/api/telegram-config", (req, res) => {
  const db = readDB();
  res.json(db.telegramSettings || {
    tgToken: "729402518:AAFlw9C_SampleToken",
    webhookUrl: "https://my-plant-app.render.com/api/telegram",
    customWelcomeMsg: "سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم."
  });
});

app.post("/api/telegram-config", (req, res) => {
  const db = readDB();
  const { tgToken, webhookUrl, customWelcomeMsg } = req.body;
  db.telegramSettings = {
    tgToken: tgToken || "729402518:AAFlw9C_SampleToken",
    webhookUrl: webhookUrl || "https://my-plant-app.render.com/api/telegram",
    customWelcomeMsg: customWelcomeMsg || "سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم."
  };
  writeDB(db);
  res.json({ success: true, telegramSettings: db.telegramSettings });
});

// --- Telegram Webhook: helper functions ---

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("Error sending Telegram message:", e);
  }
}

async function getTelegramFileBase64(token: string, fileId: string): Promise<string | null> {
  try {
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo: any = await fileInfoRes.json();
    if (!fileInfo.ok) return null;
    const filePath = fileInfo.result.file_path;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const arrayBuffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.error("Error downloading Telegram file:", e);
    return null;
  }
}

// --- Telegram Webhook: main endpoint ---
// This is the route that was MISSING. Telegram sends every incoming
// message (text, photo, /start, etc.) here as an HTTP POST.

app.post("/api/telegram", async (req, res) => {
  // Acknowledge Telegram immediately so it doesn't retry/timeout.
  res.sendStatus(200);

  try {
    const update = req.body;
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const db = readDB();
    const token = db.telegramSettings?.tgToken || getTelegramEnv();

    if (!token) {
      console.error("Telegram token is not configured.");
      return;
    }

    // /start command
    if (message.text === "/start") {
      const welcome =
        db.telegramSettings?.customWelcomeMsg ||
        "سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم.";
      await sendTelegramMessage(token, chatId, welcome);
      return;
    }

    // Photo message -> plant identification & disease diagnosis
    if (message.photo && message.photo.length > 0) {
      if (db.subscription.tier === "free" && db.subscription.scansCount >= db.subscription.scansLimit) {
        await sendTelegramMessage(
          token,
          chatId,
          "محدودیت طرح رایگان: شما به سقف شناسایی‌های رایگان رسیده‌اید. لطفاً حساب خود را ارتقا دهید."
        );
        return;
      }

      const largestPhoto = message.photo[message.photo.length - 1];
      const base64Image = await getTelegramFileBase64(token, largestPhoto.file_id);
      if (!base64Image) {
        await sendTelegramMessage(token, chatId, "متاسفانه در دریافت تصویر مشکلی پیش آمد. دوباره تلاش کنید.");
        return;
      }

      await sendTelegramMessage(token, chatId, "🔍 در حال تحلیل تصویر گیاه شما هستم، چند لحظه صبر کنید...");

      const client = getAIClient();
      const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/jpeg";
      const base64Data = matches ? matches[2] : base64Image;

      const promptText = `این تصویر یک گیاه را تحلیل کن و به زبان فارسی پاسخ بده. نام گیاه، وضعیت سلامتی، علائم احتمالی بیماری و یک دستورالعمل کوتاه مراقبتی را در چند پاراگراف کوتاه و خوانا برای پیام تلگرام بنویس (بدون فرمت JSON، فقط متن ساده).`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: promptText }] },
      });

      db.subscription.scansCount = (db.subscription.scansCount || 0) + 1;
      writeDB(db);

      await sendTelegramMessage(token, chatId, response.text || "متاسفانه نتوانستم تصویر را تحلیل کنم.");
      return;
    }

    // Plain text message -> chat with Gemini gardening advisor "رویش‌بان"
    if (message.text) {
      if (db.subscription.tier === "free" && db.subscription.chatsCount >= db.subscription.chatsLimit) {
        await sendTelegramMessage(
          token,
          chatId,
          "محدودیت طرح رایگان: شما به سقف پیام‌های گفتگوی رایگان رسیده‌اید. لطفاً حساب خود را ارتقا دهید."
        );
        return;
      }

      const client = getAIClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: message.text }] }],
        config: {
          systemInstruction: `شما یک باغبان مجرب، مشاور کشاورزی متخصص و کارشناس گیاه‌پزشکی هستید. نام شما "رویش‌بان" است.
لحن شما صمیمی، دلسوزانه و بسیار علمی است. به زبان فارسی شیوا و کوتاه (مناسب پیام تلگرام) پاسخ دهید.
همواره نکات بهداشتی و زراعی مناسب را تأکید کنید و در آخر با یک عبارت انگیزاننده گفتگو را تمام کنید.`,
        },
      });

      db.subscription.chatsCount = (db.subscription.chatsCount || 0) + 1;
      writeDB(db);

      await sendTelegramMessage(token, chatId, response.text || "متوجه پیام شما نشدم، لطفاً دوباره بنویسید.");
      return;
    }
  } catch (error) {
    console.error("Error handling Telegram webhook:", error);
  }
});
// Serve Frontend Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // server.cjs is built inside the dist folder, so __dirname matches the dist folder itself
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] PlantCare AI Assistant running at: http://localhost:${PORT}`);
  });
}

startServer();
