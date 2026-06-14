import React, { useState, useEffect, useRef } from "react";
import {
  Leaf,
  Camera,
  Calendar,
  Bell,
  MessageSquare,
  Github,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  BookOpen,
  Sliders,
  Send,
  X,
  Droplet,
  Sun,
  Sparkles,
  ExternalLink,
  Code2
} from "lucide-react";
import {
  PlantResult,
  CropPlanResult,
  SavedPlant,
  CareNotification,
  ChatMessage,
  PlantLog
} from "./types";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "identify" | "cropplan" | "reminders" | "advisor" | "personalize" | "premium"
  >("dashboard");

  // Global State parsed from Express backend
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [notifications, setNotifications] = useState<CareNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Freemium Subscription State
  const [subscriptionObj, setSubscriptionObj] = useState({
    tier: "free",
    scansCount: 0,
    plansCount: 0,
    chatsCount: 0,
    scansLimit: 3,
    plansLimit: 1,
    chatsLimit: 5
  });

  // AI Identification States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"identify" | "disease" | "both">("both");
  const [idResult, setIdResult] = useState<PlantResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop Plan Generator States
  const [cropInput, setCropInput] = useState({
    plantName: "",
    experienceLevel: "متوسط (باغبان آماتور)",
    plantingMethod: "گلدان آپارتمانی",
    irrigationType: "قطره‌ای دستی",
    soilType: "خاک سبک پیت‌ماس و پرلیت",
    locationClimate: "معتدل / گرمسیری",
  });
  const [generatedCropPlan, setGeneratedCropPlan] = useState<CropPlanResult | null>(null);

  // Advisor Chat States
  const [advisorChat, setAdvisorChat] = useState<ChatMessage[]>([
    {
      id: "init_1",
      role: "model",
      text: "سلام دوست من! من دستیار هوشمند و متخصص کشاورزی و گیاه‌شناسی شما «رویش‌بان» هستم. تصویر یا سوال خود درباره بیماری، آبیاری یا کاشت گیاهان بفرست تا کمکت کنم. 🌱",
      timestamp: new Date().toLocaleTimeString("fa-IR"),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // New manual plant popup or growth log modal
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [newManualPlant, setNewManualPlant] = useState({
    nameFarsi: "",
    nameEnglish: "",
    scientificName: "",
    description: "",
    watering: "هفته‌ای دو بار",
    sunlight: "نور غیرمستقیم فیلتر شده",
    temperature: "۱۸ تا ۲۵ درجه سانتی‌گراد",
    soil: "مخلوط پرلیت و پیت‌ماس",
    toxicity: "بدون خطر برای حیوانات خانگی",
    imageUrl: "",
  });

  const [activeLogPlantId, setActiveLogPlantId] = useState<string | null>(null);
  const [newLogText, setNewLogText] = useState("");
  const [newLogStatus, setNewLogStatus] = useState<PlantLog["status"]>("عالی");

  // Notification builder States
  const [newNotif, setNewNotif] = useState({
    plantName: "",
    type: "آبیاری" as CareNotification["type"],
    frequencyDays: 3,
    timeString: "09:00",
  });

  // Exportable bot settings
  const [tgToken, setTgToken] = useState("729402518:AAFlw9C_SampleToken");
  const [webhookUrl, setWebhookUrl] = useState("https://my-plant-app.render.com/api/telegram");
  const [customWelcomeMsg, setCustomWelcomeMsg] = useState("سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم.");

  // Fetch garden list, notifications & subscription status on mount
  useEffect(() => {
    fetchGardenData();
    fetchNotifications();
    fetchSubscription();
    fetchTelegramConfig();
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const res = await fetch("/api/telegram-config");
      if (res.ok) {
        const data = await res.json();
        setTgToken(data.tgToken || "729402518:AAFlw9C_SampleToken");
        setWebhookUrl(data.webhookUrl || `${window.location.origin}/api/telegram`);
        setCustomWelcomeMsg(data.customWelcomeMsg || "سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. تصویر گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم.");
      }
    } catch (e) {
      console.error("Error fetching telegram config from db", e);
    }
  };

  const saveTelegramConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tgToken, webhookUrl, customWelcomeMsg }),
      });
      if (res.ok) {
        showToast("تنظیمات اختصاصی ربات تلگرام با موفقیت در پایگاه وب‌سایت ذخیره و اعمال شد! 🌱", "success");
        fetchTelegramConfig();
      } else {
        throw new Error("خطا در پاسخ سرور");
      }
    } catch (err) {
      console.error(err);
      showToast("برقراری اتصال جهت ثبت تنظیمات با خطا مواجه شد.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionObj(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const upgradeToPremium = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/upgrade", { method: "POST" });
      if (res.ok) {
        showToast("حساب شما با موفقیت به کشاورز برتر (VIP و ویژه) ارتقا یافت! تمام محدودیت‌ها برطرف شدند. 👑", "success");
        fetchSubscription();
      }
    } catch (e) {
      console.error(e);
      showToast("خطا در برقراری ارتباط با درگاه پرداخت صوری", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetSubscriptionUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/reset-usage", { method: "POST" });
      if (res.ok) {
        showToast("اطلاعات مصرف شما ریست شد و حساب به حالت رایگان آزمایش تغییر جهت داد.", "info");
        fetchSubscription();
      }
    } catch (e) {
      console.error(e);
      showToast("خطا در بازنشانی مصرف طرح‌ها", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [advisorChat]);

  // Show status message toaster helper
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const fetchGardenData = async () => {
    try {
      const res = await fetch("/api/garden");
      if (res.ok) {
        const data = await res.json();
        setSavedPlants(data.plants || []);
      }
    } catch (e) {
      console.error(e);
      showToast("خطا در بارگذاری اطلاعات صندقچه گیاهان", "error");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Convert uploaded files to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "identify" | "chat") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === "identify") {
        setSelectedImage(reader.result as string);
      } else {
        setChatImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // call /api/identify
  const submitIdentification = async () => {
    if (!selectedImage) {
      showToast("لطفاً ابتدا یک تصویر را انتخاب کنید", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage, mode }),
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 403) {
          showToast(errData.error || "به حد مجاز طرح رایگان رسیده‌اید.", "info");
          setActiveTab("premium");
          return;
        }
        throw new Error(errData.error || "خطای پردازش هوش مصنوعی");
      }
      const data: PlantResult = await res.json();
      setIdResult(data);
      showToast("شناسایی گیاه با موفقیت انجام شد!", "success");
      fetchSubscription();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "مشکلی در دریافت پاسخ رخ داد. سلامت متغیرها را بازبینی کنید.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Call /api/crop-plan
  const generateNewPlan = async () => {
    if (!cropInput.plantName) {
      showToast("لطفاً نام گیاه مورد نظر خود را بنویسید", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/crop-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cropInput),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 403) {
          showToast(err.error || "محدودیت طرح رایگان", "info");
          setActiveTab("premium");
          return;
        }
        throw new Error(err.error || "سرور در ایجاد برنامه جوابگو نبود");
      }
      const data: CropPlanResult = await res.json();
      setGeneratedCropPlan(data);
      showToast(`برنامه زراعی ${data.cropTitle} با جزئیات کامل ایجاد شد`, "success");
      fetchSubscription();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "لینک اتصال به سرور قطع شد.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Call /api/chat
  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatImage) return;

    const userMsgText = chatInput;
    const userMsgImg = chatImage;
    const tempUserMsg: ChatMessage = {
      id: "user_" + Date.now(),
      role: "user",
      text: userMsgText,
      image: userMsgImg || undefined,
      timestamp: new Date().toLocaleTimeString("fa-IR"),
    };

    setAdvisorChat((prev) => [...prev, tempUserMsg]);
    setChatInput("");
    setChatImage(null);
    setLoading(true);

    try {
      // Build history excluding current item
      const historyPayload = advisorChat.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          history: historyPayload,
          currentPlantImage: userMsgImg,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 403) {
          showToast(err.error || "محدودیت چت رایگان", "info");
          setActiveTab("premium");
          return;
        }
        throw new Error("اتصال با مربی باغبانی برقرار نشد");
      }
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("fa-IR"),
      };
      setAdvisorChat((prev) => [...prev, aiMsg]);
      fetchSubscription();
    } catch (err: any) {
      console.error(err);
      showToast("پاسخ هوش صمیمی دریافت نشد", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save identified result to Garden
  const saveIdentifiedPlantToGarden = async () => {
    if (!idResult) return;
    try {
      const payload = {
        nameFarsi: idResult.nameFarsi,
        nameEnglish: idResult.nameEnglish,
        scientificName: idResult.scientificName,
        description: idResult.description,
        imageUrl: selectedImage || undefined,
        careInfo: idResult.careInfo,
        healthStatus: idResult.healthStatus,
        logs: [
          {
            id: "log_" + Date.now(),
            date: new Date().toLocaleDateString("fa-IR"),
            notes: "شناسایی اولیه با هوش مصنوعی و تایید هویت گیاه",
            status: idResult.healthStatus.issuesFound ? "بیمار" : "عالی",
          },
        ],
      };

      const res = await fetch("/api/garden/plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("گیاه شما به صندوقچه و شناسنامه توسعه شخصی اضافه شد!", "success");
        fetchGardenData();
        // Automatically create a recurring watering reminder based on text clue
        const isSpidey = idResult.careInfo.watering.includes("دو") || idResult.careInfo.watering.includes("2");
        await createReminderFromId(idResult.nameFarsi, isSpidey ? 4 : 7);
      }
    } catch (e) {
      console.error(e);
      showToast("خطا در ثبت صندقچه", "error");
    }
  };

  const createReminderFromId = async (plantName: string, days: number) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName,
          type: "آبیاری",
          frequencyDays: days,
          timeString: "09:00",
        }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Plant manually
  const saveManualPlant = async () => {
    if (!newManualPlant.nameFarsi) {
      showToast("نام گیاه الزامی است", "error");
      return;
    }
    try {
      const payload = {
        ...newManualPlant,
        logs: [
          {
            id: "log_" + Date.now(),
            date: new Date().toLocaleDateString("fa-IR"),
            notes: "ثبت دستی گیاه در پانل مراقبتی",
            status: "عالی",
          },
        ],
      };
      const res = await fetch("/api/garden/plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("گیاه جدید ثبت گردید", "success");
        setIsAddPlantModalOpen(false);
        fetchGardenData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete plant from garden
  const deletePlant = async (id: string) => {
    if (!confirm("آیا مایل به حذف این گیاه از آرشیو باغچه هستید؟")) return;
    try {
      const res = await fetch(`/api/garden/plant/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("گیاه از صندوقچه حذف شد", "info");
        fetchGardenData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add growth log in history
  const addGrowthLog = async () => {
    if (!newLogText.trim() || !activeLogPlantId) return;
    const plant = savedPlants.find((p) => p.id === activeLogPlantId);
    if (!plant) return;

    const newLogItem: PlantLog = {
      id: "log_" + Date.now(),
      date: new Date().toLocaleDateString("fa-IR"),
      notes: newLogText,
      status: newLogStatus,
    };

    const updatedLogs = [newLogItem, ...(plant.logs || [])];

    try {
      const res = await fetch(`/api/garden/plant/${activeLogPlantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: updatedLogs }),
      });
      if (res.ok) {
        showToast("گزارش دوره‌ای رشد با موفقیت الصاق گردید", "success");
        setNewLogText("");
        setActiveLogPlantId(null);
        fetchGardenData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add custom reminder notification
  const handleAddNewReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotif.plantName) {
      showToast("نام گیاه برای یادآور الزامی است", "error");
      return;
    }
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotif),
      });
      if (res.ok) {
        showToast("یادآوری هوشمند ثبت گردید", "success");
        setNewNotif({ plantName: "", type: "آبیاری", frequencyDays: 3, timeString: "09:00" });
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action complete reminder
  const toggleReminderComplete = async (notif: CareNotification) => {
    try {
      const res = await fetch(`/api/notifications/${notif.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !notif.completed,
          lastDoneDate: new Date().toLocaleDateString("fa-IR"),
        }),
      });
      if (res.ok) {
        showToast(
          notif.completed ? "یادآوری مجدداً فعال شد" : `عملیات ${notif.type} برای ${notif.plantName} انجام شد و ثبت گردید.`,
          "success"
        );
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete reminder
  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("یادآور با موفقیت منقضی شد.", "info");
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate notification triggered
  const triggerSimulatedAlert = () => {
    showToast("🔔 هشدار خودکار: گیاه حسن یوسف تشنه است! زمان نوبت آبیاری شماره ۸ فرارسیده است.", "info");
  };

  return (
    <div className="h-screen w-full bg-[#050905] text-white font-sans flex overflow-hidden p-3 select-none relative">
      {/* Absolute glowing spheres for Frosted Glass backdrop depth */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-950 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-green-900 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-lime-950 rounded-full blur-[120px]" />
      </div>

      {/* Side Glass Sidebar Navigation */}
      <aside className="w-80 h-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col z-10 p-6 ml-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-lime-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-2 ring-emerald-300/30">
            🌿
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 leading-tight">
              <span>گلدان من</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/20 px-1.5 py-0.5 rounded-full font-bold">هوشمند</span>
            </h1>
            <p className="text-[11px] text-white/50 font-mono">My PlantCare AI v2.4</p>
          </div>
        </div>

        {/* Global Nav list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          <div
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "dashboard"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="font-semibold text-sm">داشبورد مراقبت گیاهان</span>
            </div>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70 font-mono">
              {savedPlants.length}
            </span>
          </div>

          <div
            onClick={() => setActiveTab("identify")}
            className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "identify"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xl">🔍</span>
            <span className="font-semibold text-sm">شناسایی و عارضه‌یاب گیاه</span>
          </div>

          <div
            onClick={() => setActiveTab("cropplan")}
            className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "cropplan"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xl">📅</span>
            <span className="font-semibold text-sm">طرح جامع کشت تا برداشت</span>
          </div>

          <div
            onClick={() => setActiveTab("reminders")}
            className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "reminders"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="font-semibold text-sm">یادآوری‌های مراقبت</span>
            </div>
            {notifications.filter((n) => !n.completed).length > 0 && (
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          <div
            onClick={() => setActiveTab("advisor")}
            className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "advisor"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="font-semibold text-sm">مشاوره هوش مصنوعی رویش‌بان</span>
          </div>

          <div
            onClick={() => setActiveTab("personalize")}
            className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "personalize"
                ? "bg-white/15 text-emerald-400 border border-white/10 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xl">🛠️</span>
            <span className="font-semibold text-sm">شخصی‌سازی و تنظیمات بات</span>
          </div>

          <div
            onClick={() => setActiveTab("premium")}
            className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === "premium"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 border border-amber-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👑</span>
              <span className="font-semibold text-sm">طرح کاربری ویژه (VIP)</span>
            </div>
            {subscriptionObj.tier === "premium" ? (
              <span className="text-[10px] bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full">VIP فعال</span>
            ) : (
              <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-mono">رایگان</span>
            )}
          </div>
        </nav>

        {/* Telegram Integration Panel Summary in sidebar */}
        <div className="mt-auto p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold mb-1">اتصال گیت‌هاب و رندر</p>
          <p className="text-xs font-semibold text-emerald-100">آماده صدور کد تلگرام</p>
          <p className="text-[9px] text-white/40 mt-1 uppercase font-mono">Render and GitHub Ready</p>
        </div>
      </aside>

      {/* Main glass workspace container */}
      <main className="flex-1 h-full z-10 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex justify-between items-center bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 mb-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-emerald-100 font-sans tracking-tight">
              {activeTab === "dashboard" && "میز کار و صندوقچه رشد گیاه"}
              {activeTab === "identify" && "شناسایی هوشمند گیاهان و کلینیک شفابخش"}
              {activeTab === "cropplan" && "سیستم برنامه‌ریزی زراعی کشت تا برداشت"}
              {activeTab === "reminders" && "یادآوری‌های خودکار مراقبت و پیشگیری"}
              {activeTab === "advisor" && "مشاوره لحظه‌ای با متخصص باغبانی رویش‌بان"}
              {activeTab === "personalize" && "تنظیمات شخصی‌سازی ربات تلگرام و داک اینتگریشن"}
              {activeTab === "premium" && "طرح‌های فرومیوم و توسعه مزارع ویژه"}
            </h2>
            <p className="text-white/50 text-xs text-right">
              تحلیل زنده گیاه‌پزشکی با مدل Gemini 3.5 Flash به صورت امن در سرور
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsAddPlantModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن گیاه به صندوقچه</span>
            </button>
            <button
              onClick={triggerSimulatedAlert}
              className="p-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer text-yellow-400 hover:bg-white/20 transition-all"
              title="شبیه‌سازی هشدار اتوماتیک"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Outer content container based on tab */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* Toast Notification */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 backdrop-blur-md shadow-2xl transition-all duration-300 border ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                  : statusMessage.type === "error"
                  ? "bg-red-500/20 text-red-300 border-red-400/30"
                  : "bg-blue-500/20 text-blue-300 border-blue-400/30"
              }`}
            >
              <span className="text-lg">📢</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* LOADING SPINNER */}
          {loading && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm font-semibold text-emerald-300">هوش مصنوعی گلدان من در حال تحلیل و محاسبه است...</p>
              <p className="text-xs text-white/40">این فرآیند به طور مستقیم و ایمن در سرور انجام می‌شود.</p>
            </div>
          )}

          {/* 1. TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Garden Plants History & Status Column (Col span 2) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Visual Header Banner */}
                <div className="bg-gradient-to-br from-emerald-900/30 via-white/5 to-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        پیشخوان رصدخانه زنده
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">شمار کل باغچه: {savedPlants.length} گیاه</h3>
                      <p className="text-xs text-white/60 leading-relaxed mt-1">
                        با ثبت مستمر گیاهان، تاریخچه رشد آن‌ها را بررسی کنید و از یادآورهای هوشمند آبیاری و تغذیه برخوردار شوید.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab("identify")}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span>تشخیص گیاه جدید</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved Plants List */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-4 col-span-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <h3 className="font-bold text-md text-emerald-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                      <span>صندوقچه و شناسنامه گیاهان من</span>
                    </h3>
                    <p className="text-xs text-white/40 font-mono">Total Saved: {savedPlants.length}</p>
                  </div>

                  {savedPlants.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="text-4xl text-white/30">🪴</div>
                      <p className="text-sm text-white/50 font-medium">هیچ گیاهی هنوز در صندوقچه شما ثبت نشده است.</p>
                      <p className="text-xs text-white/30">برای شروع از بخش «شناسایی با هوش مصنوعی» تصویر گیاه را بارگذاری کنید یا آن را به صورت دستی ثبت کنید.</p>
                      <button
                        onClick={() => setIsAddPlantModalOpen(true)}
                        className="mt-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        ثبت دستی گیاه برای آزمایش
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedPlants.map((plant) => (
                        <div
                          key={plant.id}
                          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-emerald-500/30 transition-all relative"
                        >
                          <div className="flex gap-3">
                            {plant.imageUrl ? (
                              <img
                                src={plant.imageUrl}
                                alt={plant.nameFarsi}
                                className="w-16 h-16 rounded-xl object-cover border border-white/15 shadow-md flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                                🌱
                              </div>
                            )}

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-sm text-emerald-300 truncate">
                                  {plant.nameFarsi}
                                </h4>
                                <button
                                  onClick={() => deletePlant(plant.id)}
                                  className="text-white/40 hover:text-red-400 p-0.5 transition-all cursor-pointer"
                                  title="حذف گیاه"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-white/40 font-mono italic truncate">
                                {plant.scientificName} ({plant.nameEnglish})
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                                <span className="text-[10px] text-white/60">
                                  ثبت در: {new Date(plant.addedDate).toLocaleDateString("fa-IR")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Watering & Light badges */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/20 p-2 rounded-xl">
                            <div className="space-y-0.5">
                              <span className="text-white/40 font-bold block">💧 آبیاری:</span>
                              <span className="text-emerald-100 font-medium truncate block">{plant.careInfo.watering}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-white/40 font-bold block">☀️ نوردهی:</span>
                              <span className="text-emerald-100 font-medium truncate block">{plant.careInfo.sunlight}</span>
                            </div>
                          </div>

                          {/* Progress Growth Notes Logs */}
                          <div className="space-y-1 pt-1.5 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-white/50 font-bold">دفترچه وضعیت رشد:</span>
                              <button
                                onClick={() => setActiveLogPlantId(plant.id)}
                                className="text-emerald-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                              >
                                + یادداشت جدید
                              </button>
                            </div>
                            
                            {/* Scrollable logs inside card */}
                            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                              {plant.logs && plant.logs.length > 0 ? (
                                plant.logs.map((log) => (
                                  <div key={log.id} className="text-[10px] bg-white/5 p-1.5 rounded-lg border border-white/5">
                                    <div className="flex justify-between font-semibold text-white/70">
                                      <span>{log.date}</span>
                                      <span className={`px-1 rounded text-[8px] ${
                                        log.status === "عالی" ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"
                                      }`}>
                                        {log.status}
                                      </span>
                                    </div>
                                    <p className="text-white/80 leading-relaxed mt-0.5">{log.notes}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-white/30 italic text-center py-2">هیچ گزارش دوره‌ای ثبت نشده است.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar column 1 */}
              <div className="col-span-1 space-y-4">
                
                {/* Health Overview & Quick Check Card */}
                <section className="bg-gradient-to-tr from-emerald-950/20 to-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>رصد کیفیت گیاه‌پزشکی</span>
                  </h3>
                  
                  <div className="text-center py-2">
                    <div className="inline-block bg-emerald-500/10 border border-emerald-400/20 p-4 rounded-3xl relative">
                      <span className="text-4xl font-mono font-black text-emerald-400">
                        {savedPlants.length > 0 
                          ? Math.round(savedPlants.reduce((acc, p) => acc + (p.healthStatus?.healthScore || 90), 0) / savedPlants.length) 
                          : 100}
                        %
                      </span>
                      <p className="text-[9px] text-white/50 uppercase mt-1 font-mono">Index Health</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed text-justify">
                    شاخص گیاه‌پزشکی بر اساس برآیند سلامت گیاهان صندوقچه شما سنجیده شده است. از هوش مصنوعی برای پایش برگ‌ها و پیشگیری از لکه‌های خشک استفاده کنید.
                  </p>

                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs font-bold text-white block">🌱 توصیه‌های عمومی بهداشت خاک:</span>
                    <ul className="text-[11px] text-white/60 space-y-1 list-disc list-inside">
                      <li>زهکشی گلدان را هر ۲ ماه بررسی کنید.</li>
                      <li>فقط در زمان خشکی خاک آبیاری انجام شود.</li>
                      <li>آب کلر روفته برای ریشه مناسب است.</li>
                    </ul>
                  </div>
                </section>

                {/* Simulating auto scheduler alerts */}
                <section className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 space-y-3">
                  <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>وضعیت شبیه‌ساز نوتیفیکیشن</span>
                  </h3>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    این پنل مجهز به کرون هوشمند در سرور برای ارسال فرضی نوتیفیکیشن‌های یادآوری مراقبت است.
                  </p>
                  <button
                    onClick={triggerSimulatedAlert}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ارسال هشدار تستی به مرورگر
                  </button>
                </section>

              </div>
            </div>
          )}

          {/* 2. TAB: AI IDENTIFY */}
          {activeTab === "identify" && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/15">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span>اسکنر زنده و کلینیک گیاه‌پزشکی هوش مصنوعی (Gemini)</span>
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    تصویر گیاه مورد نظر را بارگذاری کنید. هوش مصنوعی آن را شناسایی کرده و سلامت، آبیاری و راهنمای کاشت را استخراج خواهد کرد.
                  </p>
                </div>

                {/* Selection Mode */}
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setMode("identify")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      mode === "identify" ? "bg-emerald-500 text-black shadow-md" : "text-white/60"
                    }`}
                  >
                    فقط شناسایی نام
                  </button>
                  <button
                    onClick={() => setMode("disease")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      mode === "disease" ? "bg-emerald-500 text-black shadow-md" : "text-white/60"
                    }`}
                  >
                    فقط تشخیص بیماری
                  </button>
                  <button
                    onClick={() => setMode("both")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      mode === "both" ? "bg-emerald-500 text-black shadow-md" : "text-white/60"
                    }`}
                  >
                    شناسایی کامل و درمان عارضه‌ها
                  </button>
                </div>
              </div>

              {/* Upload interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left side: Upload Drop Zone */}
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 bg-black/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-video relative group overflow-hidden"
                  >
                    {selectedImage ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={selectedImage} alt="Selected Plant" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 group-hover:opacity-100 opacity-0 flex items-center justify-center transition-all">
                          <span className="text-xs font-bold text-emerald-300">تغییر تصویر گیاه 🌿</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-3xl text-emerald-400 group-hover:scale-110 transition-all">
                          📸
                        </div>
                        <p className="text-sm font-bold text-white">انتخاب یا درگ تصویر برگ، گل یا گلدان</p>
                        <p className="text-xs text-white/40">فرمت‌های JPG، PNG به طور خودکار پردازش می‌شوند</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "identify")}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={submitIdentification}
                      disabled={!selectedImage || loading}
                      className="flex-1 bg-gradient-to-tr from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span> شروع تحلیل فوری هوش مصنوعی</span>
                    </button>

                    {selectedImage && (
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setIdResult(null);
                        }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white p-3.5 rounded-2xl transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sample presets for quick testing */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs font-bold text-white block">💡 عکس یا ایده برای آزمون سریع ندارید؟</span>
                    <p className="text-[11px] text-white/50 leading-relaxed text-justify">
                      تصویری از گیاه خانگی خود بگیرید یا عکسی از گلبرگ‌های لکه‌دار آپلود کنید تا از قدرت تشخیص مدل پیشرفته لایه سرور شگفت‌زده شوید.
                    </p>
                  </div>
                </div>

                {/* Right side: AI Results view */}
                <div className="space-y-4">
                  {idResult ? (
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            اطلاعات شناسایی شده
                          </span>
                          <h4 className="text-2xl font-black text-white mt-1.5">{idResult.nameFarsi}</h4>
                          <h5 className="text-xs text-white/50 font-mono italic">{idResult.scientificName} ({idResult.nameEnglish})</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 block">درصد اطمینان</span>
                          <span className="text-lg font-mono font-bold text-emerald-400">{idResult.confidence}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed text-justify">{idResult.description}</p>

                      {/* Care Parameters section */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-emerald-300 font-bold block flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5" /> آبیاری مناسب:
                          </span>
                          <p className="text-white/80 mt-1 leading-relaxed">{idResult.careInfo.watering}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-yellow-300 font-bold block flex items-center gap-1">
                            <Sun className="w-3.5 h-3.5" /> شرایط نوری:
                          </span>
                          <p className="text-white/80 mt-1 leading-relaxed">{idResult.careInfo.sunlight}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-teal-300 font-bold block">🌡️ دمای ایده‌آل:</span>
                          <p className="text-white/80 mt-1 leading-relaxed">{idResult.careInfo.temperature}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-purple-300 font-bold block">🐾 سمیت زیستی (حیوانات):</span>
                          <p className="text-white/80 mt-1 leading-relaxed">{idResult.careInfo.toxicity}</p>
                        </div>
                      </div>

                      {/* Health & Disease Check results */}
                      <div className={`p-4 rounded-2xl border ${
                        idResult.healthStatus.issuesFound 
                          ? "bg-red-500/10 border-red-500/20 text-red-200"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-extrabold text-xs flex items-center gap-1.5">
                            {idResult.healthStatus.issuesFound ? (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span>عوارض و بیماری: {idResult.healthStatus.diagnoses}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>وضعیت فیزیکی ایده‌آل و بدون عارضه مشخص</span>
                              </>
                            )}
                          </h5>
                          <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                            امتیاز سلامت {idResult.healthStatus.healthScore}/۱۰۰
                          </span>
                        </div>

                        {idResult.healthStatus.symptoms.length > 0 && (
                          <div className="text-[11px] mb-2 space-y-1">
                            <strong>علائم مشهود در تصویر:</strong>
                            <ul className="list-disc list-inside space-y-0.5 text-white/70">
                              {idResult.healthStatus.symptoms.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </div>
                        )}

                        <p className="text-[11px] leading-relaxed text-white/85">
                          <strong>دستورالعمل درمان و بهبود:</strong> {idResult.healthStatus.treatment}
                        </p>
                      </div>

                      {/* Quick suggestions to implement */}
                      <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[11px] font-bold text-white block mb-1.5">💡 ۳ گام حیاتی مراقبتی:</span>
                        <ul className="text-[11px] text-emerald-100 list-decimal list-inside space-y-1">
                          {idResult.quickTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                        </ul>
                      </div>

                      {/* Save Button to persist the scan */}
                      <button
                        onClick={saveIdentifiedPlantToGarden}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ذخیره‌سازی این گیاه در صندوقچه من</span>
                      </button>

                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center py-20 space-y-3">
                      <div className="text-5xl text-white/20 animate-pulse">🏥</div>
                      <p className="text-sm font-semibold text-white/60">آماده دریافت تصویر برای تحلیل</p>
                      <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto">
                        بعد از فشردن دکمه، هوش مصنوعی Gemini 3.5 گیاه را بررسی زراعی می‌کند و نتایج بیماری و پارامترها در این بخش ظاهر می‌شوند.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 3. TAB: CROP PLAN */}
          {activeTab === "cropplan" && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
              
              <div className="pb-4 border-b border-white/15">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>طرح کشت جامع کشاورز از بذر تا برداشت (Seed-to-Harvest Roadmap)</span>
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  مشخصات گیاه زراعی یا آپارتمانی خود را وارد کنید تا هوش مصنوعی یک جدول زمانی چند مرحله‌ای با تمرکز بر مراقبت، کوددهی و هرس تولید کند.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form column */}
                <div className="col-span-1 space-y-4">
                  <div className="bg-black/40 rounded-3xl p-5 border border-white/10 space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold">پارامترهای بذر و خاک</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">نام محصول یا گیاه (مثال: گوجه فرنگی، زعفران):</label>
                      <input
                        type="text"
                        value={cropInput.plantName}
                        onChange={(e) => setCropInput({ ...cropInput, plantName: e.target.value })}
                        placeholder="مثلا: گوجه فرنگی گیلاسی"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">سطح تجربه کشت کاربری:</label>
                      <select
                        value={cropInput.experienceLevel}
                        onChange={(e) => setCropInput({ ...cropInput, experienceLevel: e.target.value })}
                        className="w-full bg-[#0d150d] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="مبتدی (خانه دار)">مبتدی (خانه‌دار)</option>
                        <option value="متوسط (باغبان آماتور)">متوسط (باغبان آماتور)</option>
                        <option value="حرفه‌ای (کشاورز تجاری)">حرفه‌ای (کشاورز تجاری)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">بستر کاشت:</label>
                      <select
                        value={cropInput.plantingMethod}
                        onChange={(e) => setCropInput({ ...cropInput, plantingMethod: e.target.value })}
                        className="w-full bg-[#0d150d] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="گلدان خانگی">گلدان خانگی</option>
                        <option value="باغچه سفت کاری">باغچه سفت‌کاری</option>
                        <option value="گلخانه صنعتی">گلخانه هیدروپونیک صنعتی</option>
                        <option value="زمین زراعی فضای باز">زمین زراعی فضای باز</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">سامانه آبیاری:</label>
                      <input
                        type="text"
                        value={cropInput.irrigationType}
                        onChange={(e) => setCropInput({ ...cropInput, irrigationType: e.target.value })}
                        placeholder="مثلا: قطره‌ای سنتی"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">نوع خاک یا بستر رشد:</label>
                      <input
                        type="text"
                        value={cropInput.soilType}
                        onChange={(e) => setCropInput({ ...cropInput, soilType: e.target.value })}
                        placeholder="مثلا: لومی رسی پر باران"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/70">اقلیم منطقه زراعی:</label>
                      <input
                        type="text"
                        value={cropInput.locationClimate}
                        onChange={(e) => setCropInput({ ...cropInput, locationClimate: e.target.value })}
                        placeholder="مثلا: معتدل کوهستانی یا گرم و خشک دشت"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={generateNewPlan}
                      disabled={loading || !cropInput.plantName}
                      className="w-full bg-gradient-to-tr from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>تدوین طرح زراعی اختصاصی</span>
                    </button>
                  </div>
                </div>

                {/* Display plan columns (Col span 2) */}
                <div className="lg:col-span-2 space-y-4">
                  {generatedCropPlan ? (
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6">
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            اقلیم {cropInput.locationClimate} • دوره کشت
                          </span>
                          <h4 className="text-2xl font-black text-white mt-1.5 font-sans">طرح جامع زراعی: {generatedCropPlan.cropTitle}</h4>
                        </div>
                        <div className="bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 text-center">
                          <span className="text-[9px] text-white/50 block font-bold">کل دوره تخمینی</span>
                          <span className="text-lg font-mono font-black text-emerald-400">{generatedCropPlan.estimatedDurationWeeks} هفته</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed bg-black/20 p-3.5 rounded-2xl text-justify">
                        <strong>برآورد کلی کارشناس:</strong> {generatedCropPlan.generalAdvice}
                      </p>

                      {/* Display stages sequentially */}
                      <div className="space-y-4">
                        <h5 className="font-bold text-sm text-emerald-300 flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>ترتیب مراحل رشد کاشت تا برداشت زراعی:</span>
                        </h5>

                        <div className="space-y-3 relative before:absolute before:right-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
                          {generatedCropPlan.stages.map((stage) => (
                            <div key={stage.stageId} className="relative pr-12">
                              <span className="absolute right-3 top-1 w-6.5 h-6.5 rounded-full bg-emerald-500 text-black font-mono font-bold flex items-center justify-center text-xs shadow-lg shadow-emerald-400/30">
                                {stage.stageId}
                              </span>

                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 text-right">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                                  <h6 className="font-bold text-sm text-white">{stage.title}</h6>
                                  <div className="flex gap-2 text-[10px]">
                                    <span className="bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-md font-bold">
                                      طول دوره: {stage.durationWeeks} هفته
                                    </span>
                                    <span className="bg-white/10 text-white/70 px-2.5 py-0.5 rounded-md font-bold">
                                      دمای مطلوب: {stage.temperatureIdeal}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                  <div className="space-y-1">
                                    <strong className="text-[10px] text-emerald-300 block">🧹 وظایف کشاورز در این مرحله:</strong>
                                    <ul className="text-[10px] text-white/75 space-y-1 list-disc list-inside">
                                      {stage.tasks.map((task, idx) => <li key={idx}>{task}</li>)}
                                    </ul>
                                  </div>
                                  <div className="space-y-1 border-t md:border-t-0 md:border-r border-white/10 md:pr-3">
                                    <strong className="text-[10px] text-red-300 block">⚠️ علائم هشدار دهنده شیوع بیماری برگ:</strong>
                                    <ul className="text-[10px] text-white/70 space-y-1 list-disc list-inside">
                                      {stage.warningSigns.map((warn, idx) => <li key={idx}>{warn}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fert timeline & pest integration tips */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                        <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-2 text-right">
                          <strong className="text-emerald-300 block">🧪 فرمول غذادهی و عیارسنجی خاک:</strong>
                          <ul className="list-decimal list-inside text-[11px] text-white/80 space-y-1">
                            {generatedCropPlan.fertilizerTimeline.map((item, idx) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2 text-right">
                          <strong className="text-emerald-300 block">🐛 روش‌های کنترل غیرشیمیایی آفات:</strong>
                          <ul className="list-decimal list-inside text-[11px] text-white/80 space-y-1">
                            {generatedCropPlan.pestControlTips.map((item, idx) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center py-24 space-y-3">
                      <div className="text-5xl text-white/20">🌾</div>
                      <p className="text-sm font-semibold text-white/60">پروژه زراعی فعلی وجود ندارد</p>
                      <p className="text-xs text-white/40 max-w-sm mx-auto">
                        پارامترهای بذر و خاک گلدان خود را وارد کنید و دکمه را فشار دهید. هوش مصنوعی نقشه راه زراعی شما را کاملا شخصی‌سازی شده خواهد ساخت.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 4. TAB: REMINDERS */}
          {activeTab === "reminders" && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/15">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    <span>تقویم مراقبتی و هشدار مکرر نگهداری گیاه</span>
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    ثبت نوبت‌های منظم آبیاری، غبارپاشی و کوددهی برای جلوگیری از پوسیدگی سیستماتیک ریشه. تیک اتمام یادآور به روز رسانی چرخه را لحاظ می‌کند.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to submit reminder */}
                <div className="col-span-1">
                  <form onSubmit={handleAddNewReminder} className="bg-black/40 rounded-3xl p-5 border border-white/10 space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold">کارت ثبت یادآور مکرر</h4>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/70 block">برای کدام گیاه؟</label>
                      <select
                        value={newNotif.plantName}
                        onChange={(e) => setNewNotif({ ...newNotif, plantName: e.target.value })}
                        className="w-full bg-[#0c130c] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="">انتخاب گیاه...</option>
                        {savedPlants.map((p) => <option key={p.id} value={p.nameFarsi}>{p.nameFarsi}</option>)}
                        <option value="کل باغچه">کل گیاه باغچه</option>
                        <option value="بذر گوجه کشت اول">بذر گوجه کشت اول</option>
                        <option value="پتوس ابلق">پتوس ابلق</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/70 block">نوع مراقبت فیزیکی:</label>
                      <select
                        value={newNotif.type}
                        onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value as CareNotification["type"] })}
                        className="w-full bg-[#0c130c] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="آبیاری">💧 آبیاری عمیق خاک</option>
                        <option value="کوددهی">🧪 کوددهی محلول خاک</option>
                        <option value="غبارپاشی">💨 غبارپاشی برگی</option>
                        <option value="برداشت/هرس">✂️ برداشت یا هرس برگ زرد</option>
                        <option value="سایر">🪴 تمیزکاری غبار برگ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/70 block">تکرار دوره‌ای (یک بار در هر چند روز؟):</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={newNotif.frequencyDays}
                        onChange={(e) => setNewNotif({ ...newNotif, frequencyDays: parseInt(e.target.value) || 3 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/70 block">ساعت زنگ هشدار:</label>
                      <input
                        type="time"
                        value={newNotif.timeString}
                        onChange={(e) => setNewNotif({ ...newNotif, timeString: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Bell className="w-4 h-4" />
                      <span>ثبت و شروع چرخه هوشمند</span>
                    </button>
                  </form>
                </div>

                {/* Display active reminders list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-3">
                    <h4 className="font-bold text-sm text-emerald-100 pb-2 border-b border-white/10 flex items-center gap-2">
                      <span>لیست چرخه‌های پایش فعال</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">سیستم بدون خطا</span>
                    </h4>

                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-white/30 space-y-3">
                        <div className="text-4xl">🧘</div>
                        <p className="text-xs">هیچ یادآور فعالی ثبت نگردیده است.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-right ${
                              notif.completed
                                ? "bg-white/5 border-white/5 opacity-55"
                                : "bg-gradient-to-l from-emerald-950/20 to-white/5 border-white/10 hover:border-emerald-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleReminderComplete(notif)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                                  notif.completed
                                    ? "bg-emerald-500 border-emerald-400 text-black"
                                    : "border-white/30 hover:border-emerald-400 text-transparent"
                                }`}
                              >
                                ✓
                              </button>

                              <div className="space-y-0.5">
                                <p className={`text-sm font-semibold ${notif.completed ? "line-through text-white/40" : "text-white"}`}>
                                  چرخه {notif.type} برای گیاه: <span className="text-emerald-300 font-extrabold">{notif.plantName}</span>
                                </p>
                                <p className="text-[10px] text-white/40">
                                  هر {notif.frequencyDays} روز یک‌بار، ساعت {notif.timeString} 
                                  {notif.lastDoneDate && ` • آخرین انجام شده در: ${notif.lastDoneDate}`}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteReminder(notif.id)}
                              className="text-white/30 hover:text-red-400 p-2 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 5. TAB: ADVISOR CHAT */}
          {activeTab === "advisor" && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col h-[600px] shadow-2xl overflow-hidden">
              <div className="pb-3 border-b border-white/15 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl">👨‍🌾</div>
                  <div>
                    <h4 className="font-bold text-sm text-white">چت مربی باغبانی هوش مصنوعی (رویش‌بان)</h4>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> آنلاین و آماده پردازش
                    </p>
                  </div>
                </div>
              </div>

              {/* Message screen */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 my-4 bg-black/30 rounded-2xl pr-2 border border-white/5">
                {advisorChat.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-start" : "justify-end"} items-start gap-2.5`}
                  >
                    {message.role === "model" && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-400/20 text-xs flex items-center justify-center">
                        🌿
                      </div>
                    )}

                    <div
                      className={`p-3 max-w-lg rounded-2xl text-xs leading-relaxed space-y-2 ${
                        message.role === "user"
                          ? "bg-emerald-900/30 text-emerald-100 border border-emerald-500/20 rounded-tr-none text-right"
                          : "bg-white/10 text-white border border-white/5 rounded-tl-none text-right"
                      }`}
                    >
                      {message.image && (
                        <img src={message.image} alt="Chat attachment" className="w-32 rounded-lg border border-white/10 mb-2 object-cover max-h-32" />
                      )}
                      <p className="whitespace-pre-line text-justify">{message.text}</p>
                      <span className="text-[9px] text-white/30 block text-left font-mono">{message.timestamp}</span>
                    </div>

                    {message.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">
                        من
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat controllers */}
              <div className="space-y-2">
                {chatImage && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 w-max text-xs text-white">
                    <span className="text-emerald-400">📎 تصویر ضمیمه شد:</span>
                    <button onClick={() => setChatImage(null)} className="text-red-400 font-bold hover:underline">حذف</button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => handleImageUpload(e as any, "chat");
                      input.click();
                    }}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title="الصاق عکس گیاه شیوع لکه‌دار"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="سوال زراعی، نحوه کوددهی یا عارضه‌تراشی خود را از من بپرسید..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500 text-right"
                  />

                  <button
                    onClick={sendChatMessage}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black p-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 6. TAB: PERSONALIZE & BOT SETTINGS */}
          {activeTab === "personalize" && (
            <div className="space-y-6">
              
              {/* Top Premium Welcome Header */}
              <div className="bg-gradient-to-l from-emerald-500/15 via-emerald-500/5 to-transparent backdrop-blur-md rounded-3xl p-6 border border-emerald-500/20 text-right relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-500 text-black px-2.5 py-0.5 rounded-full font-extrabold uppercase select-none">اتصال پیشرفته ربات تلگرام</span>
                    <h3 className="text-xl font-bold text-emerald-200 mt-2">شخصی‌سازی هوشمند و پایگاه راه‌اندازی ربات مزارع</h3>
                    <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                      با همگام‌سازی توکن با سرور و کپی کردن قطعه کد اجرایی زیر، ربات شخصی تلگرام خودتان را مجهز به پردازش زنده گیاه‌پزشک هوشمند با مدل پیشرفته Gemini نمایید.
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <span>سرویس دروازه وب‌هوک فعال است</span>
                  </div>
                </div>
              </div>

              {/* Grid Section: Configuration Form vs Dynamic Code View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-right">
                
                {/* Left Column: Config Panel Form (Grid span 5) */}
                <div className="lg:col-span-5 bg-black/45 rounded-3xl p-6 border border-white/10 space-y-5 flex flex-col justify-between shadow-xl">
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <Sliders className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-extrabold text-sm text-white">پیکربندی هویت ربات مزارع</h4>
                        <p className="text-[10px] text-white/40">تنظیم مستقیم اطلاعات بر روی هسته سرور مرکزی</p>
                      </div>
                    </div>

                    {/* Token with show/hide or info */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-white/80 font-bold">توکن اختصاصی ربات تلگرام (Bot Token):</label>
                        <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                          <span>دریافت از BotFather@</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="text"
                        value={tgToken}
                        placeholder="729402518:AAFlw9C_SampleToken"
                        onChange={(e) => setTgToken(e.target.value)}
                        className="w-full bg-[#101910] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono tracking-wider transition-all"
                      />
                    </div>

                    {/* Webhook Endpoint with AutoFill Host helper */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-white/80 font-bold">آدرس هوست و وب‌هوک رندر (Webhook Callback):</label>
                        <button
                          onClick={() => {
                            setWebhookUrl(`${window.location.origin}/api/telegram`);
                            showToast("آدرس وب‌هوک با آدرس دامنه فعلی سایت جایگزین شد!", "info");
                          }}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-bold py-0.5 px-2 rounded-lg text-[10px] cursor-pointer transition-all"
                        >
                          دریافت خودکار دامنه فعلی
                        </button>
                      </div>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-[#101910] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-left transition-all"
                      />
                    </div>

                    {/* Welcome message text-area */}
                    <div className="space-y-1.5">
                      <label className="text-white/80 font-bold block">پیام خوش‌آمدگویی پیش‌فرض (/start):</label>
                      <textarea
                        value={customWelcomeMsg}
                        onChange={(e) => setCustomWelcomeMsg(e.target.value)}
                        rows={3}
                        className="w-full bg-[#101910] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed transition-all"
                        placeholder="پیامی که زمان وارد شدن کاربر ارسال می‌شود..."
                      />
                    </div>
                  </div>

                  {/* PROMINENT SUBMIT / SAVE ACTION BUTTON */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <button
                      onClick={saveTelegramConfig}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/20"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>در حال ذخیره و پردازش در هسته وب‌سایت...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>ذخیره نهایی و ثبت پیکربندی در پنل</span>
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-white/50 leading-relaxed text-justify">
                      💡 <strong>نکته مهم:</strong> دکمه بالا تنظیمات را برای همیشه در پایگاه داده وب اپلیکیشن ذخیره نگه می‌دارد تا در صورت بازدید مجدد به هیچ وجه پیکربندی را از دست ندهید.
                    </p>
                  </div>
                </div>

                {/* Right Column: Code Editor & Exporter (Grid span 7) */}
                <div className="lg:col-span-7 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4 flex flex-col justify-between shadow-xl">
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">سورس تلگرام نهایی و اختصاصی</h4>
                          <p className="text-[10px] text-white/40">آماده قرارگیری در پروژه گیت‌هاب جهت انتقال به خدمات ابری</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full select-none">bot.js</span>
                    </div>

                    <p className="text-[11px] text-white/60 leading-relaxed text-justify">
                      این سورس کد به کمک متغیرهای بالا بازسازی شده است. آن را بردارید و در فایل <code className="bg-white/15 px-1 py-0.2 rounded font-mono text-emerald-300">bot.js</code> پروژه گیت‌هاب قرار دهید تا ترافیک تصاویر ارسالی را به این وب اپ متصل مجهز به Gemini بازپس‌گرداند:
                    </p>

                    {/* IDE Visual Dark Container */}
                    <div className="relative bg-[#070b07] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      
                      {/* Console Top Indicator bar */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-black/50 border-b border-white/5">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-[10px] text-white/50 font-mono select-none">VS Code Engine - bot.js</span>
                      </div>

                      {/* Code pre box */}
                      <div className="p-4 overflow-x-auto max-h-76 font-mono text-[10px] text-emerald-200/90 scrollbar text-left leading-relaxed">
                        <pre className="whitespace-pre">{`const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '${tgToken}';
const bot = new TelegramBot(token, { polling: true });

console.log('PlantCare Bot is starting Telegram listener...');

// Start command custom greeting
bot.onText(/\\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, \`${customWelcomeMsg}\`);
});

// Photo identifier listener to send base64 payloads to Express server
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "در حال بارگیری تصویر گیاه شما و ارسال به سرور کلینیک رویش‌بان... 🔄");

  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    const fileLink = await bot.getFileLink(fileId);

    // Fetch photo stream
    const imageResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const buffer64 = Buffer.from(imageResponse.data).toString('base64');
    
    // Call server identification route securely
    const response = await axios.post('${webhookUrl.replace('/api/telegram', '')}/api/identify', {
      image: \`data:image/jpeg;base64,\${buffer64}\`,
      mode: 'both'
    });

    const plant = response.data;
    const report = \`🌱 نام فارسی: \${plant.nameFarsi}
🧬 نام علمی: \${plant.scientificName}
  
📝 توضیحات:
\${plant.description}

💧 آبیاری: \${plant.careInfo.watering}
☀️ نوردهی: \${plant.careInfo.sunlight}
🐾 سمیت: \${plant.careInfo.toxicity}

🏥 تشخیص کلینیکال: \${plant.healthStatus.diagnoses}
💡 نسخه درمانی: \${plant.healthStatus.treatment}
\`;

    bot.sendMessage(chatId, report);
  } catch (error) {
    console.error("Bot Error:", error);
    bot.sendMessage(chatId, "⚠️ خطا در تحلیل اسکن. لطفاً مطمئن شوید که متغیرهای پیکربندی در وب‌هوک به درستی ذخیره شده باشند.");
  }
});`}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Action row at bottom of Code block */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        const codeString = `// Telegram Bot Code Interface for GitHub & Render (bot.js)
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '${tgToken}';
const bot = new TelegramBot(token, { polling: true });

console.log('PlantCare Bot is starting Telegram listener...');

// Start prompt
bot.onText(/\\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, \`${customWelcomeMsg}\`);
});

// Photo identifier listener
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "در حال بارگیری تصویر گیاه شما و ارسال به سرور کلینیک رویش‌بان... 🔄");

  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    const fileLink = await bot.getFileLink(fileId);

    // Fetch photo stream
    const imageResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const buffer64 = Buffer.from(imageResponse.data).toString('base64');
    
    // Call analysis endpoint
    const response = await axios.post('${webhookUrl.replace('/api/telegram', '')}/api/identify', {
      image: \`data:image/jpeg;base64,\${buffer64}\`,
      mode: 'both'
    });

    const plant = response.data;
    const report = \`🌱 نام فارسی: \${plant.nameFarsi}
🧬 نام علمی: \${plant.scientificName}
  
📝 توضیحات:
\${plant.description}

💧 شرایط آبیاری: \${plant.careInfo.watering}
☀️ نوردهی: \${plant.careInfo.sunlight}
🐾 سمیت: \${plant.careInfo.toxicity}

🏥 تشخیص کلینیکال: \${plant.healthStatus.diagnoses}
💡 نسخه درمانی: \${plant.healthStatus.treatment}
\`;

    bot.sendMessage(chatId, report);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "⚠️ پوزش، اسکن گیاه با خطا مواجه شد. از صحت آدرس دامنه و اتصال اینترنت اطمینان حاصل کنید.");
  }
});`;
                        navigator.clipboard.writeText(codeString);
                        showToast("کد کامل و اختصاصی با موفقیت به حافظه موقت کپی شد! 📋", "success");
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>کپی کامل کدهای آماده ( bot.js )</span>
                    </button>
                    <a
                      href="https://render.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#152015] hover:bg-[#1f301f] border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>ورود به پرتال رندر (Render)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  </div>
                </div>

              </div>

              {/* Step By Step Guide Timeline below */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
                <h4 className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                  <span>🗺️ نقشه راه و راهنمای دیپلوی فوق سریع در ۳ مرحله</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                  
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2 relative overflow-hidden">
                    <span className="absolute top-2 left-3 text-4xl text-white/5 font-black font-mono">01</span>
                    <strong className="text-emerald-400 text-xs font-bold block">مرحله ۱: ایجاد ربات و دریافت توکن</strong>
                    <p className="text-[11px] text-white/60 leading-relaxed text-justify">
                      وارد اکانت تلگرام شوید و ربات <code className="bg-black text-emerald-300 p-0.5 rounded px-1 font-mono">@BotFather</code> را استارت کنید. فرمان <code className="bg-black text-emerald-300 p-0.5 rounded px-1 font-mono">/newbot</code> را بفرستید، نام مناسب را انتخاب کنید و توکن ارائه‌شده را در فیلد تنظیمات بالا وارد کنید.
                    </p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2 relative overflow-hidden">
                    <span className="absolute top-2 left-3 text-4xl text-white/5 font-black font-mono">02</span>
                    <strong className="text-emerald-400 text-xs font-bold block">مرحله ۲: ست کردن متغیر محیطی در رندر</strong>
                    <p className="text-[11px] text-white/60 leading-relaxed text-justify">
                      در پنل کاربری هاست رندر (Render) مربوط به وب اپلیکیشن خود، وارد تب <code className="bg-black text-white p-0.5 rounded px-1 font-mono font-bold">Environment</code> شده و مقدار متغیر جدید <code className="bg-black text-emerald-300 p-0.5 rounded px-1 font-mono">GEMINI_API_KEY</code> را وارد نمایید. بر روی دکمه آبی رنگ **Save changes** در زیر ردیف‌های متغیرها کلیک کنید تا تنظیمات اعمال شوند.
                    </p>
                  </div>

                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2 relative overflow-hidden">
                    <span className="absolute top-2 left-3 text-4xl text-white/5 font-black font-mono">03</span>
                    <strong className="text-emerald-400 text-xs font-bold block">مرحله ۳: آپلود فایل bot.js به گیت‌هاب</strong>
                    <p className="text-[11px] text-white/60 leading-relaxed text-justify">
                      کدهای تلگرامی اختصاصی را با زدن دکمه برگ زرین **کپی کامل کدهای آماده** بالا کپی کنید. فایل <code className="bg-black text-emerald-300 p-0.5 rounded px-1 font-mono">bot.js</code> را در روت کدهای پروژه گیت‌هاب قرار دهید و دک مانیتورینگ Render را دوباره ران کنید تا مربی رباتیک به سادگی متصل و آنلاین شود.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === "premium" && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/5 to-transparent backdrop-blur-md rounded-3xl p-6 border border-amber-500/20 text-right relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-44 h-44 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-extrabold uppercase select-none">طرح زارع ویژه</span>
                    <h3 className="text-xl font-bold text-amber-200 mt-2">مدل فریمیوم (رایگان به همراه آپگرید اختیاری ویژه)</h3>
                    <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                      جهت بهره‌مندی حداکثری کشاورزان و باغداران، امکانات پایه به صورت کاملاً رایگان عرضه می‌شوند تا بتوانید ظرفیت پاسخ‌ها را پیش‌نمایش کنید. در صورت رضایت، با یک کلیک ارتقا دهید.
                    </p>
                  </div>
                  {subscriptionObj.tier === "premium" ? (
                    <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>حساب ویژه شما فعال است 👑</span>
                    </div>
                  ) : (
                    <button
                      onClick={upgradeToPremium}
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/30"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>ارتقای آنی به کشاورز برتر (رایگان جهت تست)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 1: Progress counters for Free Account */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-6">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2 pb-2 border-b border-white/10">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>آمار مصرف فعلی شما (حدود و استفاده کاربری)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scan progress */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">اسکن عارضه‌یاب و معرفی گیاه</span>
                      <span className="font-semibold text-white">
                        {subscriptionObj.tier === "premium" ? "نامحدود (کاربر ویژه)" : `${subscriptionObj.scansCount} از ${subscriptionObj.scansLimit}`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      {subscriptionObj.tier === "premium" ? (
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full w-full rounded-full transition-all" />
                      ) : (
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (subscriptionObj.scansCount / subscriptionObj.scansLimit) * 100)}%` }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">سهمیه رایگان برای این دستگاه: ۳ اسکن</p>
                  </div>

                  {/* Plan progress */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">تولید طرح کشت باغبانی و زراعی</span>
                      <span className="font-semibold text-white">
                        {subscriptionObj.tier === "premium" ? "نامحدود (کاربر ویژه)" : `${subscriptionObj.plansCount} از ${subscriptionObj.plansLimit}`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      {subscriptionObj.tier === "premium" ? (
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full w-full rounded-full transition-all" />
                      ) : (
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (subscriptionObj.plansCount / subscriptionObj.plansLimit) * 100)}%` }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">طرح جامع زراعی تفصیلی: ۱ بار رایگان</p>
                  </div>

                  {/* Chat progress */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">پاسخ‌ها و گفتگو با مشاور صمیمی</span>
                      <span className="font-semibold text-white">
                        {subscriptionObj.tier === "premium" ? "نامحدود (کاربر ویژه)" : `${subscriptionObj.chatsCount} از ${subscriptionObj.chatsLimit}`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      {subscriptionObj.tier === "premium" ? (
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full w-full rounded-full transition-all" />
                      ) : (
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (subscriptionObj.chatsCount / subscriptionObj.chatsLimit) * 100)}%` }}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">مشاوره مداخله‌ای با رویش‌بان: ۵ پیام</p>
                  </div>
                </div>

                {/* Simulated Reset for Demo / Sandbox review */}
                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <span className="text-xs text-white/50">
                    💡 جهت تست راحت و چندباره سقف استفاده و کارکرد خطاها، دکمه بازنشانی را بفشارید:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={resetSubscriptionUsage}
                      className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تنزیل به رایگان و بازنشانی تعداد کارکرد</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 2: Pricing Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {/* Free Tier Details */}
                <div className={subscriptionObj.tier === "free" ? "bg-white/5 border-2 border-emerald-500/50 rounded-3xl p-6 space-y-4 relative overflow-hidden text-right" : "bg-white/5 rounded-3xl p-6 space-y-4 opacity-55 border border-white/10 text-right"}>
                  {subscriptionObj.tier === "free" && (
                    <span className="absolute left-4 top-4 bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">طرح فعال شما</span>
                  )}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-sm text-white">طرح آزمایشی گلخانه‌ای (رایگان)</h5>
                    <p className="text-xs text-white/50">شروع یادگیری باغبانی و کشاورزی پایه</p>
                  </div>
                  <div className="text-2xl font-black text-emerald-300 font-mono">۰ <span className="text-xs font-semibold text-white/50">تومان</span></div>

                  <hr className="border-white/10" />

                  <ul className="text-xs space-y-2.5 text-white/70">
                    <li className="flex items-center gap-2 justify-start direction-rtl">🟢 <span className="mr-1">۳ اسکن تصویر با تشخیص هوشمند بیماری</span></li>
                    <li className="flex items-center gap-2 justify-start direction-rtl">🟢 <span className="mr-1">۱ عدد طرح‌ جامع کشت تفصیلی دائم</span></li>
                    <li className="flex items-center gap-2 justify-start direction-rtl">🟢 <span className="mr-1">۵ پیام چت با مشاور رباتیک رویش‌بان</span></li>
                    <li className="flex items-center gap-2 justify-start direction-rtl text-white/30">🔴 <span className="mr-1">اتصال مستقیم وب‌هوک به تلگرام اختصاصی شما</span></li>
                    <li className="flex items-center gap-2 justify-start direction-rtl text-white/30">🔴 <span className="mr-1">سرعت تحلیل با اولویت فوق‌سریع</span></li>
                  </ul>
                </div>

                {/* VIP Premium Tier Details */}
                <div className={subscriptionObj.tier === "premium" ? "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-2 border-amber-500 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-xl text-right" : "bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-sm text-right"}>
                  {subscriptionObj.tier === "premium" && (
                    <span className="absolute left-4 top-4 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">طرح فعال شده ویژه (VIP)</span>
                  )}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-sm text-amber-200">طرح کشاورز پیشرو (نامحدود ویژه)</h5>
                    <p className="text-xs text-amber-300/60">برای مزارع صنعتی، پزشکان گیاهی و گلخانه‌داران</p>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">٪۱۰۰ رایگان <span className="text-xs text-white/50 line-through">۳۸۰,۰۰۰ تومان</span></div>

                  <hr className="border-amber-500/10" />

                  <ul className="text-xs space-y-2.5 text-amber-100/80">
                    <li className="flex items-center gap-2 justify-start">👑 <span className="mr-1">شناسایی و تشخیص بی‌نهایت بیماری و آفت</span></li>
                    <li className="flex items-center gap-2 justify-start">👑 <span className="mr-1">تولید نامحدود طرح جامع کشت تا برداشت عمیق</span></li>
                    <li className="flex items-center gap-2 justify-start">👑 <span className="mr-1">گفتگوی نامحدود صوتی و متنی مربی رویش‌بان</span></li>
                    <li className="flex items-center gap-2 justify-start">👑 <span className="mr-1">فعال‌سازی سورس اتصال بات شخصی تلگرام مزارع</span></li>
                    <li className="flex items-center gap-2 justify-start">👑 <span className="mr-1">بارگذاری فوق سریع و لود فوری نسخه نهایی درمان</span></li>
                  </ul>

                  {subscriptionObj.tier !== "premium" && (
                    <button
                      onClick={upgradeToPremium}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20"
                    >
                      <span>تایید و ارتقای حساب کاربری مزارع ویژه</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: ADD MANUAL PLANT POPUP */}
      {isAddPlantModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b120b] border border-white/15 rounded-[2.5rem] w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-right">
            <button
              onClick={() => setIsAddPlantModalOpen(false)}
              className="absolute left-6 top-6 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-md font-bold text-emerald-300 flex items-center gap-2 pb-2 border-b border-white/10">
              <Leaf className="w-5 h-5" />
              <span>ثبت گیاه جدید در شناسنامه رشد باغچه</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs overflow-y-auto max-h-96 pr-2 text-right">
              <div className="space-y-1 col-span-2">
                <label className="text-white/60 block font-bold">نام فارسی گیاه:</label>
                <input
                  type="text"
                  value={newManualPlant.nameFarsi}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, nameFarsi: e.target.value })}
                  placeholder="مثال: حسن یوسف ابلق"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/60 block font-bold text-right">نام انگلیسی:</label>
                <input
                  type="text"
                  value={newManualPlant.nameEnglish}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, nameEnglish: e.target.value })}
                  placeholder="Solenostemon"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-left"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/60 block font-bold text-right">نام علمی گیاه‌شناسی:</label>
                <input
                  type="text"
                  value={newManualPlant.scientificName}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, scientificName: e.target.value })}
                  placeholder="Coleus scutellarioides"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-left"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-white/60 block font-bold">توضیحات کلی خلاصه شده:</label>
                <textarea
                  value={newManualPlant.description}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, description: e.target.value })}
                  rows={2}
                  placeholder="توضیح تستی..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/60 block font-bold">آبیاری مکرر:</label>
                <input
                  type="text"
                  value={newManualPlant.watering}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, watering: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/60 block font-bold">میزان نور خورشید:</label>
                <input
                  type="text"
                  value={newManualPlant.sunlight}
                  onChange={(e) => setNewManualPlant({ ...newManualPlant, sunlight: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none text-right"
                />
              </div>
            </div>

            <button
              onClick={saveManualPlant}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت نهایی در صندوقچه</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD GROWTH PROGRESS LOG TIMELINE COMMENT */}
      {activeLogPlantId && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b120b] border border-white/15 rounded-[2.5rem] w-full max-w-md p-6 space-y-4 shadow-2xl relative text-right">
            <button
              onClick={() => setActiveLogPlantId(null)}
              className="absolute left-6 top-6 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-md font-bold text-emerald-300 flex items-center gap-2 pb-2 border-b border-white/10">
              <History className="w-5 h-5" />
              <span>القاء یادداشت به تاریخچه رشد گیاه</span>
            </h3>

            <div className="space-y-3 text-xs text-right">
              <div className="space-y-1">
                <label className="text-white/60 block font-bold">وضعیت سلامت کنونی گیاه در باغچه:</label>
                <select
                  value={newLogStatus}
                  onChange={(e) => setNewLogStatus(e.target.value as PlantLog["status"])}
                  className="w-full bg-[#0d140d] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="عالی">عالی (برگ‌های سرحال و شاداب)</option>
                  <option value="کمی بی‌حال">کمی بی‌حال (خاک نیمه کاره)</option>
                  <option value="بیمار">بیمار (دارای آفت سفید یا شته)</option>
                  <option value="نیاز به توجه">نیاز به توجه مکرر</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/60 block font-bold">یادداشت باغبانی شما:</label>
                <textarea
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  rows={4}
                  placeholder="مثلا: برگ‌های جدید شروع به رویش کرده‌اند اما رنگ سبز روشن غلظت لازم را ندارد..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none leading-relaxed text-right"
                />
              </div>
            </div>

            <button
              onClick={addGrowthLog}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت یادداشت و پیوست به شناسنامه</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
