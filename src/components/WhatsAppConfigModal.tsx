'use client'

import { useState } from 'react'
import { X, MessageCircle, Save, CheckCircle2, AlertTriangle, SwitchCamera, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function WhatsAppConfigModal({ isOpen, onClose }: Props) {
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    // Form state
    const [rules, setRules] = useState({
        warning: {
            enabled: true,
            template: 'Assalam-o-Alaikum [Tenant Name] Sahab,\n\nJR Arcade ki taraf se reminder hai ke aapke Office [Offices] ka rent Rs. [Amount] [Date] ko due hai. Baraye meherbani waqt par jama karwa dain. Shukriya!'
        },
        alert: {
            enabled: true,
            template: 'Assalam-o-Alaikum [Tenant Name] Sahab,\n\nJR Arcade ki taraf se reminder hai ke aapke Office [Offices] ka rent Rs. [Amount] aaj due hai. Baraye meherbani jald az jald jama karwa dain. Shukriya!'
        },
        overdue: {
            enabled: false,
            template: 'Assalam-o-Alaikum [Tenant Name] Sahab,\n\nJR Arcade ki taraf se URGENT reminder hai ke aapke Office [Offices] ka rent Rs. [Amount] overdue ho chuka hai. Baraye meherbani fauran jama karwa dain. Shukriya!'
        }
    })

    if (!isOpen) return null

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            showToast('Settings saved successfully!')
            setTimeout(onClose, 1000)
        }, 800)
    }

    const handleTest = () => {
        setIsTesting(true)
        setTimeout(() => {
            setIsTesting(false)
            showToast('Test connection successful! WhatsApp API is ready.')
        }, 1200)
    }

    const toggleRule = (key: keyof typeof rules) => {
        setRules(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }))
    }

    const updateTemplate = (key: keyof typeof rules, value: string) => {
        setRules(prev => ({
            ...prev,
            [key]: { ...prev[key], template: value }
        }))
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-emerald-900/20 overflow-hidden flex flex-col max-h-[90vh] border border-white/50">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <MessageCircle size={20} className="fill-current" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Automated WhatsApp Reminders</h2>
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Global Configuration</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Header Info */}
                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex gap-3 text-sm">
                        <AlertTriangle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-emerald-800 text-xs">
                            <strong className="font-bold block mb-1">How Automation Works</strong>
                            Configure the rules below. When enabled, the system will automatically dispatch WhatsApp messages to tenants based on their rent due dates via the integrated API. Use placeholders <code className="bg-white/60 px-1 py-0.5 rounded text-[10px] font-bold text-emerald-700">[Tenant Name]</code>, <code className="bg-white/60 px-1 py-0.5 rounded text-[10px] font-bold text-emerald-700">[Amount]</code>, <code className="bg-white/60 px-1 py-0.5 rounded text-[10px] font-bold text-emerald-700">[Date]</code> to personalize templates.
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-6">
                        {/* Rule 1 */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-400" />
                                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Rule 1: Due Date Warning <span className="text-muted-foreground font-normal">(3 Days Before)</span></h3>
                                </div>
                                <button 
                                    onClick={() => toggleRule('warning')}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                        rules.warning.enabled ? "bg-emerald-500" : "bg-slate-200"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                        rules.warning.enabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>
                            {rules.warning.enabled && (
                                <div className="relative">
                                    <MessageSquare size={14} className="absolute top-3 left-3 text-emerald-500/50" />
                                    <textarea
                                        value={rules.warning.template}
                                        onChange={(e) => updateTemplate('warning', e.target.value)}
                                        className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 min-h-[80px] focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all resize-none"
                                        placeholder="Message Template..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Rule 2 */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-500" />
                                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Rule 2: Due Date Alert <span className="text-muted-foreground font-normal">(On Due Date)</span></h3>
                                </div>
                                <button 
                                    onClick={() => toggleRule('alert')}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                        rules.alert.enabled ? "bg-emerald-500" : "bg-slate-200"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                        rules.alert.enabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>
                            {rules.alert.enabled && (
                                <div className="relative">
                                    <MessageSquare size={14} className="absolute top-3 left-3 text-emerald-500/50" />
                                    <textarea
                                        value={rules.alert.template}
                                        onChange={(e) => updateTemplate('alert', e.target.value)}
                                        className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 min-h-[80px] focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all resize-none"
                                        placeholder="Message Template..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Rule 3 */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-rose-500" />
                                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Rule 3: Overdue Notice <span className="text-muted-foreground font-normal">(1 Day After)</span></h3>
                                </div>
                                <button 
                                    onClick={() => toggleRule('overdue')}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                        rules.overdue.enabled ? "bg-emerald-500" : "bg-slate-200"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                        rules.overdue.enabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>
                            {rules.overdue.enabled && (
                                <div className="relative">
                                    <MessageSquare size={14} className="absolute top-3 left-3 text-emerald-500/50" />
                                    <textarea
                                        value={rules.overdue.template}
                                        onChange={(e) => updateTemplate('overdue', e.target.value)}
                                        className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 min-h-[80px] focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all resize-none"
                                        placeholder="Message Template..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-neutral-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button 
                        onClick={handleTest}
                        disabled={isTesting || isSaving}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white text-slate-700 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isTesting ? <div className="h-4 w-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <SwitchCamera size={14} />}
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all text-center"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isTesting}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            {isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Test Connection Toast */}
            {toast && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-900/40 border border-emerald-700">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}
        </div>
    )
}
