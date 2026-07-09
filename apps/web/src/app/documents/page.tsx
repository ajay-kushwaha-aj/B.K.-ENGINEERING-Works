"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  FolderOpen,
  Download,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
  customerId: string | null;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const DOCUMENT_TYPES = [
  "Purchase Order (PO)",
  "Engineering Drawing",
  "Agreement / Contract",
  "GST Registration Certificate",
  "PAN Card Copy",
  "Other Document",
] as const;

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Document Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [docType, setDocType] = React.useState<(typeof DOCUMENT_TYPES)[number]>("Purchase Order (PO)");
  const [fileName, setFileName] = React.useState("");
  const [fileUrlBase64, setFileUrlBase64] = React.useState("");

  const fetchDocsAndCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [docRes, custRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/customers"),
      ]);
      const [docJson, custJson] = await Promise.all([
        docRes.json(),
        custRes.json(),
      ]);
      setDocuments(docJson);
      setCustomers(custJson);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocsAndCustomers();
  }, [fetchDocsAndCustomers]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Read file as base64 to simulate cloud upload URL
    const reader = new FileReader();
    reader.onload = () => {
      setFileUrlBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrlBase64) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          type: docType,
          fileName,
          fileUrl: fileUrlBase64,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFileName("");
        setFileUrlBase64("");
        fetchDocsAndCustomers();
      } else {
        const json = await res.json();
        alert(json.error || "Save document failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDocsAndCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <FolderOpen size={28} className="text-secondary" /> Customer Document Storage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Store drawing designs, purchase orders, agreements, and corporate compliance forms
            </p>
          </div>
          <Button className="gap-1.5 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Attach Document
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <FolderOpen size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No documents attached</h3>
            <p className="text-sm text-muted-foreground mt-1">Attach engineering plans or customer POs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const cust = customers.find((c) => c.id === doc.customerId);
              return (
                <Card key={doc.id} className="border-border/60 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <span className="inline-block self-start px-2 py-0.5 rounded text-[10px] font-bold bg-muted border border-border/60 text-muted-foreground mb-2">
                      {doc.type}
                    </span>
                    <CardTitle className="text-sm font-bold text-foreground truncate" title={doc.fileName}>
                      {doc.fileName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {cust ? `Linked: ${cust.name}` : "General Document"}
                    </p>
                  </CardHeader>
                  <CardContent className="text-[10px] text-muted-foreground pt-0 pb-4">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleString("en-IN")}
                  </CardContent>
                  <div className="px-6 pb-6 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <a href={doc.fileUrl} download={doc.fileName} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs cursor-pointer gap-1.5">
                        <Download size={12} /> Download
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700 h-8 px-2.5 cursor-pointer"
                      onClick={() => handleDeleteDoc(doc.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Attach Document Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-1.5">
                <FolderOpen size={20} className="text-secondary" /> Attach File
              </h2>
              <form onSubmit={handleSubmitDoc} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold">Associated Customer (optional)</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                  >
                    <option value="">— General / Not Scoped —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Upload File</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                    required
                  />
                </div>

                {fileName && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded text-xs flex items-center gap-2">
                    <FileCheck className="text-emerald-500" size={16} />
                    <span>Loaded: {fileName}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !fileUrlBase64} className="cursor-pointer">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Attach File"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
