import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import api from "../../api/axios";

export default function AssignmentList() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role_id === 1;

    const [assignments, setAssignments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // View toggle
    const [view, setView] = useState("equipment");

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("");

    // Assign modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        equipment_id: "",
        employee_id: "",
        date_assigned: "",
        notes: "",
    });
    const [assignErrors, setAssignErrors] = useState({});
    const [assigning, setAssigning] = useState(false);
    const [lostOnly, setLostOnly] = useState(false);
    const [lostEquipment, setLostEquipment] = useState([]);
    const [loadingLost, setLoadingLost] = useState(false);

    // Return modal
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [returnForm, setReturnForm] = useState({
        date_returned: "",
        notes: "",
    });
    const [returnErrors, setReturnErrors] = useState({});
    const [returning, setReturning] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [assignRes, empRes, eqRes, deptRes] = await Promise.all([
                api.get("/assignments"),
                api.get("/employees"),
                api.get("/equipment"),
                api.get("/departments"),
            ]);
            setAssignments(assignRes.data);
            setEmployees(empRes.data);
            setEquipment(eqRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredAssignments = assignments.filter((a) => {
        const isActive = !a.date_returned;
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "returned" && isActive) return false;
        if (deptFilter && a.employee?.department_tag !== deptFilter)
            return false;
        return true;
    });

    const equipmentViewData = equipment
        .map((eq) => {
            const activeAssignment = assignments.find(
                (a) => a.equipment_id === eq.id && !a.date_returned
            );
            return { equipment: eq, assignment: activeAssignment || null };
        })
        .filter((row) => {
            if (
                deptFilter &&
                row.assignment?.employee?.department_tag !== deptFilter
            )
                return false;
            if (statusFilter === "active" && !row.assignment) return false;
            if (statusFilter === "returned") return false;
            if (statusFilter === "available" && row.assignment) return false;
            return true;
        });

    // Available equipment for assign modal
    const availableEquipment = equipment.filter(
        (e) => e.status === "Available" || e.status === "Spare Unit"
    );

    // Filter employees for selection
    const filteredEmployees = assignForm.department_tag
        ? employees.filter(
              (e) => e.department_tag === assignForm.department_tag
          )
        : employees;

    const fetchLostEquipment = async () => {
        setLoadingLost(true);
        setLostEquipment([]);
        try {
            const res = await api.get("/equipment", {
                params: { status: "Lost/Missing" },
            });
            setLostEquipment(res.data);
        } catch (error) {
            console.error("Failed to fetch lost equipment:", error);
        } finally {
            setLoadingLost(false);
        }
    };

    // Open assign modal
    const handleOpenAssign = () => {
        setAssignForm({
            equipment_id: "",
            employee_id: "",
            department_tag: "",
            date_assigned: new Date().toISOString().split("T")[0],
            notes: "",
        });
        setAssignErrors({});
        setLostOnly(false);
        setLostEquipment([]);
        setShowAssignModal(true);
    };

    // Open return modal
    const handleOpenReturn = (assignment) => {
        setSelectedAssignment(assignment);
        setReturnForm({
            date_returned: new Date().toISOString().split("T")[0],
            notes: "",
        });
        setReturnErrors({});
        setShowReturnModal(true);
    };

    // Submit assign
    const handleAssign = async (e) => {
        e.preventDefault();
        setAssigning(true);
        setAssignErrors({});
        try {
            await api.post("/assignments", assignForm);
            await fetchAll();
            setShowAssignModal(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setAssignErrors(error.response.data.errors);
            } else {
                console.error("Failed to assign:", error);
            }
        } finally {
            setAssigning(false);
        }
    };

    // Submit return
    const handleReturn = async (e) => {
        e.preventDefault();
        setReturning(true);
        setReturnErrors({});
        try {
            await api.patch(
                `/assignments/${selectedAssignment.id}/return`,
                returnForm
            );
            await fetchAll();
            setShowReturnModal(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setReturnErrors(error.response.data.errors);
            } else {
                console.error("Failed to return:", error);
            }
        } finally {
            setReturning(false);
        }
    };

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              })
            : "—";

    const inputClass =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    // Loading skeleton
    if (loading) {
        return (
            <div className="p-6">
                <div className="skeleton h-6 w-36 rounded mb-2"></div>
                <div className="skeleton h-3 w-24 rounded mb-6"></div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 border-b"
                        >
                            <div className="skeleton h-3 w-40 rounded"></div>
                            <div className="skeleton h-3 w-32 rounded"></div>
                            <div className="skeleton h-3 w-24 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Assignments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredAssignments.length} record
                        {filteredAssignments.length !== 1 ? "s" : ""} found
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleOpenAssign}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        <ClipboardList size={16} />
                        {view === "equipment"
                            ? "Assign Equipment"
                            : "Assign Employee"}
                    </button>
                )}
            </div>

            {/* View Toggle + Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* View Toggle */}
                <div className="flex rounded overflow-hidden border border-gray-200">
                    <button
                        onClick={() => {
                            setView("equipment");
                            setStatusFilter("all");
                        }}
                        className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                            view === "equipment"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Equipment View
                    </button>
                    <button
                        onClick={() => {
                            setView("employee");
                            setStatusFilter("all");
                        }}
                        className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                            view === "employee"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Employee View
                    </button>
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="returned">Returned</option>
                    {view === "equipment" && (
                        <option value="available">Available</option>
                    )}
                </select>

                {/* Department Filter */}
                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.tag}>
                            {dept.name} ({dept.tag})
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {filteredAssignments.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ClipboardList
                        size={40}
                        className="mx-auto mb-3 opacity-30"
                    />
                    <p className="text-sm">No assignment records found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                {view === "equipment" ? (
                                    <>
                                        <th className="px-4 py-3 text-left">
                                            Equipment
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Serial No.
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Employee
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 text-left">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Equipment
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Serial No.
                                        </th>
                                    </>
                                )}
                                <th className="px-4 py-3 text-left">
                                    Date Assigned
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Date Returned
                                </th>
                                <th className="px-4 py-3 text-left">Status</th>
                                {isAdmin && (
                                    <th className="px-4 py-3 text-left">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {view === "equipment"
                                ? equipmentViewData.map((row) => {
                                      const { equipment: eq, assignment } = row;
                                      const isActive = !!assignment;
                                      return (
                                          <tr
                                              key={eq.id}
                                              className="hover:bg-gray-50 transition-colors"
                                          >
                                              <td className="px-4 py-3 font-medium text-gray-800">
                                                  {eq.brand?.name}{" "}
                                                  {eq.model?.name}
                                              </td>
                                              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                  {eq.serial_number}
                                              </td>
                                              <td className="px-4 py-3 text-gray-500 text-xs">
                                                  {assignment
                                                      ? assignment.employee
                                                            ?.department?.name
                                                      : "—"}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600">
                                                  {assignment
                                                      ? assignment.employee
                                                            ?.name
                                                      : "—"}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600 text-xs">
                                                  {assignment
                                                      ? formatDate(
                                                            assignment.date_assigned
                                                        )
                                                      : "—"}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600 text-xs">
                                                  {assignment
                                                      ? formatDate(
                                                            assignment.date_returned
                                                        )
                                                      : "—"}
                                              </td>
                                              <td className="px-4 py-3">
                                                  <div className="tooltip-wrapper">
                                                      <span
                                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                              isActive
                                                                  ? "bg-green-100 text-green-700"
                                                                  : "bg-gray-100 text-gray-600"
                                                          }`}
                                                      >
                                                          {eq.status}
                                                      </span>
                                                      {eq.status ===
                                                          "Assigned" &&
                                                          assignment?.employee && (
                                                              <span className="tooltip">
                                                                  Assigned to:{" "}
                                                                  {
                                                                      assignment
                                                                          .employee
                                                                          .name
                                                                  }
                                                              </span>
                                                          )}
                                                  </div>
                                              </td>
                                              {isAdmin && (
                                                  <td className="px-4 py-3">
                                                      {isActive && assignment && (
                                                          <button
                                                              onClick={() =>
                                                                  handleOpenReturn(
                                                                      assignment
                                                                  )
                                                              }
                                                              className="text-blue-600 hover:underline text-xs"
                                                          >
                                                              Return
                                                          </button>
                                                      )}
                                                  </td>
                                              )}
                                          </tr>
                                      );
                                  })
                                : filteredAssignments.map((assignment) => {
                                      const isActive = !assignment.date_returned;
                                      return (
                                          <tr
                                              key={assignment.id}
                                              className="hover:bg-gray-50 transition-colors"
                                          >
                                              {view === "equipment" ? (
                                                  <>
                                                      <td className="px-4 py-3 font-medium text-gray-800">
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.brand?.name
                                                          }{" "}
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.model?.name
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.serial_number
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 text-gray-500 text-xs">
                                                          {
                                                              assignment
                                                                  .employee
                                                                  ?.department
                                                                  ?.name
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 text-gray-600">
                                                          {
                                                              assignment
                                                                  .employee
                                                                  ?.name
                                                          }
                                                      </td>
                                                  </>
                                              ) : (
                                                  <>
                                                      <td className="px-4 py-3 text-gray-500 text-xs">
                                                          {
                                                              assignment
                                                                  .employee
                                                                  ?.department
                                                                  ?.name
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 font-medium text-gray-800">
                                                          {
                                                              assignment
                                                                  .employee
                                                                  ?.name
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 text-gray-600">
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.brand?.name
                                                          }{" "}
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.model?.name
                                                          }
                                                      </td>
                                                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                          {
                                                              assignment
                                                                  .equipment
                                                                  ?.serial_number
                                                          }
                                                      </td>
                                                  </>
                                              )}
                                              <td className="px-4 py-3 text-gray-600 text-xs">
                                                  {formatDate(
                                                      assignment.date_assigned
                                                  )}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600 text-xs">
                                                  {formatDate(
                                                      assignment.date_returned
                                                  )}
                                              </td>
                                              <td className="px-4 py-3">
                                                  <span
                                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                          isActive
                                                              ? "bg-green-100 text-green-700"
                                                              : "bg-purple-100 text-purple-700"
                                                      }`}
                                                  >
                                                      {isActive
                                                          ? "Active"
                                                          : "Returned"}
                                                  </span>
                                              </td>
                                              {isAdmin && (
                                                  <td className="px-4 py-3">
                                                      {isActive && (
                                                          <button
                                                              onClick={() =>
                                                                  handleOpenReturn(
                                                                      assignment
                                                                  )
                                                              }
                                                              className="text-blue-600 hover:underline text-xs"
                                                          >
                                                              Return
                                                          </button>
                                                      )}
                                                  </td>
                                              )}
                                          </tr>
                                      );
                                  })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-base font-bold text-gray-800">
                                {view === "equipment"
                                    ? "Assign Equipment"
                                    : "Assign Employee"}
                            </h2>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAssign}>
                            <div className="px-6 py-4 space-y-4">
                                {/* Context-aware: Equipment View shows equipment first */}
                                {view === "equipment" ? (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className={labelClass}>
                                                    Equipment
                                                </label>
                                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={lostOnly}
                                                        onChange={(e) => {
                                                            const checked =
                                                                e.target
                                                                    .checked;
                                                            setLostOnly(
                                                                checked
                                                            );
                                                            setAssignForm({
                                                                ...assignForm,
                                                                equipment_id:
                                                                    "",
                                                            });
                                                            if (checked)
                                                                fetchLostEquipment();
                                                            else
                                                                setLostEquipment(
                                                                    []
                                                                );
                                                        }}
                                                    />
                                                    Show Lost/Missing only
                                                </label>
                                            </div>
                                            <select
                                                value={assignForm.equipment_id}
                                                onChange={(e) =>
                                                    setAssignForm({
                                                        ...assignForm,
                                                        equipment_id:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={loadingLost}
                                                className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                                            >
                                                <option value="">
                                                    {loadingLost
                                                        ? "Loading..."
                                                        : "Select Equipment"}
                                                </option>
                                                {(lostOnly
                                                    ? lostEquipment
                                                    : availableEquipment
                                                ).map((eq) => (
                                                    <option
                                                        key={eq.id}
                                                        value={eq.id}
                                                    >
                                                        {eq.brand?.name}{" "}
                                                        {eq.model?.name} —{" "}
                                                        {eq.serial_number} (
                                                        {eq.status})
                                                    </option>
                                                ))}
                                            </select>
                                            {assignErrors.equipment_id && (
                                                <p className={errorClass}>
                                                    {
                                                        assignErrors
                                                            .equipment_id[0]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                Department
                                            </label>
                                            <select
                                                value={
                                                    assignForm.department_tag
                                                }
                                                onChange={(e) =>
                                                    setAssignForm({
                                                        ...assignForm,
                                                        department_tag:
                                                            e.target.value,
                                                        employee_id: "",
                                                    })
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    All Departments
                                                </option>
                                                {departments.map((dept) => (
                                                    <option
                                                        key={dept.id}
                                                        value={dept.tag}
                                                    >
                                                        {dept.name} ({dept.tag})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                Employee
                                            </label>
                                            <select
                                                value={assignForm.employee_id}
                                                onChange={(e) =>
                                                    setAssignForm({
                                                        ...assignForm,
                                                        employee_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select Employee
                                                </option>
                                                {filteredEmployees.map(
                                                    (emp) => (
                                                        <option
                                                            key={emp.id}
                                                            value={emp.id}
                                                        >
                                                            {emp.name} (
                                                            {emp.department_tag}
                                                            )
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {assignErrors.employee_id && (
                                                <p className={errorClass}>
                                                    {
                                                        assignErrors
                                                            .employee_id[0]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className={labelClass}>
                                                Employee
                                            </label>
                                            <select
                                                value={assignForm.employee_id}
                                                onChange={(e) =>
                                                    setAssignForm({
                                                        ...assignForm,
                                                        employee_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select Employee
                                                </option>
                                                {filteredEmployees.map(
                                                    (emp) => (
                                                        <option
                                                            key={emp.id}
                                                            value={emp.id}
                                                        >
                                                            {emp.name} (
                                                            {emp.department_tag}
                                                            )
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {assignErrors.employee_id && (
                                                <p className={errorClass}>
                                                    {
                                                        assignErrors
                                                            .employee_id[0]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className={labelClass}>
                                                    Equipment
                                                </label>
                                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={lostOnly}
                                                        onChange={(e) => {
                                                            const checked =
                                                                e.target
                                                                    .checked;
                                                            setLostOnly(
                                                                checked
                                                            );
                                                            setAssignForm({
                                                                ...assignForm,
                                                                equipment_id:
                                                                    "",
                                                            });
                                                            if (checked)
                                                                fetchLostEquipment();
                                                            else
                                                                setLostEquipment(
                                                                    []
                                                                );
                                                        }}
                                                    />
                                                    Show Lost/Missing only
                                                </label>
                                            </div>
                                            <select
                                                value={assignForm.equipment_id}
                                                onChange={(e) =>
                                                    setAssignForm({
                                                        ...assignForm,
                                                        equipment_id:
                                                            e.target.value,
                                                    })
                                                }
                                                disabled={loadingLost}
                                                className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                                            >
                                                <option value="">
                                                    {loadingLost
                                                        ? "Loading..."
                                                        : "Select Equipment"}
                                                </option>
                                                {(lostOnly
                                                    ? lostEquipment
                                                    : availableEquipment
                                                ).map((eq) => (
                                                    <option
                                                        key={eq.id}
                                                        value={eq.id}
                                                    >
                                                        {eq.brand?.name}{" "}
                                                        {eq.model?.name} —{" "}
                                                        {eq.serial_number} (
                                                        {eq.status})
                                                    </option>
                                                ))}
                                            </select>
                                            {assignErrors.equipment_id && (
                                                <p className={errorClass}>
                                                    {
                                                        assignErrors
                                                            .equipment_id[0]
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className={labelClass}>
                                        Date Assigned
                                    </label>
                                    <input
                                        type="date"
                                        value={assignForm.date_assigned}
                                        onChange={(e) =>
                                            setAssignForm({
                                                ...assignForm,
                                                date_assigned: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                    {assignErrors.date_assigned && (
                                        <p className={errorClass}>
                                            {assignErrors.date_assigned[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <textarea
                                        value={assignForm.notes}
                                        onChange={(e) =>
                                            setAssignForm({
                                                ...assignForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        className={`${inputClass} resize-none`}
                                        rows={3}
                                        placeholder="Optional notes..."
                                    />
                                </div>

                                {assignErrors.general && (
                                    <p className="text-red-500 text-xs">
                                        {assignErrors.general[0]}
                                    </p>
                                )}
                            </div>

                            <div className="px-6 py-3 border-t flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assigning}
                                    className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {assigning
                                        ? "Assigning..."
                                        : "Confirm Assignment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && selectedAssignment && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-base font-bold text-gray-800">
                                Return Equipment
                            </h2>
                            <button
                                onClick={() => setShowReturnModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Read-only summary */}
                        <div className="px-6 py-3 bg-gray-50 border-b space-y-1">
                            <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                    Equipment:{" "}
                                </span>
                                {selectedAssignment.equipment?.brand?.name}{" "}
                                {selectedAssignment.equipment?.model?.name} —{" "}
                                {selectedAssignment.equipment?.serial_number}
                            </p>
                            <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                    Assigned to:{" "}
                                </span>
                                {selectedAssignment.employee?.name} (
                                {selectedAssignment.employee?.department_tag})
                            </p>
                            <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                    Date Assigned:{" "}
                                </span>
                                {formatDate(selectedAssignment.date_assigned)}
                            </p>
                        </div>

                        <form onSubmit={handleReturn}>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <label className={labelClass}>
                                        Date Returned
                                    </label>
                                    <input
                                        type="date"
                                        value={returnForm.date_returned}
                                        onChange={(e) =>
                                            setReturnForm({
                                                ...returnForm,
                                                date_returned: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                    {returnErrors.date_returned && (
                                        <p className={errorClass}>
                                            {returnErrors.date_returned[0]}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <textarea
                                        value={returnForm.notes}
                                        onChange={(e) =>
                                            setReturnForm({
                                                ...returnForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        className={`${inputClass} resize-none`}
                                        rows={3}
                                        placeholder="Optional notes on return condition..."
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-3 border-t flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowReturnModal(false)}
                                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={returning}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {returning
                                        ? "Processing..."
                                        : "Confirm Return"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
