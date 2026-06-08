import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';

const ExtendDeadlineModal = ({ isOpen, onClose, onConfirm, currentDeadline, duration }) => {
    const [newDeadline, setNewDeadline] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && currentDeadline) {
            // Default to current time + duration + 10 minutes buffer
            const base = new Date() > new Date(currentDeadline) ? new Date() : new Date(currentDeadline);
            const buffer = 15; // 15 mins extra buffer
            const defaultDate = new Date(base.getTime() + (parseInt(duration) || 30) * 60000 + buffer * 60000);
            setNewDeadline(defaultDate.toISOString().slice(0, 16));
        }
    }, [isOpen, currentDeadline, duration]);

    useEffect(() => {
        if (newDeadline) {
            const selected = new Date(newDeadline).getTime();
            const minRequired = Date.now() + (parseInt(duration) || 30) * 60000;
            
            if (selected < minRequired) {
                setError(`Warning: This extension might be too short. Candidates need at least ${duration} minutes to complete the interview.`);
            } else {
                setError('');
            }
        }
    }, [newDeadline, duration]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="w-5 h-5" />
                        <h3 className="font-bold text-lg text-gray-900">Extend Interview</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
                            <Calendar className="w-4 h-4" />
                            Current Expiry
                        </div>
                        <p className="text-blue-900 font-semibold">
                            {new Date(currentDeadline).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Set New Expiry Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                                error ? 'border-amber-400 focus:ring-amber-500 bg-amber-50' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        {error ? (
                            <p className="mt-2 text-xs text-amber-700 font-medium animate-pulse">
                                ⚠️ {error}
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-gray-500 italic">
                                Pick a time in the future to reactivate the interview.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (newDeadline) {
                                onConfirm(newDeadline);
                                onClose();
                            }
                        }}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all"
                    >
                        Confirm Extension
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtendDeadlineModal;
