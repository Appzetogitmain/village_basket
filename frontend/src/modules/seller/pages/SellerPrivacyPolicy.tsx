import { useNavigate } from 'react-router-dom';
import logo from '@assets/village_basket-removebg-preview.png';

export default function SellerPrivacyPolicy() {
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
                        <h1 className="text-xl font-bold text-white">Seller Privacy Policy</h1>
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
                        <h2 className="text-2xl font-black text-[#8B3D28] uppercase tracking-tighter">Privacy for Partners</h2>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Last Updated: April 2024</p>
                    </div>

                    <div className="space-y-10 text-neutral-700 leading-relaxed text-sm md:text-base">
                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">01</span>
                                Information We Collect
                            </h3>
                            <p className="mb-4">
                                To facilitate your business on the Village Basket platform, we collect the following types of information:
                            </p>
                            <ul className="list-disc pl-10 space-y-2">
                                <li><strong>Business Identity:</strong> Store name, registered email, mobile number, and seller name.</li>
                                <li><strong>Financial Information:</strong> Bank account details, Tax ID (GST/PAN), and transaction history for payouts.</li>
                                <li><strong>Location Data:</strong> Store coordinates and address to calculate delivery serviceability.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">02</span>
                                How We Use Your Data
                            </h3>
                            <p className="mb-4">
                                Your information is used strictly to:
                            </p>
                            <ul className="list-disc pl-10 space-y-2">
                                <li>Process orders and facilitate delivery logistics.</li>
                                <li>Calculate and disburse earnings into your bank account.</li>
                                <li>Comply with statutory tax regulations and audits.</li>
                                <li>Communicate platform updates and security alerts.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">03</span>
                                Data Sharing & Security
                            </h3>
                            <p>
                                We share relevant store information (Store Name, Address) with customers to facilitate transparency. Your sensitive financial data (Bank details, Tax IDs) is encrypted and never shared with customers or third parties, except for banking partners during payment processing.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#A54B31] mb-3 uppercase tracking-tight flex items-center gap-2">
                                <span className="bg-[#FAF7F2] text-[#8B3D28] w-8 h-8 rounded-full flex items-center justify-center text-xs">04</span>
                                Retention & Deletion
                            </h3>
                            <p>
                                We retain your records as long as your shop remains active. If you choose to close your account, we will archive necessary tax and financial records for a period required by law (usually 7 years) and permanently delete other operational data.
                            </p>
                        </section>

                        <section className="bg-[#FAF7F2] p-6 rounded-xl border border-neutral-100">
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">Privacy Inquiries</h3>
                            <p>
                                If you have concerns about your data security or want to request an export of your stored information, please email our privacy officer at privacy@villagebasket.com.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
