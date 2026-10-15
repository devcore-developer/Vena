"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", name: "Account" },
    { id: "security", name: "Security" },
    { id: "notifications", name: "Notifications" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 flex md:flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg text-left transition ${
                activeTab === tab.id ? "bg-vena-50 text-vena-700" : "text-charcoal-muted hover:bg-slate-50"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <Card>
            {activeTab === "account" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-charcoal">Account Information</h2>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
                </div>
                <Button>Save Changes</Button>
              </div>
            )}
            {activeTab === "security" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-charcoal">Change Password</h2>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Current Password</label>
                  <input type="password" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">New Password</label>
                  <input type="password" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none" />
                </div>
                <Button>Update Password</Button>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-charcoal">Notification Preferences</h2>
                <label className="flex items-center justify-between p-3 border-b border-slate-100">
                  <span className="text-sm text-charcoal">Email Notifications</span>
                  <input type="checkbox" defaultChecked className="rounded text-vena-500 focus:ring-vena-500" />
                </label>
                <label className="flex items-center justify-between p-3">
                  <span className="text-sm text-charcoal">Platform Notifications</span>
                  <input type="checkbox" defaultChecked className="rounded text-vena-500 focus:ring-vena-500" />
                </label>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}