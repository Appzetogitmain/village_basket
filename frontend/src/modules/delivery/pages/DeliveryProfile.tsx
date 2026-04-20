import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeliveryUser } from '../context/DeliveryUserContext';
import { getDeliveryProfile, updateProfile } from '../../../services/api/delivery/deliveryService';
import { uploadImage } from '../../../services/api/uploadService';
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
    )
};

export default function DeliveryProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { setUserName, setProfileImage } = useDeliveryUser();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface ProfileData {
    name: string;
    phone: string;
    email: string;
    address: string;
    vehicleNumber: string;
    vehicleType: string;
    joinDate: string;
    totalDeliveries: number;
    rating: number;
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    profileImage: string;
  }

  const [profileData, setProfileData] = useState<ProfileData>({
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
    profileImage: '',
  });
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getDeliveryProfile();
        const resolvedRating = Number(
          (data as any)?.rating ??
          (data as any)?.averageRating ??
          (data as any)?.deliveryRating ??
          0
        );
        const nextProfileData: ProfileData = {
          name: data.name,
          phone: data.mobile,
          email: data.email,
          address: data.address,
          vehicleNumber: data.vehicleNumber || '',
          vehicleType: data.vehicleType || 'Bike',
          joinDate: new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          totalDeliveries: data.totalDeliveredCount || 0,
          rating: Number.isFinite(resolvedRating) ? Number(resolvedRating.toFixed(1)) : 0,
          accountName: data.accountName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          profileImage: data.profileImage || '',
        };
        setProfileData(nextProfileData);
        setOriginalProfileData(nextProfileData);
        setUserName(data.name);
        setProfileImage(data.profileImage || '');
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setProfileImage, setUserName]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
      setProfileImage(originalProfileData.profileImage || '');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    const vehicleNumberPattern = /^[A-Z]{2} [0-9]{2} [A-Z]{2} [0-9]{4}$/;
    if (
      profileData.vehicleNumber &&
      !vehicleNumberPattern.test(profileData.vehicleNumber)
    ) {
      showToast('Vehicle number format must be AA 00 AA 0000', 'error');
      return;
    }

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
        profileImage: profileData.profileImage,
      });
      setUserName(profileData.name);
      setProfileImage(profileData.profileImage || '');
      setOriginalProfileData(profileData);
      setIsEditing(false);
      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Failed to update profile", "error");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatVehicleNumber = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const groups = [
      { len: 2, type: 'alpha' as const },
      { len: 2, type: 'digit' as const },
      { len: 2, type: 'alpha' as const },
      { len: 4, type: 'digit' as const },
    ];

    const parts: string[] = ['', '', '', ''];
    let groupIndex = 0;

    for (const ch of cleaned) {
      if (groupIndex >= groups.length) break;

      const group = groups[groupIndex];
      const isMatch =
        group.type === 'alpha' ? /[A-Z]/.test(ch) : /[0-9]/.test(ch);

      if (!isMatch) continue;

      parts[groupIndex] += ch;
      if (parts[groupIndex].length === group.len) {
        groupIndex += 1;
      }
    }

    return parts.filter(Boolean).join(' ');
  };

  const handleVehicleNumberChange = (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      vehicleNumber: formatVehicleNumber(value),
    }));
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    try {
      setImageUploading(true);
      const result = await uploadImage(file, 'villagebasket/delivery/profile');
      const imageUrl = result.secureUrl || result.url;
      setProfileData((prev) => ({ ...prev, profileImage: imageUrl }));
      showToast('Photo uploaded. Click Commit Changes to apply on home.', 'success');
    } catch (error) {
      console.error('Failed to upload profile photo', error);
      const errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to upload profile photo';
      showToast(errorMessage, 'error');
    } finally {
      setImageUploading(false);
      event.target.value = '';
    }
  };

  const openPhotoPicker = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    fileInputRef.current?.click();
  };

  if (loading) {
    return <VillageLoader message="Verifying Identity" />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 font-poppins relative">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="relative mb-4 group">
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={imageUploading}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] flex items-center justify-center shadow-2xl shadow-[#8B3D28]/30 overflow-hidden relative transition-transform active:scale-95 disabled:opacity-70"
                  aria-label="Upload profile photo"
                  title="Tap to change profile photo"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                    {profileData.profileImage ? (
                      <img
                        src={profileData.profileImage}
                        alt={`${profileData.name || 'Partner'} profile`}
                        className="w-full h-full object-cover relative z-10"
                      />
                    ) : (
                      <span className="text-white text-3xl font-black tracking-tighter relative z-10">
                          {profileData.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                </button>
                <div className="absolute bottom-1 right-1 z-20 bg-[#4A7C59] text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg border-2 border-white pointer-events-none">
                    <Icons.Star className="text-white" size={10} />
                    <span className="text-[9px] font-black">{profileData.rating}</span>
                </div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">
              {imageUploading ? 'Uploading photo...' : 'Tap Photo To Change'}
            </p>
            {isEditing && (
              <div className="w-full mb-3">
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={imageUploading}
                  className="w-full bg-stone-50 border border-stone-200 text-village-umber rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all disabled:opacity-50"
                >
                  {imageUploading ? 'Uploading photo...' : 'Change Profile Photo'}
                </button>
              </div>
            )}

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
                                        onChange={(e) =>
                                          item.field === 'vehicleNumber'
                                            ? handleVehicleNumberChange(e.target.value)
                                            : handleInputChange(item.field, e.target.value)
                                        }
                                        inputMode={item.field === 'vehicleNumber' ? 'text' : undefined}
                                        maxLength={item.field === 'vehicleNumber' ? 13 : undefined}
                                        placeholder={item.field === 'vehicleNumber' ? 'AA 00 AA 0000' : undefined}
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

