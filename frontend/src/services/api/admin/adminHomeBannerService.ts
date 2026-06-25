import api from "../config";

export interface HomeBanner {
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    headerCategoryId?: {
        _id: string;
        name: string;
        slug: string;
    } | string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface HomeBannerFormData {
    title?: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    headerCategoryId?: string;
    order?: number;
    isActive: boolean;
}

export interface HomeBannerResponse {
    success: boolean;
    message?: string;
    data?: HomeBanner | HomeBanner[];
}

// Get all home banners
export const getHomeBanners = async (): Promise<HomeBannerResponse> => {
    const response = await api.get<HomeBannerResponse>("/admin/home-banners");
    return response.data;
};

// Get single home banner by ID
export const getHomeBannerById = async (
    id: string
): Promise<HomeBannerResponse> => {
    const response = await api.get<HomeBannerResponse>(
        `/admin/home-banners/${id}`
    );
    return response.data;
};

// Create new home banner
export const createHomeBanner = async (
    data: HomeBannerFormData
): Promise<HomeBannerResponse> => {
    const response = await api.post<HomeBannerResponse>(
        "/admin/home-banners",
        data
    );
    return response.data;
};

// Update home banner
export const updateHomeBanner = async (
    id: string,
    data: Partial<HomeBannerFormData>
): Promise<HomeBannerResponse> => {
    const response = await api.put<HomeBannerResponse>(
        `/admin/home-banners/${id}`,
        data
    );
    return response.data;
};

// Delete home banner
export const deleteHomeBanner = async (
    id: string
): Promise<HomeBannerResponse> => {
    const response = await api.delete<HomeBannerResponse>(
        `/admin/home-banners/${id}`
    );
    return response.data;
};

// Reorder home banners
export const reorderHomeBanners = async (
    banners: { id: string; order: number }[]
): Promise<HomeBannerResponse> => {
    const response = await api.put<HomeBannerResponse>(
        "/admin/home-banners/reorder",
        { banners }
    );
    return response.data;
};
