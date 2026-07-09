"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductType } from "shared";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit2,
  Package,
  X,
  Loader2,
  Tag
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<ProductType[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductType | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductType>({
    resolver: zodResolver(ProductSchema),
  });

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      } else {
        throw new Error(data.error || "Failed to fetch products");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: "",
      description: "",
      hsnCode: "",
      gstPercent: 18,
      unit: "Nos",
      price: 0,
      purchasePrice: null,
      weight: null,
      stockQty: 0,
      minStock: 0,
      category: "",
      imageUrl: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductType) => {
    setEditingProduct(product);
    // Zod schema expects numbers, make sure they are cast from prisma decimals if needed
    reset({
      ...product,
      price: Number(product.price),
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      stockQty: Number(product.stockQty),
      minStock: Number(product.minStock),
      gstPercent: Number(product.gstPercent),
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ProductType) => {
    setErrorMsg(null);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save product");
      }

      setIsModalOpen(false);
      fetchProducts();
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
              Products & Services
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-medium">
                {products.length} total
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Define standard goods and contracting service rates, units, and HSN-based GST tax percentages.
            </p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} />
            Add Item / Service
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by product name or HSN code..."
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
        ) : products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <Package className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No items or services found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try refining your search keyword." : "Get started by adding your first product or service."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Item / Service</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">HSN Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">GST %</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Stock Qty</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</div>
                        )}
                        {product.category && (
                          <span className="inline-flex mt-1 items-center text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-semibold">
                            {product.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                        {product.hsnCode || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {Number(product.gstPercent)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                        ₹{Number(product.price).toLocaleString("en-IN")} / <span className="text-xs text-muted-foreground font-normal">{product.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {Number(product.stockQty)} {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                          product.status === "ACTIVE"
                            ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#137333]/20 dark:text-[#34d399] dark:border-[#10b981]/30"
                            : "bg-[#f1f3f4] text-[#3c4043] border-[#dadce0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2 mb-0">
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-snug">{product.name}</h3>
                      {product.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-2xs font-extrabold border ${
                      product.status === "ACTIVE"
                        ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#137333]/20 dark:text-[#34d399] dark:border-[#10b981]/30"
                        : "bg-[#f1f3f4] text-[#3c4043] border-[#dadce0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}>
                      {product.status}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description || "No description."}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm pt-1 border-t border-border/40">
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase font-bold tracking-wider">HSN Code</p>
                        <p className="font-mono mt-0.5 text-foreground">{product.hsnCode || "—"}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase font-bold tracking-wider">GST rate</p>
                        <p className="mt-0.5 text-foreground">{Number(product.gstPercent)}%</p>
                      </div>
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase font-bold tracking-wider">Rate per Unit</p>
                        <p className="mt-0.5 text-foreground font-bold text-base">₹{Number(product.price).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-muted-foreground uppercase font-bold tracking-wider">Billing Unit</p>
                        <p className="mt-0.5 text-foreground">{product.unit}</p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-border/60">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(product)}
                        className="flex items-center gap-1.5"
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
                  {editingProduct ? "Edit Product / Service" : "Add New Product or Service"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Items defined here will auto-fill unit rates, descriptions, and GST rates when building invoicing lines.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Item or Service Name *"
                    placeholder="e.g. MS Pipeline Fabrication (Heavy Duty)"
                    error={errors.name?.message}
                    {...register("name")}
                  />

                  <Textarea
                    label="Description"
                    placeholder="Provide details about dimensions, materials, tolerances or scope of work..."
                    error={errors.description?.message}
                    {...register("description")}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="HSN / SAC Code"
                      placeholder="e.g. 7305"
                      error={errors.hsnCode?.message}
                      {...register("hsnCode")}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold">GST Rate (%) *</label>
                      <select
                        {...register("gstPercent", { valueAsNumber: true })}
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                      >
                        <option value={18}>18% (Standard Services / Metal Goods)</option>
                        <option value={12}>12% (Contracting Components)</option>
                        <option value={28}>28% (Luxury / Spares)</option>
                        <option value={5}>5% (Basic Spares)</option>
                        <option value={0}>0% (Exempt)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Standard Rate (₹) *"
                      type="number"
                      step="0.01"
                      placeholder="4500"
                      error={errors.price?.message}
                      {...register("price", { valueAsNumber: true })}
                    />
                    <Input
                      label="Unit of Measurement *"
                      placeholder="e.g. Nos, Mtr, Joint, Kg, Job"
                      error={errors.unit?.message}
                      {...register("unit")}
                    />
                    <Input
                      label="Purchase Cost(₹)"
                      type="number"
                      step="0.01"
                      placeholder="3200"
                      error={errors.purchasePrice?.message}
                      {...register("purchasePrice", {
                        setValueAs: (v) => v === "" ? null : Number(v)
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Unit Weight (Kg)"
                      type="number"
                      step="0.01"
                      placeholder="12.5"
                      error={errors.weight?.message}
                      {...register("weight", {
                        setValueAs: (v) => v === "" ? null : Number(v)
                      })}
                    />
                    <Input
                      label="Stock Quantity"
                      type="number"
                      placeholder="500"
                      error={errors.stockQty?.message}
                      {...register("stockQty", { valueAsNumber: true })}
                    />
                    <Input
                      label="Minimum Stock Reorder Limit"
                      type="number"
                      placeholder="50"
                      error={errors.minStock?.message}
                      {...register("minStock", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Category"
                      placeholder="e.g. Fabrication, Welding, Spares"
                      error={errors.category?.message}
                      {...register("category")}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold">Status</label>
                      <select
                        {...register("status")}
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

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
                      Save Product
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
