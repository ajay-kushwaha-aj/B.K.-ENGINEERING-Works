"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerSchema, CustomerType, INDIAN_STATES } from "shared";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit2, 
  Phone, 
  Mail, 
  MapPin, 
  User as UserIcon,
  X,
  Loader2,
  BookOpen
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerType[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<CustomerType | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerType>({
    resolver: zodResolver(CustomerSchema),
  });

  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
      } else {
        throw new Error(data.error || "Failed to fetch customers");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    reset({
      name: "",
      companyName: "",
      gstin: "",
      pan: "",
      phone: "",
      email: "",
      state: "",
      address: "",
      pinCode: "",
      contactPerson: "",
      notes: "",
      termsDefault: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: CustomerType) => {
    setEditingCustomer(customer);
    reset(customer);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CustomerType) => {
    setErrorMsg(null);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save customer");
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Customers
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-medium">
                {customers.length} total
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage corporate clients, plant contacts, and state tax registration details.
            </p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by name, company, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
          />
        </div>

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={36} />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <UserIcon className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try refining your search keyword." : "Get started by adding your first customer."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">GSTIN / State</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{customer.name}</div>
                        {customer.contactPerson && (
                          <div className="text-xs text-muted-foreground mt-0.5">Attn: {customer.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {customer.companyName || "—"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="font-mono text-xs text-foreground">{customer.gstin || "URD (Unregistered)"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{customer.state}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div>{customer.phone || "—"}</div>
                        <div className="text-xs">{customer.email || ""}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          customer.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/customers/${customer.id}/ledger`}
                            className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="View Ledger"
                          >
                            <BookOpen size={16} />
                          </Link>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2 mb-0">
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-snug">{customer.name}</h3>
                      {customer.companyName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{customer.companyName}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                      customer.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {customer.status}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{customer.address || "No Address"}, {customer.state}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="text-xs font-mono bg-muted/50 p-1.5 rounded mt-1 border border-border/30">
                        GST: {customer.gstin || "UNREGISTERED"}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                      <Link href={`/customers/${customer.id}/ledger`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen size={12} />
                          Ledger
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(customer)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={12} />
                        Edit Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Create/Edit Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-foreground rounded-full hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fill out details below. The *State* field dictates whether CGST/SGST or IGST splits are generated on invoices.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Customer Name *"
                      placeholder="e.g. Godavari Sugar Mills"
                      error={errors.name?.message}
                      {...register("name")}
                    />
                    <Input
                      label="Parent Company Name"
                      placeholder="e.g. Somaiya Group"
                      error={errors.companyName?.message}
                      {...register("companyName")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="GSTIN"
                      placeholder="27AAAAA1111A1Z1"
                      maxLength={15}
                      error={errors.gstin?.message}
                      {...register("gstin")}
                    />
                    <Input
                      label="PAN"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      error={errors.pan?.message}
                      {...register("pan")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Phone / Mobile"
                      placeholder="+91 9876543210"
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="billing@customer.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold">State (for Tax Split) *</label>
                      <select
                        {...register("state")}
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                      >
                        <option value="">-- Select State --</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {errors.state?.message && (
                        <span className="text-xs text-danger font-medium mt-0.5">{errors.state?.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Registered Address"
                        placeholder="Plot No. 12, Phase 3, Industrial Area"
                        error={errors.address?.message}
                        {...register("address")}
                      />
                    </div>
                    <Input
                      label="PIN Code"
                      placeholder="400001"
                      maxLength={6}
                      error={errors.pinCode?.message}
                      {...register("pinCode")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contact Person Name"
                      placeholder="Mr. Rajesh Shah"
                      error={errors.contactPerson?.message}
                      {...register("contactPerson")}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold">Status</label>
                      <select
                        {...register("status")}
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                  </div>

                  <Textarea
                    label="Default Invoice Terms & Conditions"
                    placeholder="Enter default terms that will be pre-filled when billing this customer..."
                    error={errors.termsDefault?.message}
                    {...register("termsDefault")}
                    rows={4}
                  />

                  <Textarea
                    label="Internal Notes"
                    placeholder="Provide any client specific delivery instructions or payment agreements..."
                    error={errors.notes?.message}
                    {...register("notes")}
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                      Save Customer
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
