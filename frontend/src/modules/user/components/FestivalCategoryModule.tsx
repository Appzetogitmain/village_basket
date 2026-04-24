import { useNavigate } from "react-router-dom";

interface CategoryTile {
    image: string;
    label?: string;
    categoryId: string;
    categorySlug: string;
    subCategoryId?: string;
    subCategorySlug?: string;
}

interface FestivalModuleProps {
    module: {
        festivalTitle: string;
        festivalSubtitle?: string;
        headerGraphic?: string;
        desktopHeaderGraphic?: string;
        backgroundColor?: string;
        backgroundImage?: string;
        textColor?: string;
        labelColor?: string;
        layoutStyle: "grid" | "horizontal";
        categoryTiles: CategoryTile[];
    };
}

export default function FestivalCategoryModule({ module }: FestivalModuleProps) {
    const navigate = useNavigate();

    if (!module || !module.categoryTiles || module.categoryTiles.length === 0) return null;

    const handleTileClick = (tile: CategoryTile) => {
        if (tile.subCategorySlug || tile.subCategoryId) {
            navigate(`/category/${tile.subCategorySlug || tile.subCategoryId}`);
        } else {
            navigate(`/category/${tile.categorySlug || tile.categoryId}`);
        }
    };

    return (
        <div className="md:px-4 lg:px-6 py-4 md:py-8 mb-6 relative overflow-hidden">
            {/* Background Festive Decoration - Subtle */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-yellow-500 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-orange-500 blur-3xl"></div>
            </div>

            {/* Main Container with Festive Card Style - Edge to edge on mobile */}
            <div 
                className={`relative z-10 md:organic-radius md:shadow-xl md:border md:border-orange-100/50 pt-0 pb-6 md:p-0 md:max-w-4xl mx-auto overflow-hidden ${!module.backgroundImage ? 'paper-texture' : ''}`}
                style={{ 
                    backgroundColor: module.backgroundColor || '#FFF9F0',
                    backgroundImage: module.backgroundImage ? `url(${module.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-4 md:mb-6">
                    {module.headerGraphic ? (
                        <div className="w-full mb-4 md:mb-3">
                            <picture>
                                {module.desktopHeaderGraphic && (
                                    <source media="(min-width: 768px)" srcSet={module.desktopHeaderGraphic} />
                                )}
                                <img 
                                    src={module.headerGraphic} 
                                    alt={module.festivalTitle} 
                                    className="w-full h-auto md:drop-shadow-lg" 
                                />
                            </picture>
                        </div>
                    ) : (
                        <div className="mb-4">
                           <div className="flex items-center gap-2 mb-1 justify-center">
                                <div className="w-8 h-[2px] bg-orange-300"></div>
                                <span className="text-orange-500">✨</span>
                                <div className="w-8 h-[2px] bg-orange-300"></div>
                           </div>
                           <h2 className="text-3xl md:text-5xl font-black text-[#8B3D28] tracking-tighter drop-shadow-sm font-poppins">
                                {module.festivalTitle}
                           </h2>
                        </div>
                    )}
                    
                    {module.festivalSubtitle && (
                        <p 
                            className="text-sm md:text-lg lg:text-xl font-medium max-w-xs md:max-w-2xl italic font-poppins px-4"
                            style={{ color: module.textColor || '#8B3D28' }}
                        >
                            {module.festivalSubtitle}
                        </p>
                    )}

                    {/* Decorative Divider */}
                    <div className="mt-4 flex items-center gap-3 opacity-30">
                        <div className="w-12 h-[1px] bg-[#8B3D28]"></div>
                        <div className="w-2 h-2 rotate-45 border border-[#8B3D28]"></div>
                        <div className="w-12 h-[1px] bg-[#8B3D28]"></div>
                    </div>
                </div>

                {/* Categories Layout - 4 in a row on mobile, spacious horizontal row on desktop */}
                {module.layoutStyle === "grid" ? (
                    <div className="grid grid-cols-4 gap-2 md:gap-5 lg:gap-6 px-2 md:px-8 md:max-w-2xl mx-auto pb-8">
                        {module.categoryTiles.slice(0, 4).map((tile, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all duration-300"
                                style={{
                                    animation: `festiveFloat 3.5s ease-in-out infinite`,
                                    animationDelay: `${idx * 0.25}s`
                                }}
                                onClick={() => handleTileClick(tile)}
                            >
                                <div className="relative aspect-square w-full md:max-w-[130px] bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-orange-50/50 p-1 md:p-2 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                                    {/* Arch Overlay for Festive Look */}
                                    <div 
                                        className="absolute inset-0 border-[4px] md:border-[8px] rounded-2xl md:rounded-3xl pointer-events-none z-10"
                                        style={{ borderColor: module.backgroundColor || '#FFF9F0' }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-orange-50/20 to-transparent pointer-events-none z-0"></div>
                                    
                                    <img 
                                        src={tile.image} 
                                        alt={tile.label || "Category"} 
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-sm"
                                    />
                                </div>
                                {tile.label && (
                                    <span 
                                        className="mt-2 text-[11px] md:text-sm font-bold group-hover:text-village-red transition-colors text-center px-0.5 line-clamp-1 uppercase tracking-tight"
                                        style={{ color: module.labelColor || '#8B3D28' }}
                                    >
                                        {tile.label}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x px-4 md:px-0">
                        {module.categoryTiles.slice(0, 4).map((tile, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleTileClick(tile)}
                                className="flex-shrink-0 w-36 md:w-36 group cursor-pointer snap-start"
                            >
                                <div className="relative aspect-square bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-orange-50/50 p-1 md:p-2 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                                    <div className="absolute inset-0 border-[6px] md:border-[8px] border-[#FFF9F0] rounded-2xl md:rounded-3xl pointer-events-none z-10"></div>
                                    <img 
                                        src={tile.image} 
                                        alt={tile.label || "Category"} 
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                </div>
                                {tile.label && (
                                    <span className="mt-3 block text-center text-xs md:text-sm font-bold text-[#8B3D28] group-hover:text-village-red transition-colors">
                                        {tile.label}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Removed View All button per user request */}
            </div>

            {/* Animation CSS */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
            {/* Custom Animations for Festive Feel */}
            <style>
                {`
                    @keyframes festiveFloat {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-8px); }
                    }
                `}
            </style>
        </div>
    );
}
