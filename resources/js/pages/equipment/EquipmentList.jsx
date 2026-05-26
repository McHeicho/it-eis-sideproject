import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Laptop } from "lucide-react";
import api from "../../api/axios";

export default function EquipmentList() {
const user = JSON.parse(localStorage.getItem("user") || "{}");
const navigate = useNavigate();
const [equipment, setEquipment] = useState([]);
const [types, setTypes] = useState([]);
const [suppliers, setSuppliers] = useState([]);
const [loading, setLoading] = useState(true);
const [filtering, setFiltering] = useState(false);
const [filterForm, setFilterForm] = useState({
    status: "",
    condition: "",
    equipment_type_id: "",
    supplier_id: "",
    serial_number: "",
});

    useEffect(() => {
        fetchEquipment();
    }, []);

const fetchEquipment = async (params = {}) => {
    const isInitial = types.length === 0;
    if (isInitial) setLoading(true);
    else setFiltering(true);
    try {
        const requests = [api.get("/equipment", { params })];
        if (isInitial) {
            requests.push(api.get("/equipment-types"));
            requests.push(api.get("/suppliers"));
        }
        const responses = await Promise.all(requests);
        setEquipment(responses[0].data);
        if (isInitial) {
            setTypes(responses[1].data);
            setSuppliers(responses[2].data);
        }
    } catch (error) {
        console.error("Failed to fetch equipment:", error);
    } finally {
        setLoading(false);
        setFiltering(false);
    }
};

const handleFilter = () => fetchEquipment(filterForm);

const handleReset = () => {
    const empty = {
        status: "",
        condition: "",
        equipment_type_id: "",
        supplier_id: "",
        serial_number: "",
    };
    setFilterForm(empty);
    fetchEquipment();
};

    const getStatusStyle = (status) => {
        const styles = {
            Available: "bg-green-100 text-green-700",
            Assigned: "bg-blue-100 text-blue-700",
            "Under Repair": "bg-yellow-100 text-yellow-700",
            "Lost/Missing": "bg-red-100 text-red-700",
            "Retired/Disposed": "bg-gray-100 text-gray-600",
            "Spare Unit": "bg-purple-100 text-purple-700",
        };
        return styles[status] || "bg-gray-100 text-gray-600";
    };

    const getConditionStyle = (condition) => {
        const styles = {
            Good: "bg-green-100 text-green-700",
            Defective: "bg-red-100 text-red-700",
        };
        return styles[condition] || "bg-gray-100 text-gray-600";
    };

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading equipment...
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Equipment
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Equipment inventory.</p>
                </div>
                <button
                    onClick={() => navigate("/equipment/add")}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    Add Equipment
                </button>
            </div>

            {/* Filter Bar */}
<div className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
                value={filterForm.status}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, status: e.target.value }))}
                className="border rounded px-2 py-1.5 text-sm w-full bg-white"
            >
                <option value="">All Statuses</option>
                {["Available", "Assigned", "Under Repair", "Lost/Missing", "Retired/Disposed", "Spare Unit"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
        </div>
        <div>
            <label className="text-xs text-gray-500 block mb-1">Condition</label>
            <select
                value={filterForm.condition}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, condition: e.target.value }))}
                className="border rounded px-2 py-1.5 text-sm w-full bg-white"
            >
                <option value="">All Conditions</option>
                {["Good", "Defective"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
        <div>
            <label className="text-xs text-gray-500 block mb-1">Equipment Type</label>
            <select
                value={filterForm.equipment_type_id}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, equipment_type_id: e.target.value }))}
                className="border rounded px-2 py-1.5 text-sm w-full bg-white"
            >
                <option value="">All Types</option>
                {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        </div>
        <div>
            <label className="text-xs text-gray-500 block mb-1">Supplier</label>
            <select
                value={filterForm.supplier_id}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                className="border rounded px-2 py-1.5 text-sm w-full bg-white"
            >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
        </div>
        <div>
            <label className="text-xs text-gray-500 block mb-1">Serial Number</label>
            <input
                type="text"
                value={filterForm.serial_number}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, serial_number: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                className="border rounded px-2 py-1.5 text-sm w-full"
                placeholder="Starts with..."
            />
        </div>
    </div>
    <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
            {filtering ? "Filtering..." : `${equipment.length} record${equipment.length !== 1 ? "s" : ""} found`}
        </p>
        <div className="flex gap-2">
            <button
                onClick={handleReset}
                disabled={filtering}
                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors px-3 py-1.5"
            >
                Reset
            </button>
            <button
                onClick={handleFilter}
                disabled={filtering}
                className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                Filter
            </button>
        </div>
    </div>
</div>

            {/* Table */}
            {equipment.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Laptop size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No equipment records yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Brand</th>
                                <th className="px-4 py-3 text-left">Model</th>
                                <th className="px-4 py-3 text-left">
                                    Serial No.
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Supplier
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Condition
                                </th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {equipment.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-gray-500">
                                        <Laptop size={16} />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {item.brand?.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {item.model?.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-mono">
                                        {item.serial_number}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {item.delivery?.supplier?.name || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionStyle(
                                                item.condition
                                            )}`}
                                        >
                                            {item.condition}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                                                item.status
                                            )}`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/equipment/${item.id}`
                                                )
                                            }
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            View
                                        </button>
                                        {user.role_id === 1 && (
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/equipment/${item.id}/edit`
                                                    )
                                                }
                                                className="text-amber-600 hover:underline text-xs"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
