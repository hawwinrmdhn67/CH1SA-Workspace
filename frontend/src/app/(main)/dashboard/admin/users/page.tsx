"use client";

import { useEffect, useState } from "react";

import { EllipsisVertical, Key, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, useAuth } from "@/hooks/use-auth";
import { createUser, deleteUser, listUsers, resetUserPassword, updateUser } from "@/lib/api/admin";

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({ username: "", role: "user", isActive: true, password: "", mustChangePassword: true });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      toast.error("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!formData.username || !formData.password) {
      toast.error("Username and password are required.");
      return;
    }
    try {
      await createUser({
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive,
        password: formData.password,
      });
      toast.success("User created successfully");
      setIsCreateOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to create user.");
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, {
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive,
      });
      toast.success("User updated successfully");
      setIsEditOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to update user.");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user.");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      await resetUserPassword(selectedUser.id, {
        password: formData.password,
        mustChangePassword: formData.mustChangePassword,
      });
      toast.success("Password reset successfully");
      setIsResetOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to reset password.");
    }
  };

  const openCreateDialog = () => {
    setFormData({ username: "", role: "user", isActive: true, password: "", mustChangePassword: true });
    setIsCreateOpen(true);
  };

  const openEditDialog = (u: User) => {
    setSelectedUser(u);
    setFormData({ username: u.username, role: u.role, isActive: u.isActive, password: "", mustChangePassword: u.mustChangePassword ?? false });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (u: User) => {
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const openResetDialog = (u: User) => {
    setSelectedUser(u);
    setFormData((prev) => ({ ...prev, password: "", mustChangePassword: true }));
    setIsResetOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage workspace members and their roles.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
        <div className="flex-1 min-h-0 [&_[data-slot=table-container]]:h-full [&_[data-slot=table-container]]:overflow-auto [&_[data-slot=table-container]]:scrollbar-thin [&_[data-slot=table-container]]:[scrollbar-color:var(--border)_transparent] [&_[data-slot=table-container]]:[&::-webkit-scrollbar-thumb]:rounded-full [&_[data-slot=table-container]]:[&::-webkit-scrollbar-thumb]:bg-border [&_[data-slot=table-container]]:[&::-webkit-scrollbar-track]:bg-transparent [&_[data-slot=table-container]]:[&::-webkit-scrollbar]:w-1.5 [&_[data-slot=table-container]]:[&::-webkit-scrollbar]:h-1.5">
          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_var(--border)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 font-medium text-muted-foreground">Username</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">Role</TableHead>
                <TableHead className="h-11 font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="w-[70px] h-11 font-medium text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={4} className="h-24 text-center py-3 align-middle text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={4} className="h-24 text-center py-3 align-middle text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="border-border/60 hover:bg-muted/20">
                  <TableCell className="font-medium py-3 align-middle">{u.username}</TableCell>
                  <TableCell className="capitalize py-3 align-middle">{u.role}</TableCell>
                  <TableCell className="py-3 align-middle">
                    {u.isActive ? (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-500">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(u)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetDialog(u)}>
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        {currentUser.id !== u.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(u)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
              />
            </Field>
            <Field>
              <FieldLabel>Initial Password</FieldLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
              />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>New Password</FieldLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </Field>
            <Field>
              <FieldLabel>Require change on next login</FieldLabel>
              <Select
                value={formData.mustChangePassword ? "yes" : "no"}
                onValueChange={(val) => setFormData({ ...formData, mustChangePassword: val === "yes" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
