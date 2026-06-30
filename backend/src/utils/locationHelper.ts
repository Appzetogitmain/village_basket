import mongoose from "mongoose";
import Seller from "../models/Seller";

/** Max km used for $geoNear pre-filter (per-seller radius applied after) */
const GEO_NEAR_MAX_KM = 100;

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
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

function resolveSellerCoords(seller: {
  location?: { coordinates?: number[] };
  latitude?: string;
  longitude?: string;
}): { lat: number; lng: number } | null {
  if (seller.location?.coordinates?.length === 2) {
    return {
      lng: seller.location.coordinates[0],
      lat: seller.location.coordinates[1],
    };
  }
  if (seller.latitude && seller.longitude) {
    const lat = parseFloat(seller.latitude);
    const lng = parseFloat(seller.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

async function findSellersWithinRangeFallback(
  userLat: number,
  userLng: number
): Promise<mongoose.Types.ObjectId[]> {
  const sellers = await Seller.find({}).select("_id location serviceRadiusKm latitude longitude");
  const nearbySellerIds: mongoose.Types.ObjectId[] = [];

  for (const seller of sellers) {
    const coords = resolveSellerCoords(seller);
    if (coords) {
      const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
      const serviceRadius = seller.serviceRadiusKm || 10;
      if (distance <= serviceRadius) {
        nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
      }
    } else {
      nearbySellerIds.push(seller._id as mongoose.Types.ObjectId);
    }
  }

  return nearbySellerIds;
}

/**
 * Find sellers whose service radius covers the user's location
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @returns Array of seller IDs within range
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
    const nearbySellerIds: mongoose.Types.ObjectId[] = [];
    const processedIds = new Set<string>();

    const addId = (id: mongoose.Types.ObjectId) => {
      const key = id.toString();
      if (!processedIds.has(key)) {
        processedIds.add(key);
        nearbySellerIds.push(id);
      }
    };

    // 1. Geo-indexed sellers via $geoNear (avoids full collection scan)
    try {
      const geoResults = await Seller.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "distMeters",
            maxDistance: GEO_NEAR_MAX_KM * 1000,
            spherical: true,
            query: {
              location: { $exists: true, $ne: null },
              "location.coordinates.0": { $exists: true },
            },
          },
        },
        {
          $project: {
            _id: 1,
            serviceRadiusKm: 1,
            distKm: { $divide: ["$distMeters", 1000] },
          },
        },
      ]);

      for (const seller of geoResults) {
        const serviceRadius = seller.serviceRadiusKm || 10;
        if (seller.distKm <= serviceRadius) {
          addId(seller._id);
        }
      }

      for (const seller of geoResults) {
        processedIds.add(seller._id.toString());
      }
    } catch {
      return findSellersWithinRangeFallback(userLat, userLng);
    }

    // 2. Sellers without geo index data (string lat/lng or no location)
    const remainingSellers = await Seller.find({
      _id: { $nin: Array.from(processedIds) },
    })
      .select("_id location serviceRadiusKm latitude longitude")
      .lean();

    for (const seller of remainingSellers) {
      const coords = resolveSellerCoords(seller as {
        location?: { coordinates?: number[] };
        latitude?: string;
        longitude?: string;
      });
      if (coords) {
        const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
        const serviceRadius = seller.serviceRadiusKm || 10;
        if (distance <= serviceRadius) {
          addId(seller._id as mongoose.Types.ObjectId);
        }
      } else {
        addId(seller._id as mongoose.Types.ObjectId);
      }
    }

    return nearbySellerIds;
  } catch (error) {
    console.error("Error finding nearby sellers:", error);
    return [];
  }
}
