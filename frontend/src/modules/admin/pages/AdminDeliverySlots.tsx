import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDeliverySlots,
  createDeliverySlot,
  updateDeliverySlot,
  toggleDeliverySlotStatus,
  deleteDeliverySlot,
  DeliverySlot,
} from '../../../services/api/admin/adminDeliverySlotService';

const TIME_SLOTS_PRESETS = [
  { name: 'Early Morning', startTime: '06:00', endTime: '09:00' },
  { name: 'Morning', startTime: '09:00', endTime: '12:00' },
  { name: 'Afternoon', startTime: '12:00', endTime: '15:00' },
  { name: 'Evening', startTime: '15:00', endTime: '18:00' },
  { name: 'Night', startTime: '19:00', endTime: '22:00' },
];

function to12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  const min = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `${hour}${min} ${period}`;
}

function getSlotIcon(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('morning') || n.includes('early')) return '🌅';
  if (n.includes('afternoon') || n.includes('noon')) return '☀️';
  if (n.includes('evening')) return '🌆';
  if (n.includes('night')) return '🌙';
  return '🕐';
}

const emptyForm = {
  name: '',
  startTime: '07:00',
  endTime: '10:00',
  maxOrders: 50,
};

export default function AdminDeliverySlots() {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await getDeliverySlots();
      if (res.success) setSlots(res.data);
    } catch {
      showToast('Failed to load slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const openCreate = () => {
    setEditingSlot(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (slot: DeliverySlot) => {
    setEditingSlot(slot);
    setForm({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxOrders: slot.maxOrders,
    });
    setShowModal(true);
  };

  const handlePreset = (preset: { name: string; startTime: string; endTime: string }) => {
    setForm(f => ({ ...f, name: preset.name, startTime: preset.startTime, endTime: preset.endTime }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.startTime || !form.endTime) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const label = `${to12h(form.startTime)} - ${to12h(form.endTime)}`;
      if (editingSlot) {
        const res = await updateDeliverySlot(editingSlot._id, { ...form, label });
        if (res.success) {
          showToast('Slot updated successfully');
          setShowModal(false);
          fetchSlots();
        }
      } else {
        const res = await createDeliverySlot({ ...form, label });
        if (res.success) {
          showToast('Slot created successfully');
          setShowModal(false);
          fetchSlots();
        }
      }
    } catch {
      showToast('Failed to save slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slot: DeliverySlot) => {
    try {
      const res = await toggleDeliverySlotStatus(slot._id, !slot.isActive);
      if (res.success) {
        setSlots(prev => prev.map(s => s._id === slot._id ? { ...s, isActive: !s.isActive } : s));
        showToast(res.message);
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteDeliverySlot(id);
      if (res.success) {
        setSlots(prev => prev.filter(s => s._id !== id));
        showToast('Slot deleted');
      }
    } catch {
      showToast('Failed to delete slot', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const activeCount = slots.filter(s => s.isActive).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-[#8B3D28] rounded-xl flex items-center justify-center text-white text-lg shadow">
                🕐
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#8B3D28] font-poppins">Delivery Time Slots</h1>
                <p className="text-sm text-neutral-500 font-medium">
                  Create and manage time windows for order delivery
                </p>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#8B3D28] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#722F1E] transition-all text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Slot
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Total Slots', value: slots.length, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: '📋' },
            { label: 'Active Slots', value: activeCount, color: 'bg-green-50 border-green-200 text-green-700', icon: '✅' },
            { label: 'Inactive Slots', value: slots.length - activeCount, color: 'bg-orange-50 border-orange-200 text-orange-700', icon: '⏸️' },
          ].map(stat => (
            <div key={stat.label} className={`border rounded-xl p-4 ${stat.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</span>
              </div>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#8B3D28] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-500 font-medium">Loading slots...</p>
          </div>
        </div>
      ) : slots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🕐</div>
          <h3 className="text-xl font-bold text-neutral-700 mb-2">No Delivery Slots Yet</h3>
          <p className="text-neutral-500 mb-6 text-sm">
            Create your first time slot so customers can choose their preferred delivery window.
          </p>
          <button
            onClick={openCreate}
            className="bg-[#8B3D28] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#722F1E] transition-all"
          >
            Create First Slot
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {slots.map((slot, idx) => (
              <motion.div
                key={slot._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all ${
                  slot.isActive ? 'border-[#8B3D28]/20' : 'border-neutral-200 opacity-70'
                }`}
              >
                {/* Top Stripe */}
                <div className={`h-2 w-full ${slot.isActive ? 'bg-gradient-to-r from-[#8B3D28] to-[#C4632A]' : 'bg-neutral-300'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
                        slot.isActive ? 'bg-[#8B3D28]/10' : 'bg-neutral-100'
                      }`}>
                        {getSlotIcon(slot.name)}
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900 text-base leading-tight">{slot.name || 'Unnamed Slot'}</h3>
                        <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          slot.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-neutral-400'}`} />
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className={`rounded-xl p-4 mb-4 text-center ${
                    slot.isActive ? 'bg-[#8B3D28]/5 border border-[#8B3D28]/10' : 'bg-neutral-50 border border-neutral-200'
                  }`}>
                    <p className={`text-2xl font-black tracking-tight ${slot.isActive ? 'text-[#8B3D28]' : 'text-neutral-400'}`}>
                      {to12h(slot.startTime)}
                    </p>
                    <div className="flex items-center justify-center gap-2 my-1">
                      <div className="h-px flex-1 bg-neutral-300" />
                      <span className="text-xs text-neutral-400 font-medium">to</span>
                      <div className="h-px flex-1 bg-neutral-300" />
                    </div>
                    <p className={`text-2xl font-black tracking-tight ${slot.isActive ? 'text-[#8B3D28]' : 'text-neutral-400'}`}>
                      {to12h(slot.endTime)}
                    </p>
                  </div>

                  {/* Max Orders */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Max <strong>{slot.maxOrders}</strong> orders/day</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(slot)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        slot.isActive
                          ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {slot.isActive ? '⏸ Deactivate' : '▶ Activate'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(slot)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    {confirmDeleteId === slot._id ? (
                      <button
                        onClick={() => handleDelete(slot._id)}
                        disabled={deletingId === slot._id}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-xs font-bold"
                      >
                        {deletingId === slot._id ? '...' : '✓'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(slot._id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {confirmDeleteId === slot._id && (
                    <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-red-700 font-medium">Confirm delete?</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-neutral-500 hover:text-neutral-700 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#8B3D28] to-[#C4632A] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {editingSlot ? 'Edit Delivery Slot' : 'Create Delivery Slot'}
                    </h2>
                    <p className="text-white/70 text-xs mt-0.5">
                      {editingSlot ? 'Update the time window details' : 'Set a new delivery time window'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Preset Quick-Select */}
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS_PRESETS.map(p => (
                      <button
                        key={p.name}
                        onClick={() => handlePreset(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          form.name === p.name && form.startTime === p.startTime
                            ? 'bg-[#8B3D28] text-white border-[#8B3D28]'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-[#8B3D28] hover:text-[#8B3D28]'
                        }`}
                      >
                        {getSlotIcon(p.name)} {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Slot Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Morning Slot, Evening Slot"
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28]/10 transition-all"
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28]/10 transition-all"
                    />
                    {form.startTime && (
                      <p className="text-[10px] text-[#8B3D28] font-bold mt-1">{to12h(form.startTime)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28]/10 transition-all"
                    />
                    {form.endTime && (
                      <p className="text-[10px] text-[#8B3D28] font-bold mt-1">{to12h(form.endTime)}</p>
                    )}
                  </div>
                </div>

                {/* Live Preview */}
                {form.startTime && form.endTime && form.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#8B3D28]/5 border border-[#8B3D28]/20 rounded-xl p-4 text-center"
                  >
                    <p className="text-xs text-neutral-500 font-medium mb-1">Preview</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{getSlotIcon(form.name)}</span>
                      <div>
                        <p className="font-black text-[#8B3D28]">{form.name}</p>
                        <p className="text-sm font-bold text-neutral-600">
                          {to12h(form.startTime)} – {to12h(form.endTime)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Max Orders */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Max Orders Per Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={form.maxOrders}
                    onChange={e => setForm(f => ({ ...f, maxOrders: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#8B3D28] focus:ring-2 focus:ring-[#8B3D28]/10 transition-all"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Maximum number of orders that can be placed in this time slot per day
                  </p>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.startTime || !form.endTime}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                    saving || !form.name.trim() || !form.startTime || !form.endTime
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#8B3D28] text-white hover:bg-[#722F1E] shadow-lg'
                  }`}
                >
                  {saving
                    ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    )
                    : editingSlot ? 'Update Slot' : 'Create Slot'
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
