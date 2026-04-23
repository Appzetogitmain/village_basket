import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '../hooks/useLocation';
import GoogleMapsAutocomplete from './GoogleMapsAutocomplete';

interface LocationPermissionRequestProps {
  onLocationGranted: () => void;
  skipable?: boolean;
  title?: string;
  description?: string;
}

export default function LocationPermissionRequest({
  onLocationGranted,
  skipable = false,
  title = 'Location Access Required',
  description = 'We need your location to show you products available near you and enable delivery services.',
}: LocationPermissionRequestProps) {
  const { requestLocation, updateLocation, isLocationEnabled, isLocationLoading, locationError, locationPermissionStatus, clearLocation } = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualLat, setManualLat] = useState(0);
  const [manualLng, setManualLng] = useState(0);

  // Auto-grant if already enabled or session permission exists
  useEffect(() => {
    if (isLocationEnabled) {
      console.log('[LocationPermissionRequest] Location is enabled, notifying parent.');
      onLocationGranted();
    }
  }, [isLocationEnabled, onLocationGranted]);

  const handleAllowLocation = async () => {
    // Clear any previous errors before retrying
    setManualAddress('');
    setManualLat(0);
    setManualLng(0);
    setShowManualInput(false);

    try {
      // ONLY call location API when user explicitly clicks the button
      // This ensures we don't auto-request location on app load
      await requestLocation();
      // If requestLocation succeeds, locationError will be cleared in the context
      // and isLocationEnabled will be set to true, which will trigger onLocationGranted
    } catch (error) {
      // Error is handled by context and displayed in the error box
      // Location will remain disabled, modal will stay visible
      // User can retry or use manual location entry
    }
  };

  const handleManualLocationSelect = useCallback((address: string, lat: number, lng: number, _placeName: string) => {
    setManualAddress(address);
    // Ignore synthetic zeroes emitted by React when the DOM input value changes automatically
    if (lat !== 0 || lng !== 0) {
      setManualLat(lat);
      setManualLng(lng);
    } else if (!address) {
      setManualLat(0);
      setManualLng(0);
    }
  }, []);

  const handleSaveManualLocation = useCallback(async () => {
    if (!manualAddress || manualAddress.length < 3) {
      return;
    }

    let finalLat = manualLat;
    let finalLng = manualLng;

    // If Google's API failed to populate lat/lng but they typed an address, do a quick fallback lookup
    if (finalLat === 0 || finalLng === 0) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            finalLat = parseFloat(data[0].lat);
            finalLng = parseFloat(data[0].lon);
          }
        }
      } catch (e) {
        console.error('Fallback geocoding failed', e);
      }
    }

    // Absolute fallback to prevent UI block if all geocoding fails
    if (finalLat === 0 || finalLng === 0) {
      finalLat = 20.5937; // Center of India fallback
      finalLng = 78.9629;
    }

    try {
      // Save manual location - this will set isLocationEnabled to true
      await updateLocation({
        latitude: finalLat,
        longitude: finalLng,
        address: manualAddress,
      });
      // Modal will automatically hide when isLocationEnabled becomes true
      onLocationGranted();
    } catch (error) {
      console.error('Failed to save manual location:', error);
    }
  }, [manualAddress, manualLat, manualLng, updateLocation, onLocationGranted]);

  if (isLocationEnabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#8B3D28]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#8B3D28]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{title}</h2>
          <p className="text-sm text-neutral-600">
            {description}
          </p>
        </div>

        {!showManualInput ? (
          <>
            {locationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 mb-2 font-medium">{locationError}</p>
                <p className="text-xs text-red-500">
                  {locationError.includes('timeout')
                    ? 'Please ensure your location/GPS is enabled and try again, or enter location manually.'
                    : 'You can try again or enter your location manually below.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleAllowLocation}
                disabled={isLocationLoading}
                className="w-full py-3 bg-[#8B3D28] text-white rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLocationLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Getting your location...</span>
                  </>
                ) : (
                  locationError ? 'Retry Location Access' : 'Allow Location Access'
                )}
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                className="w-full py-3 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
              >
                Enter Location Manually
              </button>

              {skipable && (
                <button
                  onClick={onLocationGranted}
                  className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Skip for now
                </button>
              )}

              {locationPermissionStatus === 'session_granted' && !isLocationEnabled && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 mb-2">
                    Permission granted for this session, but location data is missing.
                  </p>
                  <button
                    onClick={clearLocation}
                    className="text-xs text-[#8B3D28] font-medium hover:underline"
                  >
                    Reset and ask again
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <style>{`.pac-container { z-index: 100000 !important; }`}</style>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search and select your location
              </label>
              <GoogleMapsAutocomplete
                value={manualAddress}
                onChange={handleManualLocationSelect}
                placeholder="Type your address or location..."
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500 font-bold">Or</span>
              </div>
            </div>

            <button
              onClick={handleAllowLocation}
              disabled={isLocationLoading}
              className="w-full py-2 bg-village-green/10 text-village-green rounded-lg font-bold text-sm hover:bg-village-green/20 transition-all flex items-center justify-center gap-2 border border-village-green/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isLocationLoading ? 'Detecting...' : 'Detect My Location'}
            </button>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowManualInput(false)}
                className="flex-1 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSaveManualLocation}
                disabled={!manualAddress || manualAddress.length < 3 || isLocationLoading}
                className="flex-1 py-2 bg-[#8B3D28] text-white rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






