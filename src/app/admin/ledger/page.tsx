"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, Plus, Calculator, Pencil, Trash2 } from "lucide-react";

type LedgerEntry = {
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
};

type Summary = {
    income: number;
    expenses: number;
    profitAndLoss: number;
};

export default function DailyLedgerPage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [summary, setSummary] = useState<Summary>({ income: 0, expenses: 0, profitAndLoss: 0 });
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        type: "INCOME",
        amount: "",
        category: "",
        customDescription: "",
        officeId: "",
        waterCharges: "",
        expenseSubCategory: "",
    });

    const PREDEFINED_CATEGORIES = ["Snooker Club", "Saloon", "Office Management", "Rent", "Utility Bill", "Maintenance", "Staff Salary", "Office Utility", "Utility Bills", "Repairing and Maintenance", "Tax"];

    const fetchLedger = async () => {
        setLoading(true);
        const res = await fetch("/api/ledger");
        if (res.ok) {
            const data = await res.json();
            setEntries(data.entries);
            setSummary(data.summary);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalDescription = formData.category;
        let finalAmount = formData.amount;

        if (formData.category === "Other") {
            finalDescription = formData.customDescription;
        } else if (formData.category === "Rent") {
            finalDescription = `Rent - Office ${formData.officeId}`;
            if (formData.waterCharges && Number(formData.waterCharges) > 0) {
                finalDescription += ` - Water ${formData.waterCharges}`;
                finalAmount = (parseFloat(formData.amount) + parseFloat(formData.waterCharges)).toString();
            }
        } else if (["Office Utility", "Utility Bills"].includes(formData.category)) {
            finalDescription = formData.expenseSubCategory === "Other"
                ? `${formData.category} - ${formData.customDescription}`
                : `${formData.category} - ${formData.expenseSubCategory}`;
        }

        const submitData = {
            type: formData.type,
            amount: finalAmount,
            description: finalDescription
        };

        const res = await fetch("/api/ledger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData),
        });

        if (res.ok) {
            setIsAddOpen(false);
            fetchLedger();
            setFormData({ type: "INCOME", amount: "", category: "", customDescription: "", officeId: "", waterCharges: "", expenseSubCategory: "" });
        }
    };

    const openEditForm = (entry: LedgerEntry) => {
        let baseCategory = entry.description;
        let parsedOfficeId = "";
        let parsedWaterCharges = "";
        let parsedExpenseSubCategory = "";
        let baseAmount = entry.amount.toString();
        let customDesc = "";

        if (entry.description.startsWith("Rent - Office ")) {
            baseCategory = "Rent";
            const stripped = entry.description.replace("Rent - Office ", "");

            // Check if water charges are attached
            if (stripped.includes(" - Water ")) {
                const parts = stripped.split(" - Water ");
                parsedOfficeId = parts[0];
                parsedWaterCharges = parts[1];
                baseAmount = (entry.amount - parseFloat(parsedWaterCharges)).toString();
            } else {
                parsedOfficeId = stripped;
            }
        } else if (entry.description.startsWith("Office Utility - ")) {
            baseCategory = "Office Utility";
            const sub = entry.description.replace("Office Utility - ", "");
            if (["Tea", "Meal", "Cigarette", "Water", "Entertainment"].includes(sub)) {
                parsedExpenseSubCategory = sub;
            } else {
                parsedExpenseSubCategory = "Other";
                customDesc = sub;
            }
        } else if (entry.description.startsWith("Utility Bills - ")) {
            baseCategory = "Utility Bills";
            const sub = entry.description.replace("Utility Bills - ", "");
            if (["Electricity Bill", "Water Bill"].includes(sub)) {
                parsedExpenseSubCategory = sub;
            } else {
                parsedExpenseSubCategory = "Other";
                customDesc = sub;
            }
        }

        const isPredefined = PREDEFINED_CATEGORIES.includes(baseCategory);
        if (baseCategory === "Other" && customDesc === "") {
            customDesc = entry.description;
        }

        setFormData({
            type: entry.type,
            amount: baseAmount,
            category: isPredefined ? baseCategory : "Other",
            customDescription: customDesc,
            officeId: parsedOfficeId,
            waterCharges: parsedWaterCharges,
            expenseSubCategory: parsedExpenseSubCategory,
        });
        setEditingEntryId(entry.id);
        setIsEditOpen(true);
    };

    const handleUpdateEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEntryId) return;

        let finalDescription = formData.category;
        let finalAmount = formData.amount;

        if (formData.category === "Other") {
            finalDescription = formData.customDescription;
        } else if (formData.category === "Rent") {
            finalDescription = `Rent - Office ${formData.officeId}`;
            if (formData.waterCharges && Number(formData.waterCharges) > 0) {
                finalDescription += ` - Water ${formData.waterCharges}`;
                finalAmount = (parseFloat(formData.amount) + parseFloat(formData.waterCharges)).toString();
            }
        } else if (["Office Utility", "Utility Bills"].includes(formData.category)) {
            finalDescription = formData.expenseSubCategory === "Other"
                ? `${formData.category} - ${formData.customDescription}`
                : `${formData.category} - ${formData.expenseSubCategory}`;
        }

        const submitData = {
            type: formData.type,
            amount: finalAmount,
            description: finalDescription
        };

        const res = await fetch(`/api/ledger/${editingEntryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData),
        });

        if (res.ok) {
            setIsEditOpen(false);
            setEditingEntryId(null);
            fetchLedger();
            setFormData({ type: "INCOME", amount: "", category: "", customDescription: "", officeId: "", waterCharges: "", expenseSubCategory: "" });
        } else {
            const err = await res.json();
            alert(err.error || "Failed to update entry");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this ledger entry?")) {
            const res = await fetch(`/api/ledger/${id}`, { method: "DELETE" });
            if (res.ok) fetchLedger();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Ledger</h1>
                    <p className="text-slate-500">Track all income and expenses for JR Arcade.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" /> Record Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Ledger Entry</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddEntry} className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Income (Rent, Deposit, Water)</SelectItem>
                                        <SelectItem value="EXPENSE">Expense (Maintenance, Staff, Bills)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">{formData.category === "Rent" ? "Office Rent (Rs.)" : "Amount (Rs.)"}</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Source / Category</Label>
                                <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))} required>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select description" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formData.type === "INCOME" ? (
                                            <>
                                                <SelectItem value="Rent">Office Rent</SelectItem>
                                                <SelectItem value="Snooker Club">Snooker Club</SelectItem>
                                                <SelectItem value="Saloon">Saloon</SelectItem>
                                                <SelectItem value="Office Management">Office Management</SelectItem>
                                                <SelectItem value="Other">Other Income</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Office Utility">Office Utility</SelectItem>
                                                <SelectItem value="Utility Bills">Utility Bills</SelectItem>
                                                <SelectItem value="Repairing and Maintenance">Repairing & Maintenance</SelectItem>
                                                <SelectItem value="Tax">Tax</SelectItem>
                                                <SelectItem value="Staff Salary">Staff Salary</SelectItem>
                                                <SelectItem value="Office Management">Office Management</SelectItem>
                                                <SelectItem value="Other">Other Expense</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.category === "Rent" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="officeId">Office Number</Label>
                                        <Input
                                            id="officeId"
                                            type="text"
                                            placeholder="e.g. 5, 6, 7"
                                            required
                                            value={formData.officeId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, officeId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="waterCharges">Water Charges (Rs.)</Label>
                                        <Input
                                            id="waterCharges"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g. 2000"
                                            value={formData.waterCharges}
                                            onChange={(e) => setFormData(prev => ({ ...prev, waterCharges: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.category === "Office Utility" && (
                                <div className="space-y-2">
                                    <Label htmlFor="officeUtilitySub">Expense Detail</Label>
                                    <Select value={formData.expenseSubCategory} onValueChange={(val) => setFormData(prev => ({ ...prev, expenseSubCategory: val }))} required>
                                        <SelectTrigger id="officeUtilitySub"><SelectValue placeholder="Select detail" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tea">Tea</SelectItem>
                                            <SelectItem value="Meal">Meal</SelectItem>
                                            <SelectItem value="Cigarette">Cigarette</SelectItem>
                                            <SelectItem value="Water">Water</SelectItem>
                                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.category === "Utility Bills" && (
                                <div className="space-y-2">
                                    <Label htmlFor="utilityBillSub">Bill Type</Label>
                                    <Select value={formData.expenseSubCategory} onValueChange={(val) => setFormData(prev => ({ ...prev, expenseSubCategory: val }))} required>
                                        <SelectTrigger id="utilityBillSub"><SelectValue placeholder="Select bill type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
                                            <SelectItem value="Water Bill">Water Bill</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {(formData.category === "Other" || formData.expenseSubCategory === "Other") && (
                                <div className="space-y-2">
                                    <Label htmlFor="customDescription">Custom Description</Label>
                                    <Input
                                        id="customDescription"
                                        placeholder="Enter specific details..."
                                        required
                                        value={formData.customDescription}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customDescription: e.target.value }))}
                                    />
                                </div>
                            )}
                            <Button type="submit" className="w-full mt-2">Save Entry</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Ledger Entry Dialog */}
                <Dialog open={isEditOpen} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingEntryId(null);
                }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Ledger Entry</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateEntry} className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Transaction Type</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Income (Rent, Deposit, Water)</SelectItem>
                                        <SelectItem value="EXPENSE">Expense (Maintenance, Staff, Bills)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">{formData.category === "Rent" ? "Office Rent (Rs.)" : "Amount (Rs.)"}</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editCategory">Source / Category</Label>
                                <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))} required>
                                    <SelectTrigger id="editCategory">
                                        <SelectValue placeholder="Select description" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formData.type === "INCOME" ? (
                                            <>
                                                <SelectItem value="Rent">Office Rent</SelectItem>
                                                <SelectItem value="Snooker Club">Snooker Club</SelectItem>
                                                <SelectItem value="Saloon">Saloon</SelectItem>
                                                <SelectItem value="Office Management">Office Management</SelectItem>
                                                <SelectItem value="Other">Other Income</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Office Utility">Office Utility</SelectItem>
                                                <SelectItem value="Utility Bills">Utility Bills</SelectItem>
                                                <SelectItem value="Repairing and Maintenance">Repairing & Maintenance</SelectItem>
                                                <SelectItem value="Tax">Tax</SelectItem>
                                                <SelectItem value="Staff Salary">Staff Salary</SelectItem>
                                                <SelectItem value="Office Management">Office Management</SelectItem>
                                                <SelectItem value="Other">Other Expense</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.category === "Rent" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="editOfficeId">Office Number</Label>
                                        <Input
                                            id="editOfficeId"
                                            type="text"
                                            placeholder="e.g. 5, 6, 7"
                                            required
                                            value={formData.officeId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, officeId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editWaterCharges">Water Charges (Rs.)</Label>
                                        <Input
                                            id="editWaterCharges"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g. 2000"
                                            value={formData.waterCharges}
                                            onChange={(e) => setFormData(prev => ({ ...prev, waterCharges: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.category === "Office Utility" && (
                                <div className="space-y-2">
                                    <Label htmlFor="editOfficeUtilitySub">Expense Detail</Label>
                                    <Select value={formData.expenseSubCategory} onValueChange={(val) => setFormData(prev => ({ ...prev, expenseSubCategory: val }))} required>
                                        <SelectTrigger id="editOfficeUtilitySub"><SelectValue placeholder="Select detail" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tea">Tea</SelectItem>
                                            <SelectItem value="Meal">Meal</SelectItem>
                                            <SelectItem value="Cigarette">Cigarette</SelectItem>
                                            <SelectItem value="Water">Water</SelectItem>
                                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.category === "Utility Bills" && (
                                <div className="space-y-2">
                                    <Label htmlFor="editUtilityBillSub">Bill Type</Label>
                                    <Select value={formData.expenseSubCategory} onValueChange={(val) => setFormData(prev => ({ ...prev, expenseSubCategory: val }))} required>
                                        <SelectTrigger id="editUtilityBillSub"><SelectValue placeholder="Select bill type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
                                            <SelectItem value="Water Bill">Water Bill</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {(formData.category === "Other" || formData.expenseSubCategory === "Other") && (
                                <div className="space-y-2">
                                    <Label htmlFor="editCustomDescription">Custom Description</Label>
                                    <Input
                                        id="editCustomDescription"
                                        placeholder="Enter specific details..."
                                        required
                                        value={formData.customDescription}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customDescription: e.target.value }))}
                                    />
                                </div>
                            )}
                            <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-none shadow-sm shadow-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Total Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">Rs. {summary.income.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm shadow-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <ArrowDownRight className="h-4 w-4 text-red-600" /> Total Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">Rs. {summary.expenses.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-sm ${summary.profitAndLoss >= 0 ? 'bg-blue-50/50 shadow-blue-100' : 'bg-red-50/50 shadow-red-100'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                            <Calculator className="h-4 w-4 text-blue-600" /> Net Profit/Loss
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${summary.profitAndLoss >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            Rs. {Math.abs(summary.profitAndLoss).toFixed(2)}
                            {summary.profitAndLoss < 0 && <span className="text-sm font-normal text-red-500 ml-2">(Deficit)</span>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm shadow-slate-200">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Details / Source</TableHead>
                                <TableHead>Water Charges</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Gross Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading ledger...</TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">No transactions recorded yet.</TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="text-slate-600 whitespace-nowrap">
                                            {new Date(entry.date).toLocaleString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {entry.description.startsWith("Rent - Office ") ? "Office Rent" :
                                                PREDEFINED_CATEGORIES.includes(entry.description) ? entry.description : "Other"}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {entry.description.startsWith("Rent - Office ")
                                                ? entry.description.replace("Rent - ", "").split(" - Water ")[0]
                                                : PREDEFINED_CATEGORIES.includes(entry.description) ? "-" : entry.description}
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium">
                                            {entry.description.includes(" - Water ")
                                                ? `Rs. ${entry.description.split(" - Water ")[1]}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={entry.type === "INCOME" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-red-500 text-red-700 bg-red-50"}>
                                                {entry.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${entry.type === "INCOME" ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {entry.type === "INCOME" ? "+" : "-"}Rs. {entry.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditForm(entry)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
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
