import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitInquiry } from '../../../services/api/contactService';

const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
};

export default function DeliveryContact() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await submitInquiry(form);
            setSuccess(true);
            setForm({ name: '', email: '', message: '' });
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0" />

            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]" />
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90">
                    <Icons.ChevronLeft size={20} />
                </button>
                <div className="ml-2 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Support</span>
                    <span className="font-black text-[12px] text-white tracking-wide mt-1">Contact Us</span>
                </div>
            </div>

            <div className="px-6 py-6 relative z-10">
                {/* Contact Info Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="village-card paper-texture organic-radius p-4 bg-white border-none shadow-sm flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#8B3D28]/10 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-village-umber uppercase tracking-widest">Email</p>
                            <p className="text-[9px] text-stone-400 font-bold">support@villagebasket.com</p>
                        </div>
                    </div>
                    <div className="village-card paper-texture organic-radius p-4 bg-white border-none shadow-sm flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#8B3D28]/10 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-village-umber uppercase tracking-widest">Phone</p>
                            <p className="text-[9px] text-stone-400 font-bold">+91 78299 03973</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="village-card paper-texture organic-radius bg-white border-none shadow-sm p-6">
                    <h3 className="text-[11px] font-black text-village-umber uppercase tracking-widest mb-5">Send a Message</h3>

                    {success ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-black text-village-umber uppercase tracking-widest">Message Sent!</p>
                            <p className="text-[10px] text-stone-400 font-bold text-center">We'll get back to you shortly.</p>
                            <button onClick={() => setSuccess(false)} className="text-[10px] text-[#8B3D28] font-black uppercase tracking-widest mt-1">
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-village-umber uppercase tracking-widest mb-1.5">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className="w-full text-xs px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#8B3D28]/40 focus:ring-2 focus:ring-[#8B3D28]/10 transition bg-stone-50/50 font-semibold text-village-umber placeholder:text-stone-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-village-umber uppercase tracking-widest mb-1.5">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="w-full text-xs px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#8B3D28]/40 focus:ring-2 focus:ring-[#8B3D28]/10 transition bg-stone-50/50 font-semibold text-village-umber placeholder:text-stone-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-village-umber uppercase tracking-widest mb-1.5">Message</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    rows={4}
                                    className="w-full text-xs px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-[#8B3D28]/40 focus:ring-2 focus:ring-[#8B3D28]/10 transition bg-stone-50/50 font-semibold text-village-umber placeholder:text-stone-300 resize-none"
                                />
                            </div>

                            {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-[#8B3D28] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#8B3D28]/20 active:scale-[0.98] transition disabled:opacity-60"
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center opacity-30">
                    <p className="text-[7px] font-black text-stone-400 uppercase tracking-[0.4em]">Village Basket Partners</p>
                </div>
            </div>
        </div>
    );
}
