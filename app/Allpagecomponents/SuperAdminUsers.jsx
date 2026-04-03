"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Trash2, PencilLine, Download, UserX, UserCheck } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";

const inputClass =
  "w-full rounded-xl border border-[#d5e3dc] bg-white px-3 py-2 text-sm text-[#17372b] outline-none transition placeholder:text-[#789486] focus:border-[#1f5c49] focus:ring-2 focus:ring-[#9ec7b4]/40";

const SuperAdminUsers = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;

  const [filters, setFilters] = useState({
    q: "",
    role: "",
    gender: "",
    email: "",
    mobile: "",
    userid: "",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editPayload, setEditPayload] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkRole, setBulkRole] = useState("");

  useEffect(() => {
    if (!user || user?.role !== "SuperAdmin") {
      router.replace("/superadmin-signin");
    }
  }, [user, router]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    Object.entries(filters).forEach(([key, value]) => {
      if (String(value || "").trim()) {
        params.set(key, String(value).trim());
      }
    });
    return params.toString();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/users/all?${buildQuery()}`, {
        withCredentials: true,
        timeout: 12000,
      });
      if (data?.success) {
        setUsers(data.users || []);
        setTotalPages(data.pages || 1);
        setSelectedIds([]);
      }
    } catch (error) {
      // noop: keep current list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchUsers();
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      role: "",
      gender: "",
      email: "",
      mobile: "",
      userid: "",
    });
    setPage(1);
    fetchUsers();
  };

  const startEdit = (u) => {
    setEditingUser(u);
    setEditPayload({
      fullname: u.fullname || "",
      email: u.email || "",
      mobile: u.mobile || "",
      role: u.role || "",
      gender: u.gender || "",
      isblocked: Boolean(u.isblocked),
    });
  };

  const saveEdit = async () => {
    if (!editingUser?._id) return;
    try {
      const { data } = await axios.put(
        `${serverurl}/users/edit/${editingUser._id}`,
        editPayload,
        { withCredentials: true, timeout: 12000 }
      );
      if (data?.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      // noop
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${serverurl}/users/delete/${id}`, {
        withCredentials: true,
        timeout: 12000,
      });
      fetchUsers();
    } catch (error) {
      // noop
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(users.map((u) => u._id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const bulkUpdate = async (isblocked) => {
    if (!selectedIds.length) return;
    try {
      await axios.patch(
        `${serverurl}/users/bulk`,
        { ids: selectedIds, isblocked },
        { withCredentials: true, timeout: 12000 }
      );
      fetchUsers();
    } catch (error) {
      // noop
    }
  };

  const bulkRoleChange = async () => {
    if (!selectedIds.length || !bulkRole) return;
    try {
      await axios.patch(
        `${serverurl}/users/bulk`,
        { ids: selectedIds, role: bulkRole },
        { withCredentials: true, timeout: 12000 }
      );
      setBulkRole("");
      fetchUsers();
    } catch (error) {
      // noop
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await axios.post(
        `${serverurl}/users/bulk-delete`,
        { ids: selectedIds },
        { withCredentials: true, timeout: 12000 }
      );
      fetchUsers();
    } catch (error) {
      // noop
    }
  };

  const exportCsv = () => {
    const query = buildQuery();
    window.open(`${serverurl}/users/export?${query}`, "_blank");
  };

  const paginationLabel = useMemo(
    () => `Page ${page} of ${totalPages}`,
    [page, totalPages]
  );

  return (
    <div className="min-h-screen bg-white">
      <SuperAdminNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <div className="flex items-center gap-3 text-[#1f5c49]">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">User Management</h1>
          </div>
          <p className="mt-2 text-sm text-[#4b6b61]">
            Search, filter, and manage every KhanCosmetics account.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="rounded-2xl border border-[#dce8e2] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789486]" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Search by name, email, mobile, or user id..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                />
              </div>
              <button
                onClick={applyFilters}
                className="rounded-xl bg-[#1f5c49] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#174737]"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="rounded-xl border border-[#cfe0d7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f5c49] transition hover:border-[#1f5c49]"
              >
                Reset
              </button>
              <button
                onClick={exportCsv}
                className="rounded-xl border border-[#cfe0d7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f5c49] transition hover:border-[#1f5c49] flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <input
                className={inputClass}
                placeholder="Filter by email"
                value={filters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Filter by mobile"
                value={filters.mobile}
                onChange={(e) => handleFilterChange("mobile", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Filter by user id"
                value={filters.userid}
                onChange={(e) => handleFilterChange("userid", e.target.value)}
              />
              <select
                className={inputClass}
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
              <select
                className={inputClass}
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                className={inputClass}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dce8e2] bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-[#56796a]">Pagination</p>
            <p className="mt-2 text-sm text-[#1f5c49]">{paginationLabel}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex-1 rounded-xl border border-[#cfe0d7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex-1 rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce8e2] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eef5f2] bg-[#f8fcfa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#56796a]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="accent-[#1f5c49]"
              />
              <span>{selectedIds.length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="rounded-xl border border-[#cfe0d7] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1f5c49]"
              >
                <option value="">Change Role</option>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
              <button
                onClick={bulkRoleChange}
                className="rounded-xl bg-[#1f5c49] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                Apply Role
              </button>
              <button
                onClick={() => bulkUpdate(true)}
                className="rounded-xl border border-[#f1d7d7] bg-[#fff5f5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b42318]"
              >
                <UserX className="h-3.5 w-3.5 inline-block mr-1" />
                Block
              </button>
              <button
                onClick={() => bulkUpdate(false)}
                className="rounded-xl border border-[#cfe0d7] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1f5c49]"
              >
                <UserCheck className="h-3.5 w-3.5 inline-block mr-1" />
                Unblock
              </button>
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="rounded-xl border border-[#f1d7d7] bg-[#fff5f5] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b42318]"
              >
                <Trash2 className="h-3.5 w-3.5 inline-block mr-1" />
                Delete
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[0.3fr_1.6fr_1.4fr_1fr_1fr_0.8fr_0.6fr] gap-3 border-b border-[#eef5f2] bg-[#f8fcfa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#56796a]">
            <span></span>
            <span>Name</span>
            <span>Email</span>
            <span>Mobile</span>
            <span>Role</span>
            <span>Gender</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[#56796a]">Loading users...</div>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className="grid grid-cols-[0.3fr_1.6fr_1.4fr_1fr_1fr_0.8fr_0.6fr] gap-3 border-b border-[#eef5f2] px-4 py-4 text-sm text-[#1f5c49]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u._id)}
                  onChange={() => toggleSelectOne(u._id)}
                  className="accent-[#1f5c49]"
                />
                <span className="font-semibold">{u.fullname || "Unnamed"}</span>
                <span className="truncate">{u.email}</span>
                <span>{u.mobile || "—"}</span>
                <span>{u.role || "User"}</span>
                <span>{u.gender || "—"}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="rounded-lg border border-[#cfe0d7] p-2 text-[#1f5c49] hover:border-[#1f5c49]"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="rounded-lg border border-[#f1d7d7] p-2 text-[#b42318] hover:border-[#b42318]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6">
              <h2 className="text-lg font-semibold text-[#1f5c49]">Edit User</h2>
              <div className="mt-4 grid gap-3">
                <input
                  className={inputClass}
                  placeholder="Full name"
                  value={editPayload.fullname || ""}
                  onChange={(e) => setEditPayload((prev) => ({ ...prev, fullname: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="Email"
                  value={editPayload.email || ""}
                  onChange={(e) => setEditPayload((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="Mobile"
                  value={editPayload.mobile || ""}
                  onChange={(e) => setEditPayload((prev) => ({ ...prev, mobile: e.target.value }))}
                />
                <select
                  className={inputClass}
                  value={editPayload.role || ""}
                  onChange={(e) => setEditPayload((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
                <select
                  className={inputClass}
                  value={editPayload.gender || ""}
                  onChange={(e) => setEditPayload((prev) => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-[#1f5c49]">
                  <input
                    type="checkbox"
                    checked={Boolean(editPayload.isblocked)}
                    onChange={(e) => setEditPayload((prev) => ({ ...prev, isblocked: e.target.checked }))}
                    className="accent-[#1f5c49]"
                  />
                  Block user
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-[#cfe0d7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="rounded-xl bg-[#1f5c49] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmBulkDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="text-lg font-semibold text-[#1f5c49]">Confirm Bulk Delete</h2>
              <p className="mt-2 text-sm text-[#4b6b61]">
                You are about to delete {selectedIds.length} users. This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmBulkDelete(false)}
                  className="rounded-xl border border-[#cfe0d7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await bulkDelete();
                    setConfirmBulkDelete(false);
                  }}
                  className="rounded-xl bg-[#b42318] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminUsers;
