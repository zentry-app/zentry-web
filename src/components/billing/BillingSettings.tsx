import React, { useEffect, useMemo, useState } from 'react';
import { WebERPService, WebBillingSettings } from '@/lib/services/WebERPService';
import { Settings, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface BillingSettingsProps {
    residencialId: string;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ residencialId }) => {
    const [settings, setSettings] = useState<WebBillingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const erpService = useMemo(() => new WebERPService(), []);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await erpService.getBillingSettings(residencialId);
                setSettings(data);
            } catch (err) {
                setError('No se pudo cargar la configuración');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [erpService, residencialId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        try {
            setSaving(true);
            setError(null);
            await erpService.updateBillingSettings(residencialId, settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="space-y-4 animate-pulse"><div className="h-64 bg-slate-800/40 rounded-2xl" /></div>;

    return (
        <form onSubmit={handleSave} className="glass-card p-8 rounded-2xl border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Configuración de Facturación</h2>
                        <p className="text-sm text-slate-400">Define los parámetros base para la generación automática de cuotas.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cuota Base */}
                <div className="space-y-2">
                    <label htmlFor="baseFee" className="text-sm font-medium text-slate-300 block">Cuota Mensual</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                            id="baseFee"
                            type="number"
                            value={(settings?.defaultMonthlyFeeCents || 0) / 100}
                            onChange={(e) => setSettings(s => s ? ({ ...s, defaultMonthlyFeeCents: Number(e.target.value) * 100 }) : null)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-8 pr-4 text-white focus:border-blue-500/50 outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Recargo */}
                <div className="space-y-2">
                    <label htmlFor="lateFee" className="text-sm font-medium text-slate-300 block">Recargo Fijo</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                            id="lateFee"
                            type="number"
                            value={(settings?.lateFeeValue || 0) / 100}
                            onChange={(e) => setSettings(s => s ? ({ ...s, lateFeeValue: Number(e.target.value) * 100 }) : null)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-8 pr-4 text-white focus:border-blue-500/50 outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Días Clave */}
                <div className="space-y-4 pt-4 border-t border-slate-800 col-span-full grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label htmlFor="billingDay" className="text-sm font-medium text-slate-300 block">Día de Cobro</label>
                        <input
                            id="billingDay"
                            type="number"
                            min="1"
                            max="28"
                            value={settings?.billingDayOfMonth}
                            onChange={(e) => setSettings(s => s ? ({ ...s, billingDayOfMonth: Number(e.target.value) }) : null)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="dueDay" className="text-sm font-medium text-slate-300 block">Día de Vencimiento</label>
                        <input
                            id="dueDay"
                            type="number"
                            min="1"
                            max="31"
                            value={settings?.dueDayOfMonth}
                            onChange={(e) => setSettings(s => s ? ({ ...s, dueDayOfMonth: Number(e.target.value) }) : null)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white outline-none"
                        />
                    </div>
                </div>

                {/* Toggle Automático */}
                <div className="col-span-full flex items-center justify-between p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-white">Aplicar automáticamente</p>
                            <p className="text-xs text-slate-500">Los recargos se aplicarán al día siguiente del vencimiento vía Cron.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            id="autoApply"
                            type="checkbox"
                            aria-label="Aplicar automáticamente"
                            checked={settings?.applyLateFeeAutomatically || false}
                            onChange={(e) => setSettings(s => s ? ({ ...s, applyLateFeeAutomatically: e.target.checked }) : null)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${saved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                        } disabled:opacity-50`}
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Guardando...' : saved ? 'Configuración Guardada' : 'Guardar cambios'}
                </button>
            </div>
        </form>
    );
};

export default BillingSettings;
