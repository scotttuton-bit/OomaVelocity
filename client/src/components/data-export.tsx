import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function DataExport() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const dateTo = new Date();
      
      const response = await apiRequest("POST", "/api/export", {
        format,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export Started",
        description: `Your ${data.format.toUpperCase()} export has been queued. You'll be notified when it's ready.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to start export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error("No file selected");
      
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("deviceId", deviceId || "imported-device");
      formData.append("location", location || "");

      const response = await fetch("/api/metrics/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.imported} records. ${data.errors > 0 ? `${data.errors} errors occurred.` : ''}`,
      });
      setCsvFile(null);
      setDeviceId("");
      setLocation("");
      setExportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-surface border-gray-700">
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Data Export & Reports</h3>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <i className="fas fa-upload mr-2"></i>
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Import Network Data</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Upload a CSV file with network metrics data. Expected format: timestamp_iso, download_mbps, upload_mbps, ping_ms, etc.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="deviceId">Device ID (optional)</Label>
                  <Input
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="e.g., main-router-01"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={!csvFile || importMutation.isPending}
                  className="w-full bg-primary hover:bg-blue-700"
                >
                  {importMutation.isPending ? "Importing..." : "Import CSV"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-primary hover:bg-gray-800 cursor-pointer transition-colors">
            <i className="fas fa-file-csv text-success text-3xl mb-3"></i>
            <h4 className="text-lg font-medium text-white mb-2">CSV Export</h4>
            <p className="text-sm text-gray-400 mb-4">Raw network performance data in CSV format</p>
            <Button
              onClick={() => exportMutation.mutate("csv")}
              disabled={exportMutation.isPending}
              className="bg-success hover:bg-green-600"
            >
              Download CSV
            </Button>
          </div>

          <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-primary hover:bg-gray-800 cursor-pointer transition-colors">
            <i className="fas fa-file-pdf text-error text-3xl mb-3"></i>
            <h4 className="text-lg font-medium text-white mb-2">PDF Report</h4>
            <p className="text-sm text-gray-400 mb-4">Comprehensive performance report with charts</p>
            <Button
              onClick={() => exportMutation.mutate("pdf")}
              disabled={exportMutation.isPending}
              className="bg-error hover:bg-red-600"
            >
              Generate PDF
            </Button>
          </div>

          <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-primary hover:bg-gray-800 cursor-pointer transition-colors">
            <i className="fas fa-code text-primary text-3xl mb-3"></i>
            <h4 className="text-lg font-medium text-white mb-2">API Access</h4>
            <p className="text-sm text-gray-400 mb-4">Programmatic access to network data</p>
            <Button className="bg-primary hover:bg-blue-700">
              View API Docs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
