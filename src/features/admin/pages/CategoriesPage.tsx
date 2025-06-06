"use client"

import { ArrowUpDown, Edit, Filter, FolderPlus, ImageIcon, MoreHorizontal, Search, Trash } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Textarea } from "../../../components/ui/textarea"
import { useToast } from "../../../hooks/useToast"
import { adminApi } from "../api/adminApi"
import { AdminLayout } from "../components/layout/AdminLayout"
import type { TableState } from "../types"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [totalCategories, setTotalCategories] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tableState, setTableState] = useState<TableState>({
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    sorting: null,
    filters: {
      search: "",
    },
  })
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    slug: "",
  })
  const [editCategory, setEditCategory] = useState<{
    id: string
    name: string
    description: string
    slug: string
  } | null>(null)
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [categoryForImage, setCategoryForImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Refs for file inputs to clear them properly
  const createImageInputRef = useRef<HTMLInputElement>(null)
  const updateImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [tableState])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { pagination, sorting, filters } = tableState

      const params: {
        limit: number
        offset: number
        search?: string
        sort?: string
      } = {
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        search: filters.search || undefined,
      }

      if (sorting && sorting.id) {
        params.sort = `${sorting.id}:${sorting.desc ? "desc" : "asc"}`
      }

      const categoriesData = await adminApi.getCategories(params)

      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      } else {
        // This case should ideally not be hit if adminApi.getCategories is consistent.
        console.warn("adminApi.getCategories did not return an array as expected. Received:", categoriesData)
        setCategories([]) // Fallback to empty array
        // Optionally, show a toast error here if this is unexpected
      }

      // Fetch total categories from dashboard stats for pagination display and 'Next' button logic
      // This assumes totalCategories from stats is the intended source for the overall count.
      try {
        const stats = await adminApi.getDashboardStats()
        setTotalCategories(stats?.totalCategories || 0)
      } catch (statsError) {
        console.error("Error fetching dashboard stats for total categories:", statsError)
        setTotalCategories(0) // Fallback if stats API fails
      }
    } catch (error) {
      console.error("Error in fetchCategories:", error) // Changed from "Error fetching categories:"
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      })
      setCategories([])
      setTotalCategories(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTableState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        search: e.target.value,
      },
      pagination: {
        ...prev.pagination,
        pageIndex: 0,
      },
    }))
  }

  const handleSort = (columnId: string) => {
    setTableState((prev) => ({
      ...prev,
      sorting:
        prev.sorting?.id === columnId ? { id: columnId, desc: !prev.sorting.desc } : { id: columnId, desc: false },
    }))
  }

  const handlePageChange = (pageIndex: number) => {
    setTableState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        pageIndex,
      },
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (isEditDialogOpen && editCategory) {
      setEditCategory((prev) => ({
        ...prev!,
        [name]: value,
      }))

      // Auto-generate slug from name if slug field is empty or if we're editing the name and the slug was auto-generated
      if (name === "name" && (!editCategory.slug || editCategory.slug === generateSlug(editCategory.name))) {
        setEditCategory((prev) => ({
          ...prev!,
          slug: generateSlug(value),
        }))
      }
    } else {
      setNewCategory((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Auto-generate slug from name if slug field is empty or if we're editing the name and the slug was auto-generated
      if (name === "name" && (!newCategory.slug || newCategory.slug === generateSlug(newCategory.name))) {
        setNewCategory((prev) => ({
          ...prev,
          slug: generateSlug(value),
        }))
      }
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (e.target.files && e.target.files[0]) {
      setCategoryImage(e.target.files[0])
    }
  }

  const clearImageSelection = () => {
    setCategoryImage(null)
    if (createImageInputRef.current) {
      createImageInputRef.current.value = ""
    }
    if (updateImageInputRef.current) {
      updateImageInputRef.current.value = ""
    }
  }

  const resetForm = () => {
    setNewCategory({ name: "", description: "", slug: "" })
    setEditCategory(null)
    clearImageSelection()
  }

  const validateCategory = (category: { name: string; description: string; slug: string }) => {
    if (!category.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return false
    }

    if (!category.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Category slug is required",
        variant: "destructive",
      })
      return false
    }

    if (!category.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Category description is required",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleCreateCategory = async () => {
    if (!validateCategory(newCategory)) return

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append("name", newCategory.name)
      formData.append("description", newCategory.description)
      formData.append("slug", newCategory.slug)

      if (categoryImage) {
        formData.append("image", categoryImage)
      }

      const result = await adminApi.createCategory(formData)

      // If we got a result back, add it to the categories list
      if (result && result.id) {
        setCategories((prev) => [result, ...prev])
      } else {
        // Otherwise, refresh the categories list
        await fetchCategories()
      }

      // Reset form
      resetForm()
      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editCategory || !validateCategory(editCategory)) return

    try {
      setIsSubmitting(true)
      const result = await adminApi.updateCategory(editCategory.id, {
        name: editCategory.name,
        description: editCategory.description,
        slug: editCategory.slug,
      })

      // If we got a result back, update the category in the list
      if (result && result.id) {
        setCategories((prev) => prev.map((cat) => (cat.id === result.id ? { ...cat, ...result } : cat)))
      } else {
        // Otherwise, refresh the categories list
        await fetchCategories()
      }

      // Reset form
      resetForm()
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      setIsSubmitting(true)
      await adminApi.deleteCategory(categoryToDelete)

      // Remove the category from the list
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete))

      // Reset state
      setCategoryToDelete(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })

      // Refresh categories list in case of error
      await fetchCategories()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategoryImage = async () => {
    if (!categoryForImage || !categoryImage) {
      toast({
        title: "Validation Error",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append("image", categoryImage)

      const result = await adminApi.updateCategoryImage(categoryForImage, formData)

      // If we got a result back, update the category in the list
      if (result && result.id) {
        setCategories((prev) => prev.map((cat) => (cat.id === result.id ? { ...cat, ...result } : cat)))
      } else {
        // Otherwise, refresh the categories list
        await fetchCategories()
      }

      // Reset state
      setCategoryForImage(null)
      clearImageSelection()
      setIsImageDialogOpen(false)

      toast({
        title: "Success",
        description: "Category image updated successfully",
      })
    } catch (error) {
      console.error("Error updating category image:", error)
      toast({
        title: "Error",
        description: "Failed to update category image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>Add a new category for rental listings.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="category-slug"
                    value={newCategory.slug}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Category description"
                    value={newCategory.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-image">Category Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="create-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e)}
                      className="hidden"
                      ref={createImageInputRef}
                    />
                    <Label
                      htmlFor="create-image"
                      className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {categoryImage ? categoryImage.name : "Choose image"}
                    </Label>
                    {categoryImage && (
                      <Button variant="ghost" size="sm" onClick={clearImageSelection}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories..."
                  className="w-full pl-8"
                  value={tableState.filters.search}
                  onChange={handleSearch}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All categories</DropdownMenuItem>
                  <DropdownMenuItem>Recently added</DropdownMenuItem>
                  <DropdownMenuItem>Most listings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 font-medium"
                      onClick={() => handleSort("slug")}
                    >
                      Slug
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 font-medium"
                      onClick={() => handleSort("created_at")}
                    >
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 animate-pulse rounded bg-muted"></div>
                            <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : totalCategories === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl || "/placeholder.svg?height=100&width=100"}
                              alt={category.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <FolderPlus className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{category.description}</TableCell>
                      <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditCategory({
                                  id: category.id,
                                  name: category.name,
                                  description: category.description,
                                  slug: category.slug,
                                })
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setCategoryForImage(category.id)
                                clearImageSelection()
                                setIsImageDialogOpen(true)
                              }}
                            >
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Update Image
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setCategoryToDelete(category.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {totalCategories > 0 ? tableState.pagination.pageIndex * tableState.pagination.pageSize + 1 : 0} to{" "}
              {Math.min((tableState.pagination.pageIndex + 1) * tableState.pagination.pageSize, totalCategories || 0)}{" "}
              of {totalCategories || 0} categories
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tableState.pagination.pageIndex - 1)}
                disabled={tableState.pagination.pageIndex === 0 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tableState.pagination.pageIndex + 1)}
                disabled={
                  (tableState.pagination.pageIndex + 1) * tableState.pagination.pageSize >= totalCategories ||
                  loading
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Category name"
                value={editCategory?.name || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                name="slug"
                placeholder="category-slug"
                value={editCategory?.slug || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Category description"
                value={editCategory?.description || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Image Dialog */}
      <Dialog
        open={isImageDialogOpen}
        onOpenChange={(open) => {
          setIsImageDialogOpen(open)
          if (!open) {
            setCategoryForImage(null)
            clearImageSelection()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category Image</DialogTitle>
            <DialogDescription>Upload a new image for this category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="update-image">Category Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="update-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                  className="hidden"
                  ref={updateImageInputRef}
                />
                <Label
                  htmlFor="update-image"
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <ImageIcon className="h-4 w-4" />
                  {categoryImage ? categoryImage.name : "Choose image"}
                </Label>
                {categoryImage && (
                  <Button variant="ghost" size="sm" onClick={clearImageSelection}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImageDialogOpen(false)
                setCategoryForImage(null)
                clearImageSelection()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCategoryImage} disabled={isSubmitting || !categoryImage}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                "Upload Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}