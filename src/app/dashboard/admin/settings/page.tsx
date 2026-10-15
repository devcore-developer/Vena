"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { platformSettingsDB } from "@/data/mock/database";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Platform Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold text-charcoal mb-4 border-b border-slate-100 pb-4">General Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Platform Name</label>
                <input type="text" defaultValue="VENA" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Support Email</label>
                <input type="email" defaultValue="support@vena.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Default Currency</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none bg-white">
                  <option>EGP</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <Button>Save Changes</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-charcoal mb-4 border-b border-slate-100 pb-4">Financial Limits</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Minimum Payout (EGP)</label>
                <input type="number" defaultValue="500" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
              </div>
              <Button variant="secondary">Update Limits</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}