import { useNavigate } from 'react-router-dom';
import logo from '@assets/village_basket-removebg-preview.png';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-b from-orange-50 to-white pb-6 pt-4 sticky top-0 z-10 border-b border-neutral-100">
                <div className="px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-neutral-900"
                            aria-label="Back"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-neutral-900">Terms of Service</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-20 h-20 mb-4">
                            <img src={logo} alt="Village Basket" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-2xl font-black text-[#8B3D28] uppercase tracking-tighter">Terms & Conditions</h2>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Last Updated: April 2024</p>
                    </div>

                    <div className="space-y-8 text-neutral-700 leading-relaxed text-sm md:text-base">
                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">1. Agreement to Terms</h3>
                            <p>
                                By accessing or using Village Basket's website and application, you agree to be bound by these Terms of Service. 
                                If you do not agree with any part of these terms, you are prohibited from using our services.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">2. User Accounts</h3>
                            <p className="mb-4">
                                You are responsible for:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Maintaining the confidentiality of your account and password.</li>
                                <li>Restricting access to your computer/mobile device.</li>
                                <li>Accepting responsibility for all activities that occur under your account.</li>
                                <li>Ensuring all information provided is accurate and up-to-date.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">3. Ordering & Fulfillment</h3>
                            <p className="mb-4">
                                Our services connect you with sellers. When you place an order:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You represent that you are legally capable of entering into binding contracts.</li>
                                <li>Orders are subject to acceptance and availability.</li>
                                <li>Price and delivery availability are subject to change without notice.</li>
                                <li>Delivery times are estimated and not guaranteed, though we aim for 17-20 minute fulfillment.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">4. Restrictions of Use</h3>
                            <p className="mb-4">
                                You agree not to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Use the service for any illegal purposes.</li>
                                <li>Attempt to gain unauthorised access to our systems.</li>
                                <li>Reproduce, duplicate, or copy any part of our service.</li>
                                <li>Engage in any conduct that restricts or inhibits anyone else's use of our service.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">5. Limitation of Liability</h3>
                            <p>
                                Village Basket shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                                resulting from your access to or use of or inability to access or use the service.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">6. Changes to Terms</h3>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                                We will provide notice for any material changes. By continuing to access or use our service after 
                                those revisions become effective, you agree to be bound by the revised terms.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">7. Governing Law</h3>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of India, 
                                without regard to its conflict of law provisions.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
