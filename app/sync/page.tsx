"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Cloud,
  Download,
  Upload,
  Share2,
  Smartphone,
  Monitor,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from "lucide-react";

export default function SyncPage() {
  const [autoSync, setAutoSync] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(true);
  const [shareEnabled, setShareEnabled] = useState(false);

  const syncStatus = {
    lastSynced: "11/14/2024, 2:30:00 PM",
    devices: 3,
    storageUsed: 45,
    storageTotal: 100,
  };

  const connectedDevices = [
    { id: "1", name: "Desktop PC", type: "desktop", status: "active", lastSeen: "2 minutes ago" },
    { id: "2", name: "Mobile Phone", type: "mobile", status: "active", lastSeen: "5 minutes ago" },
    { id: "3", name: "iPad", type: "tablet", status: "inactive", lastSeen: "2 hours ago" },
  ];

  const handleBackupNow = () => {
    alert('Backup started! Your data is being backed up to the cloud.');
  };

  const handleExport = () => {
    alert('Exporting data... Your data will be downloaded as a ZIP file.');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json';
    input.onchange = () => {
      alert('Import started! Your data is being restored.');
    };
    input.click();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Sync, Share & Backup</h1>
        <p className="text-muted-foreground">
          Keep your business data safe and accessible across all devices
        </p>
      </div>

      {/* Sync Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">All synced</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last synced: {syncStatus.lastSynced}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStatus.devices}</div>
            <p className="text-xs text-muted-foreground">
              Active devices syncing data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus.storageUsed} MB
            </div>
            <Progress value={syncStatus.storageUsed} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {syncStatus.storageUsed} of {syncStatus.storageTotal} MB used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync data across all devices
              </p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Cloud Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data to the cloud
              </p>
            </div>
            <Switch checked={cloudBackup} onCheckedChange={setCloudBackup} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing data with team members
              </p>
            </div>
            <Switch checked={shareEnabled} onCheckedChange={setShareEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Backup Now</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a manual backup of all your data
                  </p>
                </div>
              </div>
              <Button onClick={handleBackupNow} className="gap-2">
                <Cloud className="h-4 w-4" />
                Backup
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Export Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your data as a file
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Import Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Restore data from a backup file
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleImport} className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    device.status === "active"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {device.type === "desktop" && <Monitor className="h-5 w-5" />}
                    {device.type === "mobile" && <Smartphone className="h-5 w-5" />}
                    {device.type === "tablet" && <Smartphone className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{device.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {device.status === "active" ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-600">Inactive</span>
                      )}{" "}
                      • {device.lastSeen}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                Your Data is Secure
              </h4>
              <p className="text-sm text-blue-800">
                All your data is encrypted with 256-bit encryption before syncing to the cloud.
                We use industry-standard security practices to keep your business data safe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
