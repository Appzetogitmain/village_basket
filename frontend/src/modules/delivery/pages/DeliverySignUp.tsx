import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  register,
  sendOTP,
  verifyOTP,
} from "../../../services/api/auth/deliveryAuthService";
import { removeAuthToken } from "../../../services/api/config";
import { uploadDocument } from "../../../services/api/uploadService";
import { validateDocumentFile } from "../../../utils/imageUpload";
import OTPInput from "../../../components/OTPInput";
import villageBasketLogo from "@assets/village_basket-removebg-preview.png";
import VillageLoader from "../../../components/VillageLoader";

// Icons
const Icons = {
  ChevronLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Location: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
};

export default function DeliverySignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    dateOfBirth: "",
    address: "",
    city: "",
    pincode: "",
    drivingLicenseUrl: "",
    nationalIdentityCardUrl: "",
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bonusType: "",
  });

  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [nationalIdentityCardFile, setNationalIdentityCardFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [ifscError, setIfscError] = useState("");

  // Calculate 18 years ago from today for DOB restriction
  const today = new Date();
  const maxDobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split("T")[0];

  const bonusTypes = [
    "Select Bonus Type",
    "Fixed or Salaried",
    "Fixed",
    "Salaried",
    "Commission Based",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 10),
      }));
    } else if (name === "pincode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 6),
      }));
    } else if (name === "accountNumber") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, ""),
      }));
    } else if (name === "ifscCode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11),
      }));
    } else if (name === "name" || name === "city" || name === "accountName" || name === "bankName") {
      // Only allow letters and spaces
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/[^a-zA-Z\s]/g, ""),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError("Please enter a valid email. Eg., abc@gmail.com");
    } else {
      setEmailError("");
    }
  };

  const validateIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (ifsc && !ifscRegex.test(ifsc)) {
      setIfscError("Please enter a valid IFSC code. Eg., SBIN0001234");
    } else {
      setIfscError("");
    }
  };

  const fetchCityFromLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsCityLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.status === "OK") {
            const result = data.results[0];
            const addressComponents = result.address_components;
            const fullAddress = result.formatted_address;
            
            const cityComponent = addressComponents.find((c: any) =>
              c.types.includes("locality") || c.types.includes("administrative_area_level_2")
            );
            
            const pincodeComponent = addressComponents.find((c: any) =>
              c.types.includes("postal_code")
            );

            setFormData((prev) => ({ 
              ...prev, 
              city: cityComponent ? cityComponent.long_name : prev.city,
              pincode: pincodeComponent ? pincodeComponent.long_name : prev.pincode,
              address: fullAddress || prev.address
            }));
          } else {
            setError("Could not fetch city from your location");
          }
        } catch (err) {
          setError("Failed to fetch city details");
        } finally {
          setIsCityLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Please type your city manually.");
        setIsCityLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;

    const file = files[0];
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid document file");
      return;
    }

    if (name === "drivingLicense") {
      setDrivingLicenseFile(file);
    } else if (name === "nationalIdentityCard") {
      setNationalIdentityCardFile(file);
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile || !formData.email || !formData.address || !formData.city) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let drivingLicenseUrl = formData.drivingLicenseUrl;
      let nationalIdentityCardUrl = formData.nationalIdentityCardUrl;

      if (drivingLicenseFile || nationalIdentityCardFile) {
        setUploadingDocs(true);
        if (drivingLicenseFile) {
          const drivingLicenseResult = await uploadDocument(drivingLicenseFile, "villagebasket/delivery/documents");
          drivingLicenseUrl = drivingLicenseResult.secureUrl;
        }
        if (nationalIdentityCardFile) {
          const nationalIdResult = await uploadDocument(nationalIdentityCardFile, "villagebasket/delivery/documents");
          nationalIdentityCardUrl = nationalIdResult.secureUrl;
        }
        setUploadingDocs(false);
      }

      const response = await register({
        name: formData.name, mobile: formData.mobile, email: formData.email,
        dateOfBirth: formData.dateOfBirth || undefined, address: formData.address,
        city: formData.city, pincode: formData.pincode || undefined, drivingLicense: drivingLicenseUrl || undefined,
        nationalIdentityCard: nationalIdentityCardUrl || undefined, accountName: formData.accountName || undefined,
        bankName: formData.bankName || undefined, accountNumber: formData.accountNumber || undefined,
        ifscCode: formData.ifscCode || undefined, bonusType: formData.bonusType || undefined,
      });

      if (response.success) {
        removeAuthToken();
        setSuccessMessage(
          response.message ||
            "Registration successful. Your account is pending admin approval."
        );
        setShowOTP(false);
        setTimeout(() => navigate("/delivery/login"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await verifyOTP(formData.mobile, otp, sessionId);
      if (response.success) navigate("/delivery");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pb-12 font-poppins relative"
      style={{
        backgroundColor: 'var(--village-cream, #FAF7F2)',
        backgroundImage: `linear-gradient(rgba(250, 247, 242, 0.88), rgba(250, 247, 242, 0.88)), url('/assets/delivery_bg_pattern.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '320px',
        backgroundAttachment: 'fixed',
      }}
    >
      {loading && <VillageLoader />}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Hero Branding Header */}
      <div className="w-full bg-[#8B3D28] pt-16 pb-16 px-6 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90"
        >
          <Icons.ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 mb-6 -mt-4 drop-shadow-2xl">
            <img src={villageBasketLogo} alt="VB" className="w-full h-full object-contain filter brightness-0 invert opacity-40 translate-y-4" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-tighter uppercase leading-none mb-2 italic">JOIN THE FLEET</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Strategic Delivery Initiative</p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-lg px-6 -mt-8 relative z-20">
        <div className="village-card paper-texture organic-radius bg-white shadow-2xl border-none overflow-hidden">
          <div
            className="p-8 space-y-8 delivery-signup-form"
            style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <style>{`.delivery-signup-form::-webkit-scrollbar { display: none; }`}</style>

            {!showOTP ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-[1px] bg-[#8B3D28]/30"></div>
                    <h3 className="text-[#8B3D28] text-[10px] font-black uppercase tracking-[0.3em]">Identity Protocol</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Full Name</label>
                      <input
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        placeholder="AS PER OFFICIAL DOCUMENTS" required
                        className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                        disabled={loading}
                      />
                    </div>

                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Mobile No.</label>
                      <div className="flex bg-stone-50/50 rounded-2xl overflow-hidden ring-1 ring-stone-100/50 focus-within:ring-2 focus-within:ring-[#8B3D28]/20 transition-all">
                        <div className="px-4 flex items-center bg-stone-100/30 text-[10px] font-black text-village-umber/50 border-r border-stone-200/50">+91</div>
                        <input
                          type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange}
                          placeholder="00000-00000" required maxLength={10}
                          className="flex-1 px-5 py-4 bg-transparent border-none text-[11px] font-black tracking-widest focus:ring-0 placeholder:text-stone-300"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Email ID</label>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleInputChange}
                        onBlur={(e) => validateEmail(e.target.value)}
                        placeholder="AGENT@VILLAGEBASKET.IN" required
                        className={`w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300 ${emailError ? 'ring-1 ring-red-500/50' : ''}`}
                        disabled={loading}
                      />
                      {emailError && <p className="text-[8px] text-red-500 font-black mt-1.5 ml-1 tracking-widest">{emailError}</p>}
                    </div>

                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Date Of Birth</label>
                      <div className="relative">
                        <input
                          type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange}
                          max={maxDobDate}
                          className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all"
                          disabled={loading}
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300"><Icons.Calendar /></div>
                      </div>
                      <p className="text-[10px] text-red-500 font-medium mt-1.5 ml-1 leading-none">You must be above 18 years to register</p>
                    </div>
                  </div>
                </div>

                {/* Geography Information */}
                <div className="space-y-6 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-[1px] bg-[#8B3D28]/30"></div>
                    <h3 className="text-[#8B3D28] text-[10px] font-black uppercase tracking-[0.3em]">Operational Sector</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Current Address</label>
                      <div className="relative">
                        <input
                          type="text" name="address" value={formData.address} onChange={handleInputChange}
                          placeholder="STREET, BUILDING, LANDMARK" required
                          className="w-full pl-5 pr-12 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                          disabled={loading || isCityLoading}
                        />
                        <button
                          type="button" onClick={fetchCityFromLocation} disabled={isCityLoading || loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#8B3D28] hover:bg-stone-100/50 rounded-xl transition-all disabled:opacity-30"
                        >
                          {isCityLoading ? <div className="w-3 h-3 border-2 border-[#8B3D28] border-t-transparent rounded-full animate-spin"></div> : <Icons.Location />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">City</label>
                        <div className="relative">
                          <input
                            type="text" name="city" value={formData.city} onChange={handleInputChange}
                            placeholder="LOCATION" required
                            className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                            disabled={loading || isCityLoading}
                          />
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Postal Code</label>
                        <input
                          type="text" name="pincode" value={formData.pincode} onChange={handleInputChange}
                          placeholder="123456" maxLength={6}
                          className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Information — commented out, can be enabled later */}
                {/* <div className="space-y-6 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-[1px] bg-[#8B3D28]/30"></div>
                    <h3 className="text-[#8B3D28] text-[10px] font-black uppercase tracking-[0.3em]">Financial Ledger <span className="opacity-40 normal-case font-bold">(Optional)</span></h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Account Holder <span className="opacity-60 normal-case">(optional)</span></label>
                      <input
                        type="text" name="accountName" value={formData.accountName} onChange={handleInputChange}
                        placeholder="NAME ON ACCOUNT"
                        className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                        disabled={loading}
                      />
                    </div>
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Bank Name <span className="opacity-60 normal-case">(optional)</span></label>
                      <input
                        type="text" name="bankName" value={formData.bankName} onChange={handleInputChange}
                        placeholder="INSTITUTION NAME"
                        className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                        disabled={loading}
                      />
                    </div>
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">Account Number <span className="opacity-60 normal-case">(optional)</span></label>
                      <input
                        type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange}
                        placeholder="ACCOUNT NUMBER"
                        className="w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300"
                        disabled={loading}
                      />
                    </div>
                    <div className="relative group">
                      <label className="text-village-umber text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 block opacity-60">IFSC Code <span className="opacity-60 normal-case">(optional)</span></label>
                      <input
                        type="text" name="ifscCode" value={formData.ifscCode}
                        onChange={handleInputChange}
                        onBlur={(e) => { if (e.target.value) validateIFSC(e.target.value); else setIfscError(""); }}
                        placeholder="EG., SBIN0001234"
                        className={`w-full px-5 py-4 bg-stone-50/50 border-none rounded-2xl text-[11px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder:text-stone-300 ${ifscError ? 'ring-1 ring-red-500/50' : ''}`}
                        disabled={loading}
                      />
                      {ifscError && <p className="text-[10px] text-red-500 font-medium mt-1.5 ml-1 leading-none">{ifscError}</p>}
                    </div>
                  </div>
                </div> */}

                {error && <div className="text-[10px] font-bold tracking-wide text-[#8B3D28] bg-red-50 py-3 px-4 rounded-xl text-center border border-red-100">{error}</div>}
                {successMessage && <div className="text-[10px] font-bold tracking-wide text-green-700 bg-green-50 py-3 px-4 rounded-xl text-center border border-green-100">{successMessage}</div>}

                <button
                  type="submit" disabled={loading || uploadingDocs}
                  className="w-full bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-[#8B3D28]/30 transition-all active:scale-[0.98] relative overflow-hidden group border-none"
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                  <span className="relative z-10">{uploadingDocs ? "UPLOADING ASSETS..." : loading ? "INITIATING ACCOUNT..." : "REQUEST REGISTRATION"}</span>
                </button>

                <div className="text-center pt-4 border-t border-stone-100">
                  <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">
                    ALREADY REGISTERED?{" "}
                    <button type="button" onClick={() => navigate("/delivery/login")} className="text-[#8B3D28] hover:opacity-70 ml-2"> LOGIN HERE</button>
                  </p>
                  {/* Skip button */}
                  <button
                    type="button"
                    onClick={() => navigate('/delivery')}
                    className="mt-4 w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-stone-400 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all active:scale-95"
                  >
                    Skip for now →
                  </button>
                </div>
              </form>
            ) : (
              /* OTP Verification Section */
              <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-3">
                  <p className="text-[#8B3D28] text-[10px] font-black uppercase tracking-[0.3em]">Channel Verification</p>
                  <p className="text-stone-400 text-[9px] font-black uppercase tracking-widest leading-relaxed">AGENT AUTHENTICATION REQUIRED FOR<br /><span className="text-village-umber text-sm tracking-tight">+91 {formData.mobile}</span></p>
                </div>

                <div className="flex justify-center scale-110">
                  <OTPInput onComplete={handleOTPComplete} disabled={loading} />
                </div>

                {error && <div className="text-[10px] font-bold tracking-wide text-[#8B3D28] bg-red-50 py-3 px-4 rounded-xl text-center border border-red-100">{error}</div>}

                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowOTP(false); setError(""); }}
                    disabled={loading}
                    className="flex-1 py-4 bg-stone-50 text-stone-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all border-none"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true); setError("");
                      try { const res = await sendOTP(formData.mobile); if (res.sessionId) setSessionId(res.sessionId); }
                      catch (err: any) { setError(err.message || "RETRANSMISSION FAILED"); }
                      finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="flex-1 py-4 bg-[#8B3D28] text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#8B3D28]/20 transition-all active:scale-95 border-none"
                  >
                    {loading ? "TRANSMITTING..." : "RE-SEND OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legal Meta */}
      <p className="mt-8 text-[7px] font-black text-stone-300 uppercase tracking-[0.4em] text-center max-w-xs leading-loose opacity-60">
        MISSION COMPLETION REQUIRES ADHERENCE TO CORE PROTOCOLS AND PRIVACY DIRECTIVES<br />© 2025 VILLAGE BASKET CORE
      </p>
    </div>
  );
}
