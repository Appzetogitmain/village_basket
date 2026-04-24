import api from "../config";

export interface FestivalModule {
    _id: string;
    name: string;
    festivalTitle: string;
    festivalSubtitle?: string;
    headerGraphic?: string;
    desktopHeaderGraphic?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    textColor?: string;
    labelColor?: string;
    layoutStyle: "grid" | "horizontal";
    categoryTiles: Array<{
        image: string;
        label: string;
        categoryId: any;
        subCategoryId?: any;
    }>;
    headerCategorySlug: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface FestivalModuleFormData {
    name: string;
    festivalTitle: string;
    festivalSubtitle?: string;
    headerGraphic?: string;
    desktopHeaderGraphic?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    textColor?: string;
    labelColor?: string;
    layoutStyle: "grid" | "horizontal";
    categoryTiles: Array<{
        image: string;
        label: string;
        categoryId: string;
        subCategoryId?: string;
    }>;
    headerCategorySlug: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    order?: number;
}

export const getFestivalModules = async (params?: { headerCategorySlug?: string; isActive?: boolean }) => {
    const response = await api.get<{ success: boolean; data: FestivalModule[] }>("/admin/festival-modules", { params });
    return response.data;
};

export const getFestivalModuleById = async (id: string) => {
    const response = await api.get<{ success: boolean; data: FestivalModule }>(`/admin/festival-modules/${id}`);
    return response.data;
};

export const createFestivalModule = async (data: FestivalModuleFormData) => {
    const response = await api.post<{ success: boolean; message: string; data: FestivalModule }>("/admin/festival-modules", data);
    return response.data;
};

export const updateFestivalModule = async (id: string, data: Partial<FestivalModuleFormData>) => {
    const response = await api.put<{ success: boolean; message: string; data: FestivalModule }>(`/admin/festival-modules/${id}`, data);
    return response.data;
};

export const deleteFestivalModule = async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/admin/festival-modules/${id}`);
    return response.data;
};

export const reorderFestivalModules = async (modules: { id: string; order: number }[]) => {
    const response = await api.put<{ success: boolean; message: string }>("/admin/festival-modules/reorder", { modules });
    return response.data;
};
