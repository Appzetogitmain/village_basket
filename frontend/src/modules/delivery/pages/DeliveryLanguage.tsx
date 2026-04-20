import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { updateSettings } from "../../../services/api/delivery/deliveryService";

const languageOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "en-IN", label: "English (India)" },
];

const VALID_LANGUAGES = languageOptions.map((opt) => opt.value);

export default function DeliveryLanguage() {
  const navigate = useNavigate();
  const storedLanguage = localStorage.getItem("delivery_app_language") || "en-US";
  const normalizedStoredLanguage = VALID_LANGUAGES.includes(storedLanguage) ? storedLanguage : "en-US";

  if (storedLanguage !== normalizedStoredLanguage) {
    localStorage.setItem("delivery_app_language", normalizedStoredLanguage);
  }

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    normalizedStoredLanguage
  );
  const [saving, setSaving] = useState(false);

  const handleSaveLanguage = async (language: string) => {
    setSelectedLanguage(language);
    localStorage.setItem("delivery_app_language", language);

    try {
      setSaving(true);
      await updateSettings({ appLanguage: language } as any);
    } catch (error) {
      // Backend may not store this yet; local fallback is enough for now.
      console.error("Failed to save app language on server:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0" />

      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="ml-2 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Preferences</span>
          <span className="font-black text-[12px] text-white tracking-wide mt-1">App Language</span>
        </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        <div className="village-card paper-texture organic-radius bg-white divide-y divide-stone-100 overflow-hidden shadow-sm border-none pr-2 pl-2">
          {languageOptions.map((option) => {
            const isSelected = selectedLanguage === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSaveLanguage(option.value)}
                className="w-full p-4 flex items-center justify-between group active:bg-stone-50 transition-colors"
              >
                <p className="text-village-umber text-[11px] font-black uppercase tracking-tight">
                  {option.label}
                </p>
                <span className={`text-xs font-black ${isSelected ? "text-[#8B3D28]" : "text-stone-300"}`}>
                  {isSelected ? "SELECTED" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {saving && (
          <p className="mt-4 text-[10px] font-bold text-[#8B3D28]/80 uppercase tracking-widest">
            Saving language preference...
          </p>
        )}
      </div>
    </div>
  );
}
