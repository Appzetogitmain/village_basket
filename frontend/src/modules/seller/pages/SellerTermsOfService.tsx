import { useNavigate } from 'react-router-dom';
import logo from '@assets/village_basket-removebg-preview.png';

export default function SellerTermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="pb-24 md:pb-8 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-[#8B3D28] pb-6 pt-4 sticky top-0 z-10 border-b border-[#723221] shadow-md">
                <div className="px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                            aria-label="Back"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-white">Seller Terms of Service</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col items-center mb-10 text-center border-b border-neutral-100 pb-8">
                        <div className="w-24 h-24 mb-4">
                            <img src={logo} alt="Village Basket" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-2xl font-black text-[#8B3D28] uppercase tracking-tighter">Seller Agreement</h2>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Effective Date: April 2024</p>
                    </div>

                    <div className="space-y-10 text-neutral-700 leading-relaxed text-sm md:text-base">
                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">01</span>
                                Enrollment & Platform Use
                            </h3>
                            <p>
                                By registering as a seller on Village Basket, you agree to provide accurate, current, and complete information. You are responsible for managing your shop dashboard, updating product availability, and maintaining the security of your account credentials.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">02</span>
                                Product Quality & Compliance
                            </h3>
                            <p className="mb-4">
                                Sellers are solely responsible for the quality, safety, and legality of the products they list. You represent and warrant that:
                            </p>
                            <ul className="list-disc pl-10 space-y-2">
                                <li>All products are fresh, authentic, and safe for consumption/use.</li>
                                <li>Product descriptions and prices are accurate and not misleading.</li>
                                <li>You comply with all local health, safety, and taxation regulations.</li>
                                <li>You will not list prohibited or illegal items.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">03</span>
                                Commission & Fees
                            </h3>
                            <p>
                                Village Basket charges a commission fee for every successful order fulfilled through the platform. The standard commission rate is 10% (unless otherwise agreed in writing). This fee is deducted automatically from the order total before disbursement to the seller's wallet.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">04</span>
                                Payouts & Withdrawals
                            </h3>
                            <p>
                                Earnings from completed orders are credited to your Seller Wallet. You may request a withdrawal once your balance reaches the minimum threshold. Payouts are processed within 3-5 business days directly to your registered bank account after admin approval.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">05</span>
                                Shipping & Logistics
                            </h3>
                            <p>
                                Delivery is facilitated by Village Basket delivery partners. Sellers must ensure that orders are packed and marked "Ready for Pickup" within the stipulated timeframe to maintain platform performance standards and delivery speed (17-20 mins aim).
                            </p>
                        </section>

                        <section className="bg-[#FAF7F2] p-6 rounded-xl border border-neutral-100">
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">Support & Contact</h3>
                            <p>
                                If you have any questions regarding these terms, please contact the Village Basket Admin Support team through your seller dashboard help section.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
