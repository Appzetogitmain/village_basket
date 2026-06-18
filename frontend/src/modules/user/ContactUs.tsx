import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitInquiry } from '../../services/api/contactService';

export default function ContactUs() {
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
        <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-b from-teal-50 to-white pb-6 pt-4 sticky top-0 z-10 border-b border-neutral-100">
                <div className="px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-neutral-900" aria-label="Back">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-neutral-900">Contact Us</h1>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
                {/* Intro */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">Get In Touch</h2>
                    <p className="text-sm text-neutral-500">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-700">Email</p>
                            <p className="text-xs text-neutral-500">support@villagebasket.com</p>
                        </div>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-700">Phone</p>
                            <p className="text-xs text-neutral-500">+91 78299 03973</p>
                        </div>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-700">Hours</p>
                            <p className="text-xs text-neutral-500">Mon–Sat, 9am–6pm</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-neutral-900 mb-4">Send a Message</h3>

                    {success ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="text-base font-semibold text-neutral-900">Message Sent!</p>
                            <p className="text-sm text-neutral-500 text-center">Thanks for reaching out. We'll get back to you shortly.</p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="mt-2 text-sm text-teal-600 font-semibold"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">Message</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    rows={4}
                                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition resize-none"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 active:scale-95 transition disabled:opacity-60"
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
