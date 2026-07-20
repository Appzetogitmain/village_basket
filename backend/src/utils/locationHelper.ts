import mongoose from "mongoose";
import Seller from "../models/Seller";

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Prefer seller string lat/lng (used in admin maps/forms) over GeoJSON,
 * since GeoJSON can be missing or out of sync.
 */
export function resolveSellerCoords(seller: {
  location?: { coordinates?: number[] };
  latitude?: string | number;
  longitude?: string | number;
}): { lat: number; lng: number } | null {
  const latFromString = parseCoordinate(seller.latitude);
  const lngFromString = parseCoordinate(seller.longitude);

  if (
    latFromString !== null &&
    lngFromString !== null &&
    latFromString >= -90 &&
    latFromString <= 90 &&
    lngFromString >= -180 &&
    lngFromString <= 180
  ) {
    return { lat: latFromString, lng: lngFromString };
  }

  const coords = seller.location?.coordinates;
  if (!coords || coords.length !== 2) return null;

  const c0 = parseCoordinate(coords[0]);
  const c1 = parseCoordinate(coords[1]);
  if (c0 === null || c1 === null) return null;

  // GeoJSON is [lng, lat]. Some records were saved as [lat, lng].
  const asGeoJson = { lat: c1, lng: c0 };
  const asSwapped = { lat: c0, lng: c1 };

  const geoJsonValid =
    asGeoJson.lat >= -90 &&
    asGeoJson.lat <= 90 &&
    asGeoJson.lng >= -180 &&
    asGeoJson.lng <= 180;
  const swappedValid =
    asSwapped.lat >= -90 &&
    asSwapped.lat <= 90 &&
    asSwapped.lng >= -180 &&
    asSwapped.lng <= 180;

  if (geoJsonValid && !swappedValid) return asGeoJson;
  if (swappedValid && !geoJsonValid) return asSwapped;
  if (geoJsonValid) return asGeoJson;
  if (swappedValid) return asSwapped;

  return null;
}

export function getSellerIdString(sellerRef: unknown): string | null {
  if (!sellerRef) return null;
  if (typeof sellerRef === "string") return sellerRef;
  if (sellerRef instanceof mongoose.Types.ObjectId) return sellerRef.toString();

  if (typeof sellerRef === "object") {
    const obj = sellerRef as { _id?: unknown };
    if (obj._id) {
      return obj._id instanceof mongoose.Types.ObjectId
        ? obj._id.toString()
        : String(obj._id);
    }
  }

  return String(sellerRef);
}

export function isSellerInNearbyList(
  sellerRef: unknown,
  nearbySellerIds: mongoose.Types.ObjectId[]
): boolean {
  const sellerId = getSellerIdString(sellerRef);
  if (!sellerId) return false;
  return nearbySellerIds.some((id) => id.toString() === sellerId);
}

/**
 * Find sellers whose service radius covers the user's location.
 * Uses Haversine on string lat/lng when available (same source as admin maps).
 */
export async function findSellersWithinRange(
  userLat: number,
  userLng: number
): Promise<mongoose.Types.ObjectId[]> {
  if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
    return [];
  }

  if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return [];
  }

  try {
    const sellers = await Seller.find({})
      .select("_id location serviceRadiusKm latitude longitude")
      .lean();

    const nearbySellerIds: mongoose.Types.ObjectId[] = [];

    for (const seller of sellers) {
      const coords = resolveSellerCoords(
        seller as {
          location?: { coordinates?: number[] };
          latitude?: string | number;
          longitude?: string | number;
        }
      );

      if (!coords) {
        // Sellers without coordinates remain visible everywhere
        nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
        continue;
      }

      const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
      const serviceRadius = seller.serviceRadiusKm || 10;

      if (distance <= serviceRadius) {
        nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
      }
    }

    return nearbySellerIds;
  } catch (error) {
    console.error("Error finding nearby sellers:", error);
    return [];
  }
}
