import { useState, useEffect, useCallback } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLocation as useAppLocation } from '../../hooks/useLocation';
import { OrderAddress } from '../../types/order';
import { getAddresses, addAddress, updateAddress, Address } from '../../services/api/customerAddressService';
import { getDeliveryConfig, AppDeliverySettings } from '../../services/api/customerService';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';

import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAP_SCRIPT_ID } from '../../config/googleMapsConfig';

export default function CheckoutAddress() {
  const { cart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { updateLocation } = useAppLocation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get address from navigation state if editing
  const editAddress = (location.state as any)?.editAddress as OrderAddress | undefined;
  const returnTo = (location.state as any)?.returnTo as string | undefined;

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<OrderAddress>({
    name: editAddress?.name || '',
    phone: editAddress?.phone || '',
    flat: editAddress?.flat || '',
    street: editAddress?.street || '',
    city: editAddress?.city || '',
    pincode: editAddress?.pincode || '',
    state: editAddress?.state || '',
    landmark: editAddress?.landmark || '',
    id: editAddress?.id || editAddress?._id,
    _id: editAddress?._id || editAddress?.id,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OrderAddress, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [orderingFor, setOrderingFor] = useState<'myself' | 'someone-else'>('myself');
  const [addressType, setAddressType] = useState<'home' | 'work' | 'hotel' | 'other'>('home');

  // Location picker state — seed from editAddress when available
  const [selectedLatitude, setSelectedLatitude] = useState<number>(editAddress?.latitude || 0);
  const [selectedLongitude, setSelectedLongitude] = useState<number>(editAddress?.longitude || 0);
  const [deliverySettings, setDeliverySettings] = useState<AppDeliverySettings | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Fetch delivery configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await getDeliveryConfig();
        if (response.success) {
          setDeliverySettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching delivery config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Fetch all addresses on mount
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAddresses = async () => {
        try {
          const response = await getAddresses();
          if (response.success && Array.isArray(response.data)) {
            setSavedAddresses(response.data);

            // If not editing, try to load the default 'home' address if it exists
            if (!editAddress) {
              const homeAddr = response.data.find(a => a.type === 'Home');
              if (homeAddr) {
                const parts = homeAddr.address.split(', ');
                setAddress({
                  name: homeAddr.fullName,
                  phone: homeAddr.phone,
                  flat: parts[0] || '',
                  street: parts.slice(1).join(', ') || parts[1] || '',
                  city: homeAddr.city,
                  state: homeAddr.state || '',
                  pincode: homeAddr.pincode,
                  landmark: homeAddr.landmark || '',
                  id: homeAddr._id,
                });
                if (homeAddr.latitude && homeAddr.longitude) {
                  setSelectedLatitude(homeAddr.latitude);
                  setSelectedLongitude(homeAddr.longitude);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
      };
      fetchAddresses();
    }
  }, [isAuthenticated, editAddress]);

  // Update address when addressType changes
  useEffect(() => {
    if (!editAddress && savedAddresses.length > 0) {
      const typeLabel = addressType.charAt(0).toUpperCase() + addressType.slice(1) as any;
      const existingAddr = savedAddresses.find(a => a.type === typeLabel);

      if (existingAddr) {
        const parts = existingAddr.address.split(', ');
        setAddress({
          name: existingAddr.fullName,
          phone: existingAddr.phone,
          flat: parts[0] || '',
          street: parts.slice(1).join(', ') || parts[1] || '',
          city: existingAddr.city,
          state: existingAddr.state || '',
          pincode: existingAddr.pincode,
          landmark: existingAddr.landmark || '',
          id: existingAddr._id,
        });
        if (existingAddr.latitude && existingAddr.longitude) {
          setSelectedLatitude(existingAddr.latitude);
          setSelectedLongitude(existingAddr.longitude);
        } else {
          setSelectedLatitude(0);
          setSelectedLongitude(0);
        }
      } else {
        // Clear or reset to defaults if no address of this type
        setAddress(prev => ({
          ...prev,
          flat: '',
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          id: undefined,
          _id: undefined,
        }));
        setSelectedLatitude(0);
        setSelectedLongitude(0);
      }
    }
  }, [addressType, savedAddresses, editAddress]);

  // Update address when editAddress changes
  useEffect(() => {
    if (editAddress) {
      setAddress({
        name: editAddress.name || '',
        phone: editAddress.phone || '',
        flat: editAddress.flat || '',
        street: editAddress.street || '',
        city: editAddress.city || '',
        pincode: editAddress.pincode || '',
        state: editAddress.state || '',
        landmark: editAddress.landmark || '',
        id: editAddress.id || editAddress._id,
        _id: editAddress._id || editAddress.id,
        latitude: editAddress.latitude,
        longitude: editAddress.longitude,
      });

      if (editAddress.latitude && editAddress.longitude) {
        setSelectedLatitude(editAddress.latitude);
        setSelectedLongitude(editAddress.longitude);
      }

      // Try to set address type based on editAddress if it has one
      if ((editAddress as any).type) {
        setAddressType(String((editAddress as any).type).toLowerCase() as typeof addressType);
      }
    }
  }, [editAddress]);

  const platformFee = cart.platformFee ?? deliverySettings?.platformFee ?? appConfig.platformFee;
  const deliveryFee = cart.estimatedDeliveryFee ?? (cart.total >= (deliverySettings?.freeDeliveryThreshold ?? appConfig.freeDeliveryThreshold) ? 0 : (deliverySettings?.deliveryCharges ?? appConfig.deliveryFee));
  const totalAmount = cart.total + platformFee + deliveryFee;

  // Capture live GPS location and fill address fields
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLatitude(lat);
        setSelectedLongitude(lng);

        // Refresh cart for new GPS location
        refreshCart(lat, lng);

        const applyLiveLocation = async (
          street: string,
          city: string,
          state: string,
          pincode: string,
          landmark: string,
          formattedAddress?: string
        ) => {
          setAddress(prev => ({
            ...prev,
            street: street.trim() || prev.street,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            landmark: landmark || prev.landmark
          }));

          // Sync app-wide "Deliver to" location so home header updates too
          const displayAddress =
            formattedAddress ||
            [street, city, state, pincode].filter(Boolean).join(', ') ||
            `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          try {
            await updateLocation({
              latitude: lat,
              longitude: lng,
              address: displayAddress,
              city: city || undefined,
              state: state || undefined,
              pincode: pincode || undefined,
            });
          } catch (err) {
            console.warn('Failed to sync app location:', err);
          }
        };

        // Reverse Geocode to populate fields
        if (window.google?.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
            setIsLocating(false);
            if (status === 'OK' && results && results[0]) {
              const components = results[0].address_components;
              let street = '';
              let city = '';
              let state = '';
              let pincode = '';
              let landmark = '';

              components.forEach(c => {
                const types = c.types;
                if (types.includes('street_number')) street = c.long_name + ' ' + street;
                if (types.includes('route')) street += c.long_name;
                if (types.includes('locality')) city = c.long_name;
                if (types.includes('administrative_area_level_1')) state = c.long_name;
                if (types.includes('postal_code')) pincode = c.long_name;
                if (types.includes('sublocality') || types.includes('neighborhood')) landmark = c.long_name;
              });

              await applyLiveLocation(street, city, state, pincode, landmark, results[0].formatted_address);
              showToast('Live location captured', 'success');
            } else {
              await applyLiveLocation('', '', '', '', '');
              showToast('Location found — please complete address details', 'info');
            }
          });
        } else {
          setIsLocating(false);
          applyLiveLocation('', '', '', '', '').then(() => {
            showToast('Location pin set — please fill address details', 'info');
          });
        }
      },
      (error) => {
        setIsLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Enable it in browser settings.'
            : error.code === error.TIMEOUT
              ? 'Location request timed out. Please try again.'
              : 'Failed to get live location. Please try again.';
        showToast(message, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, [showToast, refreshCart, updateLocation]);

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedLatitude(lat);
        setSelectedLongitude(lng);

        // Refresh cart to get updated delivery fee for this locality
        refreshCart(lat, lng);

        // Populate fields from place components
        const addrComponents = place.address_components;
        if (addrComponents) {
          let street = '';
          let city = '';
          let state = '';
          let pincode = '';
          let landmark = place.name !== place.formatted_address ? place.name : '';

          addrComponents.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) street = component.long_name + ' ' + street;
            if (types.includes('route')) street += component.long_name;
            if (types.includes('locality')) city = component.long_name;
            if (types.includes('administrative_area_level_1')) state = component.long_name;
            if (types.includes('postal_code')) pincode = component.long_name;
            if (!landmark && (types.includes('sublocality') || types.includes('neighborhood'))) {
              landmark = component.long_name;
            }
          });

          setAddress(prev => ({
            ...prev,
            street: street.trim() || prev.street,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            landmark: landmark || prev.landmark
          }));
        }
      }
    }
  };

  const handleLocationSelect = useCallback((lat: number, lng: number, addressDetails?: any) => {
    setSelectedLatitude(lat);
    setSelectedLongitude(lng);
    
    // Refresh cart to get updated delivery fee for this specific location
    refreshCart(lat, lng);

    if (addressDetails) {
      setAddress(prev => ({
        ...prev,
        street: addressDetails.street || prev.street,
        city: addressDetails.city || prev.city,
        state: addressDetails.state || prev.state,
        pincode: addressDetails.pincode || prev.pincode,
        landmark: addressDetails.landmark || prev.landmark
      }));
    }
  }, [refreshCart]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OrderAddress, string>> = {};

    if (!address.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!address.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (address.phone.length < 10) {
      newErrors.phone = 'Phone must be at least 10 digits';
    }
    if (!address.flat.trim()) {
      newErrors.flat = 'Flat/House No. is required';
    }
    if (!address.street.trim()) {
      newErrors.street = 'Street/Area is required';
    }
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!address.state?.trim()) {
        newErrors.state = 'State is required';
    }
    if (!address.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (address.pincode.length < 6) {
      newErrors.pincode = 'Pincode must be at least 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OrderAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveAddress = async () => {
    if (!isAuthenticated) {
      showToast('Please login to save your address', 'info');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!validateForm()) {
      return;
    }

    let finalLat = selectedLatitude || 0;
    let finalLng = selectedLongitude || 0;

    // Try to geocode if map/live location wasn't used but we have text address
    if (isLoaded && (!finalLat || !finalLng)) {
      const fullAddress = `${address.flat}, ${address.street}, ${address.city}, ${address.state}, ${address.pincode}`;
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else {
              reject(status);
            }
          });
        });

        if (result?.[0]?.geometry?.location) {
          finalLat = result[0].geometry.location.lat();
          finalLng = result[0].geometry.location.lng();
          setSelectedLatitude(finalLat);
          setSelectedLongitude(finalLng);
        }
      } catch (e) {
        console.warn('Geocoding failed', e);
      }
    }

    if (!finalLat || !finalLng) {
      showToast('Please use live location or set the pin on the map before saving', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const addressId = editAddress?.id || editAddress?._id || address.id || address._id;
      const existingAddr = addressId
        ? savedAddresses.find((a) => a._id === addressId)
        : undefined;

      const payload = {
        fullName: address.name,
        phone: address.phone,
        flat: address.flat,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark,
        type: addressType.charAt(0).toUpperCase() + addressType.slice(1) as 'Home' | 'Work' | 'Hotel' | 'Other',
        isDefault: existingAddr?.isDefault ?? (editAddress as any)?.isDefault ?? !addressId,
        address: `${address.flat}, ${address.street}`,
        latitude: finalLat,
        longitude: finalLng,
      };
      let response;
      if (addressId) {
        response = await updateAddress(addressId, payload);
      } else {
        response = await addAddress(payload);
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to save address');
      }

      // Keep home "Deliver to" in sync with saved delivery pin
      const displayAddress = [address.flat, address.street, address.city, address.state, address.pincode]
        .filter(Boolean)
        .join(', ');
      try {
        await updateLocation({
          latitude: finalLat,
          longitude: finalLng,
          address: displayAddress,
          city: address.city || undefined,
          state: address.state || undefined,
          pincode: address.pincode || undefined,
        });
      } catch (err) {
        console.warn('Failed to sync app location after save:', err);
      }

      showToast(addressId ? 'Address updated successfully' : 'Address saved successfully', 'success');
      setIsSaving(false);
      navigate(returnTo || '/user/checkout', { replace: true });
    } catch (error: any) {
      console.error('Error saving address:', error);
      setIsSaving(false);
      showToast(error?.response?.data?.message || error?.message || 'Failed to save address', 'error');
    }
  };

  const isFormValid = address.name.trim() !== '' &&
    address.phone.trim().length >= 10 &&
    address.flat.trim() !== '' &&
    address.street.trim() !== '' &&
    address.city.trim() !== '' &&
    (address.state?.trim() || '') !== '' &&
    address.pincode.trim().length >= 6;

  return (
    <div className="pb-24 bg-transparent min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors mr-2"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-base font-black text-neutral-900 font-poppins uppercase tracking-tight">
              {editAddress ? 'Edit address' : 'Enter complete address'}
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative">
        {isLoaded && (
          <div className="h-[250px] relative">
            <GoogleMapsLocationPicker
              initialLat={selectedLatitude || 20.5937}
              initialLng={selectedLongitude || 78.9629}
              onLocationSelect={handleLocationSelect}
              height="250px"
            />

            {/* Floating Autocomplete Search inside Map area for premium feel */}
            <div className="absolute top-4 left-4 right-4 z-[40]">
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search your locality / area..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl shadow-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8B3D28] font-poppins"
                  />
                </div>
              </Autocomplete>
            </div>
          </div>
        )}

        {/* Use Live Location — always visible even if map hasn't loaded */}
        <div className="px-4 py-3 border-b border-neutral-200 bg-white">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 text-xs font-black font-poppins uppercase tracking-wide transition-all ${
              isLocating
                ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-wait'
                : selectedLatitude && selectedLongitude
                  ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28] hover:bg-[#8B3D28]/15'
                  : 'border-[#8B3D28] bg-white text-[#8B3D28] hover:bg-[#8B3D28]/5 active:scale-[0.98]'
            }`}
          >
            {isLocating ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Detecting live location...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor" />
                </svg>
                {selectedLatitude && selectedLongitude ? 'Live location set — tap to refresh' : 'Use my live location'}
              </>
            )}
          </button>
          {selectedLatitude !== 0 && selectedLongitude !== 0 && (
            <p className="mt-1.5 text-[10px] text-center text-neutral-500 font-poppins">
              Pin: {selectedLatitude.toFixed(5)}, {selectedLongitude.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
        <label className="text-xs font-black text-neutral-900 font-poppins uppercase tracking-widest">
          Delivery Address Details
        </label>
        <div className="flex items-center gap-1 text-[#8B3D28]">
          <span className="text-[10px] font-bold font-poppins">Pin verified</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Who you are ordering for? */}
      <div className="px-4 py-2.5 border-b border-neutral-200">
        <p className="text-xs font-medium text-neutral-700 mb-2">Who you are ordering for?</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="orderingFor"
              value="myself"
              checked={orderingFor === 'myself'}
              onChange={(e) => setOrderingFor(e.target.value as 'myself' | 'someone-else')}
              className="w-4 h-4 appearance-none border-2 border-neutral-300 rounded-full bg-white checked:bg-white checked:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28] focus:ring-offset-0"
              style={{
                backgroundImage: orderingFor === 'myself'
                  ? 'radial-gradient(circle, #8B3D28 35%, transparent 40%)'
                  : 'none',
                backgroundSize: '40%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="text-xs text-neutral-700">Myself</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="orderingFor"
              value="someone-else"
              checked={orderingFor === 'someone-else'}
              onChange={(e) => setOrderingFor(e.target.value as 'myself' | 'someone-else')}
              className="w-4 h-4 appearance-none border-2 border-neutral-300 rounded-full bg-white checked:bg-white checked:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28] focus:ring-offset-0"
              style={{
                backgroundImage: orderingFor === 'someone-else'
                  ? 'radial-gradient(circle, #8B3D28 35%, transparent 40%)'
                  : 'none',
                backgroundSize: '40%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <span className="text-xs text-neutral-700">Someone else</span>
          </label>
        </div>
      </div>

      {/* Save address as - Only show when ordering for myself */}
      {orderingFor === 'myself' && (
        <div className="px-4 py-2.5 border-b border-neutral-200">
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Save address as <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'work', label: 'Work', icon: '🏢' },
              { id: 'hotel', label: 'Hotel', icon: '🏨' },
              { id: 'other', label: 'Other', icon: '📍' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setAddressType(type.id as typeof addressType)}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black transition-colors flex items-center gap-1.5 font-poppins uppercase tracking-tighter ${addressType === type.id
                  ? 'border-[#8B3D28] bg-[#8B3D28]/5 text-[#8B3D28]'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
              >
                <span className="text-sm">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Address Form */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.name ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="Enter your name"
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={address.phone}
            onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.phone ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="Enter mobile number"
            maxLength={10}
          />
          {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Flat / House No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.flat}
            onChange={(e) => handleInputChange('flat', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.flat ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="Flat/House No."
          />
          {errors.flat && <p className="text-[10px] text-red-500 mt-0.5">{errors.flat}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Street / Area <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.street ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="Street/Area"
          />
          {errors.street && <p className="text-[10px] text-red-500 mt-0.5">{errors.street}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.city ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="City"
          />
          {errors.city && <p className="text-[10px] text-red-500 mt-0.5">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.state ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="State"
          />
          {errors.state && <p className="text-[10px] text-red-500 mt-0.5">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address.pincode}
            onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
            className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors ${errors.pincode ? 'border-red-500' : 'border-neutral-200'
              }`}
            placeholder="Pincode"
            maxLength={6}
          />
          {errors.pincode && <p className="text-[10px] text-red-500 mt-0.5">{errors.pincode}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Landmark (Optional)
          </label>
          <input
            type="text"
            value={address.landmark || ''}
            onChange={(e) => handleInputChange('landmark', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] transition-colors"
            placeholder="E.g. Near Apollo Hospital"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-black text-neutral-900 mb-2.5 font-poppins uppercase tracking-tight">Order Summary</h2>
        <div className="bg-white rounded-lg border border-neutral-200 p-2.5">
          {/* Cart Items */}
          <div className="space-y-2 mb-3">
            {cart.items.map((item) => {
              const { displayPrice } = calculateProductPrice(item.product);
              return (
                <div key={item.product.id} className="flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">{item.product.name}</div>
                    <div className="text-[10px] text-neutral-500">
                      {item.product.pack} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-semibold text-neutral-900 ml-2 flex-shrink-0">
                    {"\u20B9"}{(displayPrice * item.quantity).toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-neutral-200 pt-2.5 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-700">
              <span>Subtotal</span>
              <span className="font-medium">{"\u20B9"}{cart.total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-700">
              <span>Platform Fee</span>
              <span className="font-medium">{"\u20B9"}{platformFee}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-700">
              <span>Delivery Charges</span>
              <span className={`font-black ${deliveryFee === 0 ? 'text-[#8B3D28]' : ''}`}>
                {deliveryFee === 0 ? 'Free' : `\u20B9${deliveryFee}`}
              </span>
            </div>
            <div className="border-t border-neutral-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-neutral-900 font-poppins uppercase tracking-tight">Total</span>
                <span className="text-base font-black text-[#8B3D28] font-poppins">{"\u20B9"}{totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Address Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-[60] shadow-lg">
        <button
          onClick={handleSaveAddress}
          disabled={!isFormValid || isSaving}
          className={`w-full py-4 px-4 font-black text-sm transition-all font-poppins uppercase tracking-widest ${isFormValid && !isSaving
            ? 'bg-[#8B3D28] text-white hover:bg-[#722F1E] shadow-lg active:scale-[0.98]'
            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
        >
          {isSaving ? 'Saving...' : editAddress ? 'Update address' : 'Save & Proceed'}
        </button>
      </div>
    </div>
  );
}
