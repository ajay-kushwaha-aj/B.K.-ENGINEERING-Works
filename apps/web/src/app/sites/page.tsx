"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Briefcase, 
  MapPin, 
  X, 
  AlertCircle,
  Building,
  CheckCircle2
} from "lucide-react";

interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  description: string | null;
  createdAt: string;
  sites?: Site[];
}

interface Site {
  id: string;
  contractId: string;
  name: string;
  location: string | null;
  createdAt: string;
  contract?: Contract;
}

export default function SiteManagementPage() {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [sites, setSites] = React.useState<Site[]>([]);
  
  const [activeTab, setActiveTab] = React.useState<"contracts" | "sites">("contracts");
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = React.useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<Contract | null>(null);
  const [editingSite, setEditingSite] = React.useState<Site | null>(null);

  // Form states
  const [contractForm, setContractForm] = React.useState({
    name: "",
    contractNumber: "",
    description: ""
  });

  const [siteForm, setSiteForm] = React.useState({
    name: "",
    location: "",
    contractId: ""
  });

  const [token, setToken] = React.useState("");
  const [userRole, setUserRole] = React.useState("");

  React.useEffect(() => {
    const sessionStr = localStorage.getItem("bk_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setToken(session.token || "");
        setUserRole(session.user?.role || "ADMIN");
      } catch (e) {
        console.error("Failed to load token", e);
      }
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [contractsRes, sitesRes] = await Promise.all([
        fetch("/api/contracts", { headers }),
        fetch("/api/sites", { headers })
      ]);

      if (!contractsRes.ok || !sitesRes.ok) {
        throw new Error("Failed to load contract/site data");
      }

      const contractsData = await contractsRes.json();
      const sitesData = await sitesRes.json();

      setContracts(contractsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while loading data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!contractForm.name || !contractForm.contractNumber) {
      setErrorMsg("Name and Contract Number are required");
      return;
    }

    try {
      const url = editingContract ? `/api/contracts/${editingContract.id}` : "/api/contracts";
      const method = editingContract ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(contractForm)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save contract");

      setSuccessMsg(editingContract ? "Contract updated successfully!" : "Contract created successfully!");
      setIsContractModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!siteForm.name || !siteForm.contractId) {
      setErrorMsg("Site Name and Contract are required");
      return;
    }

    try {
      const url = editingSite ? `/api/sites/${editingSite.id}` : "/api/sites";
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(siteForm)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save site");

      setSuccessMsg(editingSite ? "Site updated successfully!" : "Site created successfully!");
      setIsSiteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleContractDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contract "${name}"? This will delete all associated sites and related logs.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete contract");

      setSuccessMsg("Contract and all associated sites deleted successfully");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSiteDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete site "${name}"? This will clear all attendance logs associated with this site.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete site");

      setSuccessMsg("Site deleted successfully");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const openAddContract = () => {
    setEditingContract(null);
    setContractForm({ name: "", contractNumber: "", description: "" });
    setIsContractModalOpen(true);
  };

  const openEditContract = (c: Contract) => {
    setEditingContract(c);
    setContractForm({
      name: c.name,
      contractNumber: c.contractNumber,
      description: c.description || ""
    });
    setIsContractModalOpen(true);
  };

  const openAddSite = (contractId?: string) => {
    setEditingSite(null);
    setSiteForm({
      name: "",
      location: "",
      contractId: contractId || (contracts[0]?.id || "")
    });
    setIsSiteModalOpen(true);
  };

  const openEditSite = (s: Site) => {
    setEditingSite(s);
    setSiteForm({
      name: s.name,
      location: s.location || "",
      contractId: s.contractId
    });
    setIsSiteModalOpen(true);
  };

  const filteredContracts = contracts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.contractNumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSites = sites.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.location && s.location.toLowerCase().includes(search.toLowerCase())) ||
    (s.contract && s.contract.name.toLowerCase().includes(search.toLowerCase()))
  );

  const isAdmin = userRole === "ADMIN";

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Site & Contract Management
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage client work contracts and distinct job sites. Assign manager scopes, track deployment, and organize tasks.
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={openAddContract} variant="outline" className="flex items-center gap-2 cursor-pointer">
                <Briefcase size={16} /> Add Contract
              </Button>
              <Button onClick={() => openAddSite()} className="flex items-center gap-2 cursor-pointer">
                <Plus size={16} /> Add Site Location
              </Button>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border gap-6 pb-2">
          <button
            type="button"
            onClick={() => { setActiveTab("contracts"); setSearch(""); }}
            className={`pb-2 text-sm font-bold border-b-2 cursor-pointer transition-all uppercase tracking-wider ${
              activeTab === "contracts" 
                ? "border-primary text-foreground font-black" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Contracts ({contracts.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("sites"); setSearch(""); }}
            className={`pb-2 text-sm font-bold border-b-2 cursor-pointer transition-all uppercase tracking-wider ${
              activeTab === "sites" 
                ? "border-primary text-foreground font-black" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sites ({sites.length})
          </button>
        </div>

        {/* Action Row */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder={activeTab === "contracts" ? "Search contracts by name or number..." : "Search sites by name, location, or contract..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
          />
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-success/15 border border-success/20 rounded-xl text-success text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={36} />
          </div>
        ) : activeTab === "contracts" ? (
          // CONTRACTS TAB VIEW
          filteredContracts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
              <Briefcase className="mx-auto text-muted-foreground/50 mb-3" size={48} />
              <h3 className="text-lg font-bold text-foreground">No contracts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try refining your search keyword." : "Get started by adding your first client work contract."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map(c => {
                const contractSites = sites.filter(s => s.contractId === c.id);
                return (
                  <Card key={c.id} className="border-border/60 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] bg-secondary/15 text-amber-700 dark:text-amber-400 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                          {c.contractNumber}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => openEditContract(c)} 
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                              title="Edit Contract"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleContractDelete(c.id, c.name)} 
                              className="p-1 hover:text-danger text-muted-foreground transition-colors cursor-pointer"
                              title="Delete Contract"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-base mt-2 line-clamp-1">{c.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 min-h-[32px] mt-1">
                        {c.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="border-t border-border/80 pt-3 mt-2 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1">
                          <Building size={14} /> {contractSites.length} Location(s)
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => openAddSite(c.id)}
                            className="text-secondary hover:text-amber-500 font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={14} /> Add Site
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          // SITES TAB VIEW
          filteredSites.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
              <MapPin className="mx-auto text-muted-foreground/50 mb-3" size={48} />
              <h3 className="text-lg font-bold text-foreground">No site locations found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try refining your search keyword." : "Get started by adding job locations under your contracts."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Site Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract Connection</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Address</th>
                    {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredSites.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <MapPin size={14} className="text-secondary" /> {s.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.contract ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
                              {s.contract.contractNumber}
                            </span>
                            <div className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">{s.contract.name}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-danger font-semibold">Orphaned Site</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground font-mono">{s.location || "No coordinates provided"}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditSite(s)}
                              className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                              title="Edit Site"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleSiteDelete(s.id, s.name)}
                              className="p-1 hover:text-danger text-muted-foreground transition-colors cursor-pointer"
                              title="Delete Site"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* MODAL 1: ADD/EDIT CONTRACT */}
        {isContractModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Briefcase size={20} className="text-secondary" />
                  {editingContract ? "Modify Work Contract" : "New Client Contract"}
                </h3>
                <button onClick={() => setIsContractModalOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleContractSubmit}>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Contract Number / Reference</label>
                    <Input
                      required
                      placeholder="e.g. BK-2026-04"
                      value={contractForm.contractNumber}
                      onChange={(e) => setContractForm(p => ({ ...p, contractNumber: e.target.value }))}
                      className="text-xs uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Contract Legal Name</label>
                    <Input
                      required
                      placeholder="e.g. Mandala Steel Plant Structure Fabrication"
                      value={contractForm.name}
                      onChange={(e) => setContractForm(p => ({ ...p, name: e.target.value }))}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Contract Specifications / Notes</label>
                    <Textarea
                      placeholder="Outline terms, scope of supply, and location reference details..."
                      value={contractForm.description}
                      onChange={(e) => setContractForm(p => ({ ...p, description: e.target.value }))}
                      className="text-xs min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsContractModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" className="cursor-pointer">
                    {editingContract ? "Save Changes" : "Create Contract"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD/EDIT SITE */}
        {isSiteModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MapPin size={20} className="text-secondary" />
                  {editingSite ? "Modify Site Location" : "New Site Location"}
                </h3>
                <button onClick={() => setIsSiteModalOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSiteSubmit}>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Associated Contract</label>
                    <select
                      required
                      value={siteForm.contractId}
                      onChange={(e) => setSiteForm(p => ({ ...p, contractId: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
                    >
                      {contracts.map(c => (
                        <option key={c.id} value={c.id}>{c.contractNumber} — {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Site Name</label>
                    <Input
                      required
                      placeholder="e.g. Block A Welding Shed"
                      value={siteForm.name}
                      onChange={(e) => setSiteForm(p => ({ ...p, name: e.target.value }))}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Site Address / Coordinates</label>
                    <Input
                      placeholder="e.g. Sector 4, Mandya District, Mandya"
                      value={siteForm.location}
                      onChange={(e) => setSiteForm(p => ({ ...p, location: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsSiteModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" className="cursor-pointer">
                    {editingSite ? "Save Changes" : "Create Site Location"}
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
