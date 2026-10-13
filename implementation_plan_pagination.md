# Server-Side Pagination Implementation Plan

## Overview
Implemented server-side pagination and filtering for POS Categories and Models modules to improve performance and consistency with the Suppliers module.

## Changes

### 1. Categories Module (`/pos/categories`)
- **Backend (`CategoryController.php`)**:
    - Refactored `index` method to accept `search`, `status`, and `per_page` parameters.
    - Implemented filtering logic using `where` clauses.
    - Added pagination using `paginate()` and `withQueryString()`.
    - Used `through()` to transform paginated data for the frontend.
    - Passed `filters` to the view.

- **Frontend (`CategoriesIndex.tsx`)**:
    - Updated component to receive `PaginatedCategories` and `filters` as props.
    - Implemented `useEffect` for debounced server-side filtering (search, status, per_page).
    - Added `safeCategories` helper to handle potentially undefined pagination data safely.
    - Implemented pagination controls using `links` from the paginated response.
    - Updated `handleAdd` and `handleEditSubmit` to check duplicates against the current page's data (`safeCategories.data`).
    - Added "Items Per Page" dropdown and "Clear Filters" functionality.

### 2. Models Module (`/pos/models`)
- **Backend (`ModelController.php`)**:
    - Refactored `index` method to support server-side pagination and filtering.
    - Implemented filtering for `search` (name, code, brand name) and `status`.
    - Added pagination and data transformation using `through()`.
    - Passed `filters` and `brands` to the view.

- **Frontend (`ModelsIndex.tsx`)**:
    - Updated component to receive `PaginatedModels`, `brands`, and `filters`.
    - Implemented `useEffect` for debounced filtering.
    - Added `safeModels` helper for safe data access.
    - Rendered pagination controls and filter inputs.
    - Updated duplicate checks to use `safeModels.data`.
    - Consistent UI with Categories module.

### 3. Brands Module (`/pos/brands`)
- **Backend (`BrandController.php`)**:
    - Refactored `index` method to support server-side pagination and filtering.
    - Implemented filtering for `search` (name, code) and `status`.
    - Added pagination and data transformation using `through()`.
    - Passed `filters` and `categories` to the view.

- **Frontend (`BrandsIndex.tsx`)**:
    - Updated component to receive `PaginatedBrands`, `categories`, and `filters`.
    - Implemented `useEffect` for debounced filtering.
    - Added `safeBrands` helper for safe data access.
    - Rendered pagination controls and filter inputs.
    - Updated duplicate checks to use `safeBrands.data`.
    - Consistent UI with Categories and Models modules.

## Verification
- **Routes**: Confirmed `pos.categories.index`, `pos.models.index`, and `pos.brands.index` routes exist and point to the updated controllers.
- **Data Flow**: Confirmed `filters` are passed from backend to frontend to maintain state.
- **UI Consistency**: Pagination controls, filter inputs, and stats display are consistent across modules.

## Next Steps for User
- Test standard usage: Create, Edit, Toggle status.
- Test filtering: Search by name/code, filter by status.
- Test pagination: Navigate pages, change items per page.
- Verify "Clear Filters" resets all view state.
