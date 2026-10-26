"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Save, Settings, Loader2, CheckCircle, CreditCard } from "lucide-react";

export default function AdminSettingsPage() {
  const [generalForm, setGeneralForm] = useState({
    PLATFORM_NAME: "VENA",
    SUPPORT_EMAIL: "support@vena.com",
    DEFAULT_CURRENCY: "EGP",
    MINIMUM_PAYOUT: "500",
  });
  const [paymentConfig, setPaymentConfig] = useState({
    INSTAPAY: { enabled: true, account: "", beneficiary: "VENA Platform", instructions: "" },
    VODAFONE_CASH: { enabled: true, account: "", beneficiary: "VENA Platform", instructions: "" },
  });
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/payment-config").then((r) => r.json()),
    ])
      .then(([settings, payConfig]) => {
        setGeneralForm({
          PLATFORM_NAME: settings.PLATFORM_NAME || "VENA",
          SUPPORT_EMAIL: settings.SUPPORT_EMAIL || "support@vena.com",
          DEFAULT_CURRENCY: settings.DEFAULT_CURRENCY || "EGP",
          MINIMUM_PAYOUT: settings.MINIMUM_PAYOUT || "500",
        });
        if (payConfig.INSTAPAY) setPaymentConfig(payConfig);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalForm),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess("General settings saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save settings");
    }
    setSavingGeneral(false);
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/payment-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentConfig),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Payment configuration saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save payment config");
    }
    setSavingPayment(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-vena-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Platform Settings</h1>
        <p className="text-charcoal-muted mt-1">Manage platform-wide configuration.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100 mb-4 flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* General Settings */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-vena-600" />
          <h2 className="font-semibold text-charcoal">General Configuration</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Platform Name</label>
            <input type="text" value={generalForm.PLATFORM_NAME}
              onChange={(e) => setGeneralForm({ ...generalForm, PLATFORM_NAME: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Support Email</label>
            <input type="email" value={generalForm.SUPPORT_EMAIL}
              onChange={(e) => setGeneralForm({ ...generalForm, SUPPORT_EMAIL: e.target.value })}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Default Currency</label>
              <select value={generalForm.DEFAULT_CURRENCY}
                onChange={(e) => setGeneralForm({ ...generalForm, DEFAULT_CURRENCY: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500">
                <option value="EGP">EGP (Egyptian Pound)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Minimum Payout (EGP)</label>
              <input type="number" min="0" value={generalForm.MINIMUM_PAYOUT}
                onChange={(e) => setGeneralForm({ ...generalForm, MINIMUM_PAYOUT: e.target.value })}
                className="w-full px-4 py-2.5 border border-vena-100 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-vena-50">
            <Button onClick={handleSaveGeneral} isLoading={savingGeneral}>
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Configuration */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-vena-600" />
          <h2 className="font-semibold text-charcoal">Payment Methods Configuration</h2>
        </div>
        <p className="text-xs text-charcoal-muted mb-4">
          Configure the destination accounts where students should send payments. These details will be shown to students during checkout.
        </p>

        {/* InstaPay */}
        <div className="border border-vena-100 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-charcoal text-sm">InstaPay</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={paymentConfig.INSTAPAY.enabled}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  INSTAPAY: { ...paymentConfig.INSTAPAY, enabled: e.target.checked },
                })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              <span className={paymentConfig.INSTAPAY.enabled ? "text-green-600" : "text-charcoal-muted"}>
                {paymentConfig.INSTAPAY.enabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal-muted mb-1">Account / Handle</label>
              <input type="text" value={paymentConfig.INSTAPAY.account}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  INSTAPAY: { ...paymentConfig.INSTAPAY, account: e.target.value },
                })}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                placeholder="e.g., 01012345678 or vena@instapay" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-muted mb-1">Beneficiary Name</label>
              <input type="text" value={paymentConfig.INSTAPAY.beneficiary}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  INSTAPAY: { ...paymentConfig.INSTAPAY, beneficiary: e.target.value },
                })}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-charcoal-muted mb-1">Transfer Instructions</label>
            <textarea rows={2} value={paymentConfig.INSTAPAY.instructions}
              onChange={(e) => setPaymentConfig({
                ...paymentConfig,
                INSTAPAY: { ...paymentConfig.INSTAPAY, instructions: e.target.value },
              })}
              className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500 resize-none" />
          </div>
        </div>

        {/* Vodafone Cash */}
        <div className="border border-vena-100 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-charcoal text-sm">Vodafone Cash</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={paymentConfig.VODAFONE_CASH.enabled}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  VODAFONE_CASH: { ...paymentConfig.VODAFONE_CASH, enabled: e.target.checked },
                })}
                className="rounded text-vena-500 focus:ring-vena-500" />
              <span className={paymentConfig.VODAFONE_CASH.enabled ? "text-green-600" : "text-charcoal-muted"}>
                {paymentConfig.VODAFONE_CASH.enabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal-muted mb-1">Phone Number</label>
              <input type="text" value={paymentConfig.VODAFONE_CASH.account}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  VODAFONE_CASH: { ...paymentConfig.VODAFONE_CASH, account: e.target.value },
                })}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                placeholder="e.g., 01012345678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-muted mb-1">Beneficiary Name</label>
              <input type="text" value={paymentConfig.VODAFONE_CASH.beneficiary}
                onChange={(e) => setPaymentConfig({
                  ...paymentConfig,
                  VODAFONE_CASH: { ...paymentConfig.VODAFONE_CASH, beneficiary: e.target.value },
                })}
                className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-charcoal-muted mb-1">Transfer Instructions</label>
            <textarea rows={2} value={paymentConfig.VODAFONE_CASH.instructions}
              onChange={(e) => setPaymentConfig({
                ...paymentConfig,
                VODAFONE_CASH: { ...paymentConfig.VODAFONE_CASH, instructions: e.target.value },
              })}
              className="w-full px-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500 resize-none" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-vena-50">
          <Button onClick={handleSavePayment} isLoading={savingPayment}>
            <Save className="mr-2 h-4 w-4" /> Save Payment Config
          </Button>
        </div>
      </Card>

      {/* Warning about unconfigured accounts */}
      {((paymentConfig.INSTAPAY.enabled && !paymentConfig.INSTAPAY.account) ||
        (paymentConfig.VODAFONE_CASH.enabled && !paymentConfig.VODAFONE_CASH.account)) && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <CheckCircle size={16} />
            <span>Some enabled payment methods have no destination account configured. Students won&apos;t know where to send payments.</span>
          </div>
        </Card>
      )}
    </div>
  );
}