import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseHelpers";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Package,
  Stethoscope,
  Activity,
  Settings,
  Tag,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  Shield,
} from "lucide-react";
import RoleDefaultsEditor from "../components/admin/RoleDefaultsEditor";

const ROLE_COLORS = {
  admin: { bg: "bg-purple-100", text: "text-purple-700", bar: "bg-purple-500" },
  manager: { bg: "bg-pink-100", text: "text-pink-700", bar: "bg-pink-500" },
  staff: { bg: "bg-teal-100", text: "text-teal-700", bar: "bg-teal-500" },
  "read-only": { bg: "bg-gray-100", text: "text-gray-700", bar: "bg-gray-400" },
};

import { Copy, RefreshCw, Key } from "lucide-react";
import { Input } from "@/components/ui/input";

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CHC';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function AccessCodeManager() {
  const [code, setCode] = useState('CHC2026');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'access_code').single();
        if (data?.value) setCode(data.value);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveCode = async (newCode) => {
    setSaving(true);
    setCode(newCode);
    // Upsert the code
    const { error } = await supabase.from('app_settings').upsert(
      { key: 'access_code', value: newCode, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) {
      // If table doesn't exist yet, just keep it in state (will use default CHC2026)
      console.warn('Could not save access code:', error.message);
    }
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {
      // Fallback for HTTP
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="w-5 h-5 text-purple-600" />
          Staff Access Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">Share this code with new staff members so they can create an account on CHC Hub.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              value={loading ? '...' : code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onBlur={() => saveCode(code)}
              className="text-2xl font-bold tracking-widest text-center text-purple-700 bg-purple-50 border-purple-200 h-14"
              maxLength={10}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="gap-2 h-14 px-5"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            onClick={() => saveCode(generateCode())}
            disabled={saving}
            className="gap-2 h-14 px-5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            Generate New Code
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-3">You can edit the code directly or generate a random one. The old code stops working immediately when changed.</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => entities.User.list(),
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => entities.InventoryItem.list(),
  });

  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: ["admin-procedures"],
    queryFn: () => entities.Procedure.list(),
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      try {
        const data = await entities.UserActivity.list("-created_at", { limit: 10 });
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // Stats
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeUsers = users.filter(
    (u) => u.updated_at && new Date(u.updated_at) >= sevenDaysAgo
  );

  // Role breakdown
  const roleCounts = users.reduce((acc, u) => {
    const role = u.role || "staff";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const maxRoleCount = Math.max(...Object.values(roleCounts), 1);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "from-purple-500 to-violet-600", loading: usersLoading },
    { label: "Active (7 days)", value: activeUsers.length, icon: Activity, color: "from-pink-500 to-fuchsia-600", loading: usersLoading },
    { label: "Inventory Items", value: inventory.length, icon: Package, color: "from-teal-500 to-cyan-600", loading: inventoryLoading },
    { label: "Procedures", value: procedures.length, icon: Stethoscope, color: "from-violet-500 to-purple-600", loading: proceduresLoading },
  ];

  const quickActions = [
    { name: "User Management", path: "UserManagement", icon: Users, desc: "Manage users & roles" },
    { name: "Inventory Reports", path: "InventoryReports", icon: FileText, desc: "View inventory analytics" },
    { name: "Discounts", path: "DiscountManagement", icon: Tag, desc: "Manage discounts & promos" },
    { name: "Pricing", path: "PricingManagement", icon: DollarSign, desc: "Update pricing" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-500 to-pink-500 rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-lg text-white/80 mt-1">System overview & management</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    {stat.loading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-0 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={createPageUrl(action.path)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{action.name}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Role Breakdown */}
        <Card className="border-0 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-purple-600" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(roleCounts).map(([role, count]) => {
              const colors = ROLE_COLORS[role] || ROLE_COLORS["staff"];
              const pct = Math.round((count / maxRoleCount) * 100);
              return (
                <div key={role} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge className={`${colors.bg} ${colors.text} border-0 capitalize`}>
                      {role}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`${colors.bar} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {users.length === 0 && !usersLoading && (
              <p className="text-sm text-gray-400 text-center py-4">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activity.slice(0, 10).map((item, i) => (
                  <div key={item.id || i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {item.action || item.description || item.type || "Activity"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Permission Defaults */}
      <RoleDefaultsEditor />

      {/* Access Code Management */}
      <AccessCodeManager />

      {/* App Settings */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-purple-600" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="font-medium text-gray-700">Clinic Name</p>
              <p className="text-sm text-gray-400 mt-1">Configure your clinic display name</p>
              <Badge variant="outline" className="mt-2">Coming Soon</Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="font-medium text-gray-700">Notifications</p>
              <p className="text-sm text-gray-400 mt-1">Email & push notification settings</p>
              <Badge variant="outline" className="mt-2">Coming Soon</Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="font-medium text-gray-700">Branding</p>
              <p className="text-sm text-gray-400 mt-1">Logo, colors, and theme customization</p>
              <Badge variant="outline" className="mt-2">Coming Soon</Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="font-medium text-gray-700">Integrations</p>
              <p className="text-sm text-gray-400 mt-1">Third-party service connections</p>
              <Badge variant="outline" className="mt-2">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
