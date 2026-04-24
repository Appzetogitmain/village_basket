import { useState, useEffect } from "react";
import {
    getFestivalModules,
    createFestivalModule,
    updateFestivalModule,
    deleteFestivalModule,
    reorderFestivalModules,
    type FestivalModule,
    type FestivalModuleFormData,
} from "../../../services/api/admin/adminFestivalModuleService";
import { getCategories, type Category } from "../../../services/api/categoryService";
import { getHeaderCategoriesAdmin, type HeaderCategory } from "../../../services/api/headerCategoryService";
import { uploadImage } from "../../../services/api/uploadService";
import { useMemo } from "react";

export default function AdminFestivalModule() {
    // General Form state
    const [name, setName] = useState("");
    const [festivalTitle, setFestivalTitle] = useState("");
    const [festivalSubtitle, setFestivalSubtitle] = useState("");
    const [headerGraphic, setHeaderGraphic] = useState("");
    const [desktopHeaderGraphic, setDesktopHeaderGraphic] = useState("");
    const [backgroundColor, setBackgroundColor] = useState("#FFF9F0");
    const [backgroundImage, setBackgroundImage] = useState("");
    const [textColor, setTextColor] = useState("#8B3D28");
    const [labelColor, setLabelColor] = useState("#8B3D28");
    const [layoutStyle, setLayoutStyle] = useState<"grid" | "horizontal">("grid");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [order, setOrder] = useState<number | undefined>(undefined);

    // Category Tiles state (exactly 4)
    const [tiles, setTiles] = useState<Array<{ image: string; label: string; categoryId: string; subCategoryId: string }>>([
        { image: "", label: "", categoryId: "", subCategoryId: "" },
        { image: "", label: "", categoryId: "", subCategoryId: "" },
        { image: "", label: "", categoryId: "", subCategoryId: "" },
        { image: "", label: "", categoryId: "", subCategoryId: "" },
    ]);

    // Data state
    const [modules, setModules] = useState<FestivalModule[]>([]);
    const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState<number | null>(null);
    const [uploadingHeader, setUploadingHeader] = useState(false);
    const [uploadingDesktopHeader, setUploadingDesktopHeader] = useState(false);
    const [uploadingBg, setUploadingBg] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        fetchModules();
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [catRes, headerRes] = await Promise.all([
                getCategories(),
                getHeaderCategoriesAdmin()
            ]);

            if (catRes.success) setCategories(catRes.data);
            if (Array.isArray(headerRes)) setHeaderCategories(headerRes);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const fetchModules = async () => {
        try {
            setLoadingData(true);
            const response = await getFestivalModules();
            if (response.success) setModules(response.data);
        } catch (err) {
            console.error("Error fetching modules:", err);
            setError("Failed to load festival modules");
        } finally {
            setLoadingData(false);
        }
    };

    const handleTileChange = (index: number, field: string, value: string) => {
        setTiles(prev => {
            const newTiles = [...prev];
            newTiles[index] = { ...newTiles[index], [field]: value };
            return newTiles;
        });
    };

    // Helper to compress image before upload
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onerror = () => reject(new Error("Failed to load image"));
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const isPng = file.type === 'image/png';
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: isPng ? 'image/png' : 'image/jpeg', lastModified: Date.now() }));
                        } else {
                            resolve(file);
                        }
                    }, isPng ? 'image/png' : 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number | 'header' | 'desktopHeader' | 'background') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        if (index === 'header') setHeaderGraphic(localUrl);
        else if (index === 'desktopHeader') setDesktopHeaderGraphic(localUrl);
        else if (index === 'background') setBackgroundImage(localUrl);
        else {
            setTiles(prev => {
                const newTiles = [...prev];
                newTiles[index as number] = { ...newTiles[index as number], image: localUrl };
                return newTiles;
            });
        }

        try {
            setError("");
            if (index === 'header') setUploadingHeader(true);
            else if (index === 'desktopHeader') setUploadingDesktopHeader(true);
            else if (index === 'background') setUploadingBg(true);
            else setUploading(index as number);

            // Compress before sending
            const compressedFile = await compressImage(file);
            const response = await uploadImage(compressedFile);

            if (response && response.url) {
                if (index === 'header') setHeaderGraphic(response.url);
                else if (index === 'desktopHeader') setDesktopHeaderGraphic(response.url);
                else if (index === 'background') setBackgroundImage(response.url);
                else {
                    setTiles(prev => {
                        const newTiles = [...prev];
                        newTiles[index as number] = { ...newTiles[index as number], image: response.url };
                        return newTiles;
                    });
                }
            } else {
                throw new Error("Server did not return a URL");
            }
        } catch (err: any) {
            console.error("Upload Error:", err);
            setError(`Failed to sync image: ${err.message || "Network error"}`);
            // REVERT on failure so we don't have a stuck blob
            if (index === 'header') setHeaderGraphic("");
            else if (index === 'desktopHeader') setDesktopHeaderGraphic("");
            else if (index === 'background') setBackgroundImage("");
            else {
                setTiles(prev => {
                    const newTiles = [...prev];
                    newTiles[index as number] = { ...newTiles[index as number], image: "" };
                    return newTiles;
                });
            }
        } finally {
            setUploading(null);
            setUploadingHeader(false);
            setUploadingDesktopHeader(false);
            setUploadingBg(false);
        }
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        // Validation
        if (!name.trim() || !festivalTitle.trim() || !startDate || !endDate) {
            setError("Please fill in all required fields");
            return;
        }

        const emptyTile = tiles.some(t => !t.image || !t.categoryId);
        if (emptyTile) {
            setError("Each of the 4 tiles must have an image and a category");
            return;
        }

        // Check for temporary blob URLs that haven't finished uploading
        const hasBlob = tiles.some(t => t.image.startsWith('blob:')) || headerGraphic.startsWith('blob:') || desktopHeaderGraphic.startsWith('blob:') || backgroundImage.startsWith('blob:');
        if (hasBlob) {
            setError("Please wait for all images to finish uploading before saving.");
            return;
        }

        const formData: FestivalModuleFormData = {
            name: name.trim(),
            festivalTitle: festivalTitle.trim(),
            festivalSubtitle: festivalSubtitle.trim(),
            headerGraphic,
            desktopHeaderGraphic,
            backgroundColor,
            backgroundImage,
            textColor,
            labelColor,
            layoutStyle,
            headerCategorySlug: "all",
            startDate,
            endDate,
            isActive,
            order,
            categoryTiles: tiles.map(t => ({
                image: t.image,
                label: t.label.trim(),
                categoryId: t.categoryId,
                subCategoryId: t.subCategoryId || undefined
            }))
        };

        try {
            setLoading(true);
            if (editingId) {
                const response = await updateFestivalModule(editingId, formData);
                if (response.success) {
                    setSuccess("Module updated successfully");
                    resetForm();
                    fetchModules();
                }
            } else {
                const response = await createFestivalModule(formData);
                if (response.success) {
                    setSuccess("Module created successfully");
                    resetForm();
                    fetchModules();
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save festival module");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (module: FestivalModule) => {
        setName(module.name);
        setFestivalTitle(module.festivalTitle);
        setFestivalSubtitle(module.festivalSubtitle || "");
        setHeaderGraphic(module.headerGraphic || "");
        setDesktopHeaderGraphic(module.desktopHeaderGraphic || "");
        setBackgroundColor(module.backgroundColor || "#FFF9F0");
        setBackgroundImage(module.backgroundImage || "");
        setTextColor(module.textColor || "#8B3D28");
        setLabelColor(module.labelColor || "#8B3D28");
        setLayoutStyle(module.layoutStyle);
        setStartDate(new Date(module.startDate).toISOString().slice(0, 16));
        setEndDate(new Date(module.endDate).toISOString().slice(0, 16));
        setIsActive(module.isActive);
        setOrder(module.order);
        setTiles(module.categoryTiles.map(t => ({
            image: t.image,
            label: t.label || "",
            categoryId: typeof t.categoryId === 'string' ? t.categoryId : t.categoryId._id,
            subCategoryId: t.subCategoryId ? (typeof t.subCategoryId === 'string' ? t.subCategoryId : t.subCategoryId._id) : ""
        })));
        setEditingId(module._id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this festival module?")) return;
        try {
            const response = await deleteFestivalModule(id);
            if (response.success) {
                setSuccess("Module deleted successfully");
                fetchModules();
            }
        } catch (err) {
            setError("Failed to delete module");
        }
    };

    const resetForm = () => {
        setName("");
        setFestivalTitle("");
        setFestivalSubtitle("");
        setHeaderGraphic("");
        setDesktopHeaderGraphic("");
        setBackgroundColor("#FFF9F0");
        setBackgroundImage("");
        setTextColor("#8B3D28");
        setLabelColor("#8B3D28");
        setLayoutStyle("grid");
        setStartDate("");
        setEndDate("");
        setIsActive(true);
        setOrder(undefined);
        setTiles([
            { image: "", label: "", categoryId: "", subCategoryId: "" },
            { image: "", label: "", categoryId: "", subCategoryId: "" },
            { image: "", label: "", categoryId: "", subCategoryId: "" },
            { image: "", label: "", categoryId: "", subCategoryId: "" },
        ]);
        setEditingId(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-neutral-800">Festival Category Modules</h1>
                <div className="text-sm text-neutral-500">Home / Festival Modules</div>
            </div>

            {(success || error) && (
                <div className={`${success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded mb-6`}>
                    {success || error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left: Form */}
                <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-neutral-200 p-6 overflow-y-auto">
                    <h2 className="text-lg font-bold text-neutral-800 mb-6">{editingId ? 'Edit Module' : 'Create New Module'}</h2>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2">Internal name *</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Diwali 2025" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B3D28] outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-2">Festival title *</label>
                            <input type="text" value={festivalTitle} onChange={e => setFestivalTitle(e.target.value)} placeholder="e.g., Happy Diwali Specials" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B3D28] outline-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-2">Festival subtitle</label>
                            <input type="text" value={festivalSubtitle} onChange={e => setFestivalSubtitle(e.target.value)} placeholder="e.g., Light up your home with essentials" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B3D28] outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2 flex items-center gap-2">
                                    <span>Header (mobile)</span>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveTooltip(activeTooltip === 'mobileHeader' ? null : 'mobileHeader')}
                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold transition-colors ${activeTooltip === 'mobileHeader' ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-neutral-300 text-neutral-400'}`}
                                        >i</button>
                                        {activeTooltip === 'mobileHeader' && (
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-32 p-2 bg-neutral-800 text-white text-[9px] font-medium rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-bottom-1">
                                                Ideal choice: 800x800 (1:1 aspect ratio)
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border shadow-sm flex-shrink-0">
                                        {headerGraphic ? <img src={headerGraphic} className="w-full h-full object-contain" /> : <div className="text-[10px] text-neutral-300">NO IMG</div>}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" id="header-upload" onChange={e => handleImageUpload(e, 'header')} className="hidden" />
                                        <label htmlFor="header-upload" className="cursor-pointer text-[10px] font-bold text-orange-600 hover:text-orange-700">
                                            {uploadingHeader ? 'Uploading...' : headerGraphic ? 'Change' : 'Upload'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2 flex items-center gap-2">
                                    <span>Header (desktop)</span>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveTooltip(activeTooltip === 'desktopHeader' ? null : 'desktopHeader')}
                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold transition-colors ${activeTooltip === 'desktopHeader' ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-neutral-300 text-neutral-400'}`}
                                        >i</button>
                                        {activeTooltip === 'desktopHeader' && (
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-32 p-2 bg-neutral-800 text-white text-[9px] font-medium rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-bottom-1">
                                                Ideal choice: 2048x700 (Cinema aspect)
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border shadow-sm flex-shrink-0">
                                        {desktopHeaderGraphic ? <img src={desktopHeaderGraphic} className="w-full h-full object-contain" /> : <div className="text-[10px] text-neutral-300 font-bold">WIDE</div>}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" id="desktop-header-upload" onChange={e => handleImageUpload(e, 'desktopHeader')} className="hidden" />
                                        <label htmlFor="desktop-header-upload" className="cursor-pointer text-[10px] font-bold text-orange-600 hover:text-orange-700">
                                            {uploadingDesktopHeader ? 'Uploading...' : desktopHeaderGraphic ? 'Change' : 'Upload'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2">Bg color</label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                    <div className="flex-1">
                                        <input type="text" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-full text-[10px] font-mono bg-transparent outline-none uppercase" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2 flex items-center gap-2">
                                    <span>Bg image</span>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveTooltip(activeTooltip === 'bgImage' ? null : 'bgImage')}
                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold transition-colors ${activeTooltip === 'bgImage' ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-neutral-300 text-neutral-400'}`}
                                        >i</button>
                                        {activeTooltip === 'bgImage' && (
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-32 p-2 bg-neutral-800 text-white text-[9px] font-medium rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-bottom-1">
                                                Ideal choice: 1920x1080 (Full bleed)
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <div className="relative w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border shadow-sm flex-shrink-0">
                                        {backgroundImage ? (
                                            <>
                                                <img src={backgroundImage} className={`w-full h-full object-cover ${uploadingBg ? 'opacity-40' : 'opacity-100'}`} />
                                                {uploadingBg && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-500/10">
                                                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-[10px] text-neutral-300 font-bold">NONE</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            id="bg-upload-input" 
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, 'background')} 
                                            className="hidden" 
                                        />
                                        <label htmlFor="bg-upload-input" className="cursor-pointer text-[10px] font-bold text-orange-600 hover:text-orange-700">
                                            {uploadingBg ? 'Syncing...' : backgroundImage ? 'Change Image' : 'Upload Image'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2">Subtitle color</label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                    <div className="flex-1">
                                        <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full text-[10px] font-mono bg-transparent outline-none uppercase" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-500 mb-2">Category label color</label>
                                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <input type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                    <div className="flex-1">
                                        <input type="text" value={labelColor} onChange={e => setLabelColor(e.target.value)} className="w-full text-[10px] font-mono bg-transparent outline-none uppercase" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2">Start date *</label>
                                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2">End date *</label>
                                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" />
                            </div>
                        </div>

                        {/* Category Tiles Grid */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 mb-4">Category tiles (exactly 4)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tiles.map((tile, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border transition-all ${(!tile.image || !tile.categoryId) && error ? 'bg-red-50 border-red-300' : 'bg-neutral-50 border-neutral-200'} space-y-3`}>
                                        <div className="flex justify-between items-center">
                                            <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-2">
                                                TILE {idx + 1}
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => setActiveTooltip(activeTooltip === `tile-${idx}` ? null : `tile-${idx}`)}
                                                        className={`w-3 h-3 rounded-full border flex items-center justify-center text-[7px] font-bold transition-colors ${activeTooltip === `tile-${idx}` ? 'border-orange-400 text-orange-400 bg-orange-50' : 'border-neutral-200 text-neutral-300'}`}
                                                    >i</button>
                                                    {activeTooltip === `tile-${idx}` && (
                                                        <div className="absolute left-0 bottom-full mb-2 w-24 p-1.5 bg-neutral-800 text-white text-[8px] font-medium rounded shadow-xl z-50 text-center animate-in fade-in slide-in-from-bottom-1">
                                                            Ideal choice: 400x400
                                                            <div className="absolute top-full left-2 border-4 border-transparent border-t-neutral-800"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {(!tile.image || !tile.categoryId) && error && <span className="text-[10px] font-bold text-red-500">MISSING INFO</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`relative w-14 h-14 bg-white border rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 transition-all ${(!tile.image && error) ? 'border-red-400 ring-2 ring-red-100' : 'border-neutral-200'}`}>
                                                {tile.image ? (
                                                    <>
                                                        <img src={tile.image} className={`w-full h-full object-contain transition-opacity ${uploading === idx ? 'opacity-30' : 'opacity-100'}`} />
                                                        {uploading === idx && (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-500/10">
                                                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                                                                <span className="text-[7px] font-black text-orange-600 uppercase">Syncing</span>
                                                            </div>
                                                        )}
                                                        {tile.image.startsWith('blob:') && uploading !== idx && (
                                                            <div className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-bl-lg">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-20">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input type="file" id={`file-${idx}`} onChange={e => handleImageUpload(e, idx)} className="hidden" />
                                                <label htmlFor={`file-${idx}`} className="cursor-pointer inline-block px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[10px] font-bold text-neutral-600 transition-colors">
                                                    {tile.image ? 'Change Image' : 'Choose Image'}
                                                </label>
                                                {tile.image.startsWith('blob:') && <div className="text-[8px] text-red-500 font-bold mt-1 uppercase animate-pulse">Waiting for server sync...</div>}
                                            </div>
                                        </div>
                                        <input type="text" value={tile.label} onChange={e => handleTileChange(idx, 'label', e.target.value)} placeholder="Display Label" className="w-full px-2 py-1 text-sm border rounded outline-none" />
                                        <select 
                                            value={tile.categoryId} 
                                            onChange={e => handleTileChange(idx, 'categoryId', e.target.value)} 
                                            className={`w-full px-2 py-1 text-sm border rounded outline-none ${!tile.categoryId && error ? 'border-red-400 bg-red-50' : ''}`}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-[#8B3D28]" />
                                <span className="text-sm font-medium">Active</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Layout:</span>
                                <select value={layoutStyle} onChange={e => setLayoutStyle(e.target.value as any)} className="px-2 py-1 border rounded outline-none text-sm">
                                    <option value="grid">Grid (2x2)</option>
                                    <option value="horizontal">Horizontal Row</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <button 
                                onClick={handleSubmit} 
                                disabled={loading || uploading !== null || uploadingHeader || uploadingDesktopHeader || uploadingBg} 
                                className="flex-1 bg-[#8B3D28] text-white py-2 rounded-lg font-bold hover:bg-orange-900 transition-colors disabled:bg-neutral-300"
                            >
                                {loading ? 'Saving...' : (uploading !== null || uploadingHeader || uploadingDesktopHeader || uploadingBg) ? 'Uploading Images...' : editingId ? 'Update Module' : 'Create Module'}
                            </button>
                            {editingId && <button onClick={resetForm} className="px-6 py-2 bg-neutral-200 rounded-lg font-bold">Cancel</button>}
                        </div>
                    </div>
                </div>

                {/* Right: Table */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-neutral-800 text-white font-bold text-sm">Active & Scheduled Modules</div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-neutral-50 border-b">
                                    <th className="p-4 font-bold text-neutral-600">Name</th>
                                    <th className="p-4 font-bold text-neutral-600">Tab</th>
                                    <th className="p-4 font-bold text-neutral-600">Schedule</th>
                                    <th className="p-4 font-bold text-neutral-600">Status</th>
                                    <th className="p-4 font-bold text-neutral-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr><td colSpan={5} className="p-10 text-center text-neutral-400 italic">Loading modules...</td></tr>
                                ) : modules.length === 0 ? (
                                    <tr><td colSpan={5} className="p-10 text-center text-neutral-400 italic">No modules found.</td></tr>
                                ) : (
                                    modules.map(m => (
                                        <tr key={m._id} className="border-b hover:bg-neutral-50">
                                            <td className="p-4 font-bold text-neutral-800">{m.name}</td>
                                            <td className="p-4"><span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-bold uppercase">{m.headerCategorySlug}</span></td>
                                            <td className="p-4 text-xs text-neutral-500">
                                                {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                                    {m.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => handleEdit(m)} className="text-blue-600 hover:underline">Edit</button>
                                                <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
