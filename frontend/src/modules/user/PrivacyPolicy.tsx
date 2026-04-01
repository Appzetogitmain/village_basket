import { useNavigate } from 'react-router-dom';
import logo from '@assets/village_basket-removebg-preview.png';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-b from-teal-50 to-white pb-6 pt-4 sticky top-0 z-10 border-b border-neutral-100">
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
                        <h1 className="text-xl font-bold text-neutral-900">Privacy Policy</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-20 h-20 mb-4">
                            <img src={logo} alt="Village Basket" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-2xl font-black text-[#8B3D28] uppercase tracking-tighter">Privacy Policy</h2>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Last Updated: April 2024</p>
                    </div>

                    <div className="space-y-8 text-neutral-700 leading-relaxed text-sm md:text-base">
                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">1. Introduction</h3>
                            <p>
                                Welcome to Village Basket. We respect your privacy and are committed to protecting your personal data. 
                                This Privacy Policy will inform you as to how we look after your personal data when you visit our 
                                application and tell you about your privacy rights and how the law protects you.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">2. The Data We Collect</h3>
                            <p className="mb-4">
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped 
                                together as follows:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                                <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                                <li><strong>Profile Data:</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses.</li>
                                <li><strong>Usage Data:</strong> includes information about how you use our application and services.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">3. How We Use Your Data</h3>
                            <p className="mb-4">
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data 
                                in the following circumstances:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>To register you as a new customer.</li>
                                <li>To process and deliver your order.</li>
                                <li>To manage our relationship with you.</li>
                                <li>To enable you to partake in a prize draw, competition or complete a survey.</li>
                                <li>To improve our application, products/services, marketing, customer relationships and experiences.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">4. Data Security</h3>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                                used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal 
                                data to those employees, agents, contractors and other third parties who have a business need to know.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">5. Your Legal Rights</h3>
                            <p>
                                Under certain circumstances, you have rights under data protection laws in relation to your personal data, 
                                including the right to request access to your personal data, request correction of your personal data, 
                                request erasure of your personal data, object to processing of your personal data, request restriction 
                                of processing your personal data, and request the transfer of your personal data.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-black text-[#8B3D28] mb-3 uppercase tracking-tight">6. Contact Us</h3>
                            <p>
                                For any questions about this Privacy Policy, please contact us at:
                                <br />
                                <strong>Email:</strong> privacy@villagebasket.com
                                <br />
                                <strong>Address:</strong> India
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
