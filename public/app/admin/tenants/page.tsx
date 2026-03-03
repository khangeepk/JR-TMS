"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

type Tenant = {
    id: string;
    name: string;
    phone: string;
    offices: { officeNumber: number }[];
    monthlyRent: number;
    securityDeposit: number;
    leaseStart: string;
    leaseEnd: string;
    user: {
        username: string;
    }
};

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        officeNumbersInput: "",
        monthlyRent: "",
        securityDeposit: "",
        leaseStart: "",
        leaseEnd: "",
        username: "",
        password: "",
    });

    const fetchTenants = async () => {
        setLoading(true);
        const res = await fetch("/api/tenants");
        if (res.ok) {
            const data = await res.json();
            setTenants(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const openEditForm = (tenant: Tenant) => {
        setFormData({
            name: tenant.name,
            phone: tenant.phone,
            officeNumbersInput: tenant.offices.map(o => o.officeNumber).join(", "),
            monthlyRent: tenant.monthlyRent.toString(),
            securityDeposit: tenant.securityDeposit.toString(),
            leaseStart: tenant.leaseStart.split("T")[0],
            leaseEnd: tenant.leaseEnd.split("T")[0],
            username: "", // Not used in edit
            password: "", // Not used in edit
        });
        setEditingTenantId(tenant.id);
        setIsEditOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedOffices = formData.officeNumbersInput.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        const submitData = { ...formData, officeNumbers: parsedOffices, officeNumber: parsedOffices[0] };

        const res = await fetch("/api/tenants", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(submitData),
        });

        if (res.ok) {
            setIsAddOpen(false);
            fetchTenants();
            setFormData({
                name: "", phone: "", officeNumbersInput: "", monthlyRent: "",
                securityDeposit: "", leaseStart: "", leaseEnd: "",
                username: "", password: "",
            });
        } else {
            const err = await res.json();
            console.error("Frontend Tenant Creation Error:", err);
            alert(err.error || "Failed to create tenant");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenantId) return;

        const parsedOffices = formData.officeNumbersInput.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        const submitData = { ...formData, officeNumbers: parsedOffices, officeNumber: parsedOffices[0] };

        const res = await fetch(`/api/tenants/${editingTenantId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(submitData),
        });

        if (res.ok) {
            setIsEditOpen(false);
            setEditingTenantId(null);
            fetchTenants();
            setFormData({
                name: "", phone: "", officeNumbersInput: "", monthlyRent: "",
                securityDeposit: "", leaseStart: "", leaseEnd: "",
                username: "", password: "",
            });
        } else {
            const err = await res.json();
            alert(err.error || "Failed to update tenant");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this tenant? This will also unassign their office.")) {
            const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
            if (res.ok) fetchTenants();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" suppressHydrationWarning>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tenant Profiles</h1>
                    <p className="text-slate-500">Manage tenants, leases, and contact information.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <UserPlus className="h-4 w-4 mr-2" /> Add Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Tenant</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={formData.phone} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Login Username</Label>
                                    <Input id="username" value={formData.username} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Login Password</Label>
                                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="officeNumbersInput">Office No(s). <span className="text-xs text-slate-400 border ml-1 px-1 rounded">Comma sep: 1,2,3</span></Label>
                                    <Input id="officeNumbersInput" type="text" placeholder="e.g. 1, 2" value={formData.officeNumbersInput} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyRent">Monthly Rent (Rs.)</Label>
                                    <Input id="monthlyRent" type="number" step="0.01" value={formData.monthlyRent} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="securityDeposit">Deposit (Rs.)</Label>
                                    <Input id="securityDeposit" type="number" step="0.01" value={formData.securityDeposit} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leaseStart">Lease Start</Label>
                                    <Input id="leaseStart" type="date" value={formData.leaseStart} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="leaseEnd">Lease End</Label>
                                    <Input id="leaseEnd" type="date" value={formData.leaseEnd} onChange={handleChange} required />
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-4">Create Tenant</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Tenant Dialog */}
                <Dialog open={isEditOpen} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingTenantId(null);
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Tenant Details</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={formData.name} onChange={handleEditChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={formData.phone} onChange={handleEditChange} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="officeNumbersInput">Office No(s). <span className="text-xs text-slate-400 border ml-1 px-1 rounded">Comma sep</span></Label>
                                    <Input id="officeNumbersInput" type="text" placeholder="e.g. 1, 2" value={formData.officeNumbersInput} onChange={handleEditChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyRent">Monthly Rent (Rs.)</Label>
                                    <Input id="monthlyRent" type="number" step="0.01" value={formData.monthlyRent} onChange={handleEditChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="securityDeposit">Deposit (Rs.)</Label>
                                    <Input id="securityDeposit" type="number" step="0.01" value={formData.securityDeposit} onChange={handleEditChange} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leaseStart">Lease Start</Label>
                                    <Input id="leaseStart" type="date" value={formData.leaseStart} onChange={handleEditChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="leaseEnd">Lease End</Label>
                                    <Input id="leaseEnd" type="date" value={formData.leaseEnd} onChange={handleEditChange} required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm shadow-slate-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Office</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Lease Dates</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading tenants...</TableCell>
                                </TableRow>
                            ) : tenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">No tenants found. Add one to get started.</TableCell>
                                </TableRow>
                            ) : (
                                tenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{tenant.name}</div>
                                            <div className="text-xs text-slate-500">@{tenant.user.username}</div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{tenant.phone}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {tenant.offices.map(o => (
                                                    <span key={o.officeNumber} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-inset ring-blue-700/10">
                                                        No. {o.officeNumber}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">Rs. {tenant.monthlyRent.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            <div suppressHydrationWarning>{new Date(tenant.leaseStart).toLocaleDateString()}</div>
                                            <div className="text-slate-400" suppressHydrationWarning>to {new Date(tenant.leaseEnd).toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditForm(tenant)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(tenant.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
