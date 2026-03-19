import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeliveryUser } from '../context/DeliveryUserContext';
import { getDeliveryProfile, updateProfile } from '../../../services/api/delivery/deliveryService';
import { sendTestNotification } from '../../../services/pushNotificationService';
import { useToast } from '../../../context/ToastContext';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Star: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    ),
    Bell: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    )
};

export default function DeliveryProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { setUserName } = useDeliveryUser();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testNotifLoading, setTestNotifLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    vehicleNumber: '',
    vehicleType: 'Bike',
    joinDate: '',
    totalDeliveries: 0,
    rating: 0,
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getDeliveryProfile();
        setProfileData({
          name: data.name,
          phone: data.mobile,
          email: data.email,
          address: data.address,
          vehicleNumber: data.vehicleNumber || '',
          vehicleType: data.vehicleType || 'Bike',
          joinDate: new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          totalDeliveries: data.totalDeliveredCount || 0,
          rating: 4.8, 
          accountName: data.accountName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
        });
        setUserName(data.name);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setUserName]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        address: profileData.address,
        vehicleNumber: profileData.vehicleNumber,
        vehicleType: profileData.vehicleType,
        accountName: profileData.accountName,
        bankName: profileData.bankName,
        accountNumber: profileData.accountNumber,
        ifscCode: profileData.ifscCode,
      });
      setUserName(profileData.name);
      setIsEditing(false);
      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Failed to update profile", "error");
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestNotifLoading(true);
      const result = await sendTestNotification();
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast('Failed to send test notification', 'error');
    } finally {
      setTestNotifLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <VillageLoader message="Verifying Identity" />;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

      {/* Local Header */}
      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
          >
              <Icons.ChevronLeft size={20} />
          </button>
          <div className="ml-2 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Settings</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Personnel Record</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {/* Profile Card */}
        <div className="village-card paper-texture organic-radius p-6 border-none shadow-sm mb-6 flex flex-col items-center">
            <div className="relative mb-4 group">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] flex items-center justify-center shadow-2xl shadow-[#8B3D28]/30 overflow-hidden relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                    <span className="text-white text-3xl font-black tracking-tighter relative z-10">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                    </span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#4A7C59] text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg border-2 border-white">
                    <Icons.Star className="text-white" size={10} />
                    <span className="text-[9px] font-black">{profileData.rating}</span>
                </div>
            </div>

            {isEditing ? (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full text-center bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-2.5 text-sm font-black text-village-umber focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28] outline-none transition-all"
                  placeholder="Full Name"
                />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full text-center bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-2.5 text-xs font-black text-stone-400 focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28] outline-none transition-all"
                  placeholder="Contact Number"
                  disabled
                />
              </div>
            ) : (
              <>
                <h3 className="text-village-umber text-lg font-black tracking-tight leading-none mb-1.5">{profileData.name}</h3>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest leading-none">{profileData.phone}</p>
              </>
            )}
        </div>

        {/* Info Sections */}
        <div className="space-y-4">
            {/* Personal Information */}
            <div className="village-card paper-texture organic-radius p-0 border-none shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                    <h3 className="text-village-umber text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Documentation</h3>
                </div>
                <div className="divide-y divide-stone-50">
                    {[
                        { label: 'Official Email', field: 'email', type: 'email' },
                        { label: 'Registered Address', field: 'address', type: 'textarea' },
                        { label: 'Vehicle Number', field: 'vehicleNumber', type: 'text' },
                        { label: 'Vehicle Class', field: 'vehicleType', type: 'select', options: ['Bike', 'Scooter', 'Car', 'Cycle'] }
                    ].map((item) => (
                        <div key={item.field} className="p-4">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5 leading-none">{item.label}</p>
                            {isEditing ? (
                                item.type === 'textarea' ? (
                                    <textarea
                                        value={profileData[item.field as keyof typeof profileData]}
                                        onChange={(e) => handleInputChange(item.field, e.target.value)}
                                        rows={2}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11px] font-black text-village-umber focus:border-[#8B3D28] outline-none transition-all resize-none"
                                    />
                                ) : item.type === 'select' ? (
                                    <select
                                        value={profileData[item.field as keyof typeof profileData]}
                                        onChange={(e) => handleInputChange(item.field, e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11px] font-black text-village-umber focus:border-[#8B3D28] outline-none transition-all"
                                    >
                                        {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={item.type}
                                        value={profileData[item.field as keyof typeof profileData]}
                                        onChange={(e) => handleInputChange(item.field, e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11px] font-black text-village-umber focus:border-[#8B3D28] outline-none transition-all"
                                    />
                                )
                            ) : (
                                <p className="text-[11px] font-black text-village-umber">{profileData[item.field as keyof typeof profileData] || "N/A"}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bank Particulars */}
            <div className="village-card paper-texture organic-radius p-0 border-none shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                    <h3 className="text-village-umber text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Bank Particulars</h3>
                </div>
                <div className="divide-y divide-stone-50">
                    {[
                        { label: 'Beneficiary Name', field: 'accountName', placeholder: 'Enter name' },
                        { label: 'Issuing Bank', field: 'bankName', placeholder: 'e.g. HDFC Bank' },
                        { label: 'Routing Number', field: 'accountNumber', placeholder: 'Enter number', masked: true },
                        { label: 'IFSC Code', field: 'ifscCode', placeholder: 'e.g. HDFC0001234' }
                    ].map((item) => (
                        <div key={item.field} className="p-4">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1.5 leading-none">{item.label}</p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profileData[item.field as keyof typeof profileData]}
                                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-[11px] font-black text-village-umber focus:border-[#8B3D28] outline-none transition-all"
                                    placeholder={item.placeholder}
                                />
                            ) : (
                                <p className="text-[11px] font-black text-village-umber">
                                    {item.masked && profileData[item.field as keyof typeof profileData] 
                                        ? `XXXX${String(profileData[item.field as keyof typeof profileData]).slice(-4)}`
                                        : profileData[item.field as keyof typeof profileData] || "Not Specified"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Statistics */}
            <div className="village-card paper-texture organic-radius p-6 border-none shadow-sm">
                <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2 leading-none">Career Drops</p>
                        <p className="text-village-umber text-3xl font-black tracking-tighter">{profileData.totalDeliveries}</p>
                    </div>
                    <div className="border-l border-stone-100">
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2 leading-none">Tenure Since</p>
                        <p className="text-village-umber text-[11px] font-black uppercase tracking-tight mt-3">{profileData.joinDate}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-stone-100">
                    <button
                        onClick={handleTestNotification}
                        disabled={testNotifLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-50 text-village-umber hover:bg-stone-100 transition-all active:scale-95 disabled:opacity-50 group"
                    >
                        <Icons.Bell className="text-[#8B3D28]/40 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-[0.1em]">{testNotifLoading ? 'Transmitting...' : 'Transmit Test Signal'}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Terminal Actions */}
        <div className="mt-8 mb-10">
            {isEditing ? (
              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-stone-200 text-stone-600 rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-stone-200/20"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[#4A7C59] text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-[#4A7C59]/20"
                >
                  Commit Changes
                </button>
              </div>
            ) : (
              <button
                onClick={handleEdit}
                className="w-full bg-[#8B3D28] text-white rounded-2xl py-4 font-black text-[11px] uppercase tracking-[0.25em] transition-all active:scale-[0.98] shadow-2xl shadow-[#8B3D28]/20 relative overflow-hidden group"
              >
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                  <span className="relative z-10">Modify Profile</span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

