# 🏗️ COMPLETE SYSTEM DESIGN: PROJECT TYPES, MASTER CATEGORIES & CUSTOM FIELDS

## 📋 Executive Summary

Design a **flexible, template-based system** that handles:
1. ✅ Multiple project types (Ventures, Apartments, Farm Lands, etc.)
2. ✅ Different property types per project type (Plots, Flats, Villas, etc.)
3. ✅ Master Categories & Subcategories (Units, Facing, etc.) at system level
4. ✅ Project-level category customization (add/edit/inactive)
5. ✅ Custom fields for project-specific and property-specific requirements

**Core Principle:**
```
System Level (Master Templates)
    ↓ Copy/Dump at project creation
Project Level (Customizable)
    ↓ Use in properties
Property Level (With values)
```

---

## 🎯 PART 1: PROJECT TYPES & PROPERTY TYPES

### Project Types in Indian Real Estate

```javascript
// System-level project types
[
  {
    id: "type_venture",
    name: "Venture / Layout",
    slug: "venture",
    property_types: ["plot", "commercial_plot"],
    default_unit: "sq_yards",
    common_amenities: ["roads", "street_lights", "drainage", "water_supply"]
  },
  {
    id: "type_apartment",
    name: "Apartment Complex",
    slug: "apartment",
    property_types: ["flat_1bhk", "flat_2bhk", "flat_3bhk", "flat_4bhk", "penthouse"],
    default_unit: "sq_feet",
    common_amenities: ["lift", "parking", "gym", "swimming_pool", "clubhouse"]
  },
  {
    id: "type_gated_community",
    name: "Gated Community",
    slug: "gated_community",
    property_types: ["independent_house", "villa", "duplex", "row_house"],
    default_unit: "sq_yards",
    common_amenities: ["security", "park", "clubhouse", "sports_complex"]
  },
  {
    id: "type_farm_land",
    name: "Farm Land",
    slug: "farm_land",
    property_types: ["open_plot", "agricultural_land"],
    default_unit: "acres",
    common_amenities: ["bore_well", "fencing", "road_access"]
  },
  {
    id: "type_commercial",
    name: "Commercial Complex",
    slug: "commercial",
    property_types: ["shop", "office_space", "showroom", "warehouse"],
    default_unit: "sq_feet",
    common_amenities: ["parking", "lift", "security", "power_backup"]
  },
  {
    id: "type_mixed",
    name: "Mixed Use Development",
    slug: "mixed",
    property_types: ["residential_flat", "commercial_shop", "office_space"],
    default_unit: "sq_feet",
    common_amenities: ["all"]
  }
]
```

### Property Types Details

```javascript
// Venture / Layout property types
{
  type_id: "plot",
  name: "Plot",
  required_fields: ["area", "facing", "corner_plot"],
  optional_fields: ["dimensions_length", "dimensions_width"],
  pricing_based_on: "per_sq_yard"
}

// Apartment property types
{
  type_id: "flat_2bhk",
  name: "2 BHK Flat",
  required_fields: ["area", "floor", "facing", "balcony_count"],
  optional_fields: ["car_parking", "covered_parking"],
  pricing_based_on: "per_sq_feet"
}

// Gated Community property types
{
  type_id: "villa",
  name: "Villa",
  required_fields: ["plot_area", "built_up_area", "floors", "bedrooms", "bathrooms"],
  optional_fields: ["garage", "garden", "terrace"],
  pricing_based_on: "per_unit"
}

// Farm Land property types
{
  type_id: "agricultural_land",
  name: "Agricultural Land",
  required_fields: ["area", "soil_type", "water_source"],
  optional_fields: ["crop_grown", "irrigation_type"],
  pricing_based_on: "per_acre"
}
```

---

## 🗄️ PART 2: MASTER CATEGORIES SYSTEM

### Database Schema

#### 1. **master_categories** Collection (System Level)

```javascript
{
  id: "mcat_units",
  name: "Units",
  slug: "units",
  description: "Measurement units used across projects",
  category_type: "system",  // system, tenant, project
  
  // For dropdowns/selection
  is_selectable: true,
  allow_multiple: false,
  
  // Subcategories
  has_subcategories: true,
  
  // Icon for UI
  icon: "ruler",
  
  // Sorting
  sort_order: 1,
  
  // Status
  is_active: true,
  is_system_category: true,  // Cannot be deleted
  
  created_at: "2024-01-01T00:00:00Z"
}

// More master categories
{
  id: "mcat_facing",
  name: "Facing Direction",
  slug: "facing",
  description: "Direction the property faces",
  is_selectable: true,
  has_subcategories: true,
  icon: "compass"
}

{
  id: "mcat_corner_plot",
  name: "Corner Plot",
  slug: "corner_plot",
  description: "Whether property is corner plot",
  is_selectable: true,
  has_subcategories: true,  // Yes/No
  icon: "square"
}

{
  id: "mcat_property_status",
  name: "Property Status",
  slug: "property_status",
  description: "Availability status of property",
  is_selectable: true,
  has_subcategories: true,
  icon: "check-circle"
}

{
  id: "mcat_amenities",
  name: "Amenities",
  slug: "amenities",
  description: "Available amenities",
  is_selectable: true,
  allow_multiple: true,  // Can select multiple
  has_subcategories: true,
  icon: "home"
}
```

---

#### 2. **master_subcategories** Collection (System Level)

```javascript
// Units subcategories
[
  {
    id: "msub_sq_feet",
    master_category_id: "mcat_units",
    name: "Square Feet",
    slug: "sq_feet",
    abbreviation: "sq.ft",
    sort_order: 1,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_sq_yards",
    master_category_id: "mcat_units",
    name: "Square Yards",
    slug: "sq_yards",
    abbreviation: "sq.yds",
    sort_order: 2,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_sq_meters",
    master_category_id: "mcat_units",
    name: "Square Meters",
    slug: "sq_meters",
    abbreviation: "sq.m",
    sort_order: 3,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_acres",
    master_category_id: "mcat_units",
    name: "Acres",
    slug: "acres",
    abbreviation: "acres",
    sort_order: 4,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_guntas",
    master_category_id: "mcat_units",
    name: "Guntas",
    slug: "guntas",
    abbreviation: "guntas",
    sort_order: 5,
    is_active: true,
    is_system: true
  }
]

// Facing subcategories
[
  {
    id: "msub_north",
    master_category_id: "mcat_facing",
    name: "North",
    slug: "north",
    sort_order: 1,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_south",
    master_category_id: "mcat_facing",
    name: "South",
    slug: "south",
    sort_order: 2,
    is_active: true
  },
  {
    id: "msub_east",
    master_category_id: "mcat_facing",
    name: "East",
    slug: "east",
    sort_order: 3,
    is_active: true
  },
  {
    id: "msub_west",
    master_category_id: "mcat_facing",
    name: "West",
    slug: "west",
    sort_order: 4,
    is_active: true
  },
  {
    id: "msub_north_east",
    master_category_id: "mcat_facing",
    name: "North-East",
    slug: "north_east",
    sort_order: 5,
    is_active: true
  },
  {
    id: "msub_north_west",
    master_category_id: "mcat_facing",
    name: "North-West",
    slug: "north_west",
    sort_order: 6,
    is_active: true
  },
  {
    id: "msub_south_east",
    master_category_id: "mcat_facing",
    name: "South-East",
    slug: "south_east",
    sort_order: 7,
    is_active: true
  },
  {
    id: "msub_south_west",
    master_category_id: "mcat_facing",
    name: "South-West",
    slug: "south_west",
    sort_order: 8,
    is_active: true
  }
]

// Corner Plot subcategories
[
  {
    id: "msub_yes",
    master_category_id: "mcat_corner_plot",
    name: "Yes",
    slug: "yes",
    sort_order: 1,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_no",
    master_category_id: "mcat_corner_plot",
    name: "No",
    slug: "no",
    sort_order: 2,
    is_active: true,
    is_system: true
  }
]

// Property Status subcategories
[
  {
    id: "msub_available",
    master_category_id: "mcat_property_status",
    name: "Available",
    slug: "available",
    color: "green",
    sort_order: 1,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_blocked",
    master_category_id: "mcat_property_status",
    name: "Blocked",
    slug: "blocked",
    color: "orange",
    sort_order: 2,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_booked",
    master_category_id: "mcat_property_status",
    name: "Booked",
    slug: "booked",
    color: "blue",
    sort_order: 3,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_sold",
    master_category_id: "mcat_property_status",
    name: "Sold",
    slug: "sold",
    color: "gray",
    sort_order: 4,
    is_active: true,
    is_system: true
  },
  {
    id: "msub_resale",
    master_category_id: "mcat_property_status",
    name: "Resale",
    slug: "resale",
    color: "purple",
    sort_order: 5,
    is_active: true
  }
]

// Amenities subcategories (project type specific)
[
  // For Apartments
  {
    id: "msub_lift",
    master_category_id: "mcat_amenities",
    name: "Lift",
    slug: "lift",
    applicable_project_types: ["apartment", "commercial"],
    is_active: true
  },
  {
    id: "msub_gym",
    master_category_id: "mcat_amenities",
    name: "Gymnasium",
    slug: "gym",
    applicable_project_types: ["apartment", "gated_community"],
    is_active: true
  },
  {
    id: "msub_swimming_pool",
    master_category_id: "mcat_amenities",
    name: "Swimming Pool",
    slug: "swimming_pool",
    applicable_project_types: ["apartment", "gated_community"],
    is_active: true
  },
  {
    id: "msub_parking",
    master_category_id: "mcat_amenities",
    name: "Parking",
    slug: "parking",
    applicable_project_types: ["all"],
    is_active: true
  },
  
  // For Ventures
  {
    id: "msub_street_lights",
    master_category_id: "mcat_amenities",
    name: "Street Lights",
    slug: "street_lights",
    applicable_project_types: ["venture", "gated_community"],
    is_active: true
  },
  {
    id: "msub_drainage",
    master_category_id: "mcat_amenities",
    name: "Drainage",
    slug: "drainage",
    applicable_project_types: ["venture", "gated_community"],
    is_active: true
  }
]
```

---

#### 3. **project_categories** Collection (Project Level - Dumped from Master)

```javascript
{
  id: "pcat_123",
  project_id: "project456",
  tenant_id: "tenant123",
  
  // Original master category reference
  master_category_id: "mcat_units",
  
  // Can override name at project level
  name: "Units",  // Can be customized: "Plot Size Units"
  slug: "units",
  
  // Project-level settings
  is_active: true,
  is_required: true,  // For property creation
  
  // Audit
  created_at: "2024-01-15T00:00:00Z",
  created_from: "master_dump",  // or "manual_add"
  modified_at: null
}
```

---

#### 4. **project_subcategories** Collection (Project Level - Dumped from Master)

```javascript
{
  id: "psub_456",
  project_id: "project456",
  tenant_id: "tenant123",
  
  // Link to project category
  project_category_id: "pcat_123",
  
  // Original master subcategory reference
  master_subcategory_id: "msub_sq_yards",
  
  // Can override at project level
  name: "Square Yards",
  slug: "sq_yards",
  abbreviation: "sq.yds",
  
  // Project-level settings
  is_active: true,
  is_default: true,  // Default selection for this project
  sort_order: 1,
  
  // Pricing (if applicable)
  price_per_unit: 5000,  // ₹5000 per sq.yard
  
  // Audit
  created_at: "2024-01-15T00:00:00Z",
  created_from: "master_dump",  // or "manual_add"
  modified_at: null
}
```

---

## 🔄 PART 3: CATEGORY DUMP PROCESS

### Workflow: Creating New Project

```
Step 1: Select Project Type
  └─ User selects: "Venture / Layout"
  
Step 2: Basic Project Details
  └─ Name, Location, etc.
  
Step 3: Select Master Categories to Include ⭐
  └─ Show all master categories in selection mode
  └─ Pre-select commonly used ones
  └─ User can select/deselect
  
Step 4: Dump & Create
  └─ Copy selected master categories to project level
  └─ Copy all their subcategories
  └─ Set defaults based on project type
  └─ Create project
```

### UI Design: Category Selection Screen

```
┌──────────────────────────────────────────────────┐
│  Select Categories for Green Valley Project      │
│  Project Type: Venture / Layout                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  📋 Master Categories Available                  │
│                                                  │
│  ✅ Units (Required)                            │
│     ├─ ☑ Square Feet                            │
│     ├─ ☑ Square Yards (Default)                 │
│     ├─ ☑ Square Meters                          │
│     ├─ ☑ Acres                                  │
│     └─ ☑ Guntas                                 │
│     Select Default: [Square Yards ▼]            │
│                                                  │
│  ✅ Facing Direction (Recommended)              │
│     ├─ ☑ North                                  │
│     ├─ ☑ South                                  │
│     ├─ ☑ East                                   │
│     ├─ ☑ West                                   │
│     ├─ ☑ North-East                             │
│     ├─ ☑ North-West                             │
│     ├─ ☑ South-East                             │
│     └─ ☑ South-West                             │
│                                                  │
│  ✅ Corner Plot (Recommended)                   │
│     ├─ ☑ Yes                                    │
│     └─ ☑ No                                     │
│                                                  │
│  ✅ Property Status (Required)                  │
│     ├─ ☑ Available (Default)                    │
│     ├─ ☑ Blocked                                │
│     ├─ ☑ Booked                                 │
│     ├─ ☑ Sold                                   │
│     └─ ☑ Resale                                 │
│                                                  │
│  ⬜ Amenities (Optional)                        │
│     ├─ ☐ Street Lights                          │
│     ├─ ☐ Drainage System                        │
│     ├─ ☐ Water Supply                           │
│     ├─ ☐ Electricity                            │
│     └─ [Select All for Ventures]               │
│                                                  │
│  ⬜ Soil Type (Optional - for Farm Lands)       │
│                                                  │
│  ℹ️ You can add/edit/deactivate these           │
│     categories later at project level            │
│                                                  │
│  [Select All Recommended] [Clear All]           │
│  [Back] [Skip This Step] [Dump & Create Project]│
└──────────────────────────────────────────────────┘
```

### Backend Process: Dump Categories

```python
@router.post("/api/projects/create")
async def create_project(project_data: ProjectCreateRequest):
    # Step 1: Create project
    project = await create_project_record(project_data)
    
    # Step 2: Dump master categories
    selected_category_ids = project_data.selected_master_categories
    
    for master_cat_id in selected_category_ids:
        # Get master category
        master_cat = await db.master_categories.find_one({"id": master_cat_id})
        
        # Create project category
        project_cat = {
            "id": generate_id(),
            "project_id": project.id,
            "tenant_id": project.tenant_id,
            "master_category_id": master_cat_id,
            "name": master_cat.name,
            "slug": master_cat.slug,
            "is_active": True,
            "created_from": "master_dump"
        }
        await db.project_categories.insert_one(project_cat)
        
        # Get all subcategories for this master category
        master_subcats = await db.master_subcategories.find({
            "master_category_id": master_cat_id,
            "is_active": True
        }).to_list()
        
        # Create project subcategories
        for master_subcat in master_subcats:
            project_subcat = {
                "id": generate_id(),
                "project_id": project.id,
                "tenant_id": project.tenant_id,
                "project_category_id": project_cat.id,
                "master_subcategory_id": master_subcat.id,
                "name": master_subcat.name,
                "slug": master_subcat.slug,
                "is_active": True,
                "created_from": "master_dump"
            }
            await db.project_subcategories.insert_one(project_subcat)
    
    return {"success": True, "project": project}
```

---

## 🔧 PART 4: CUSTOM FIELDS SYSTEM

### Use Cases

**Project-Level Custom Fields:**
- "RERA Registration Number" (text)
- "Possession Date" (date)
- "Bank Loan Partner" (dropdown)
- "Construction Company" (text)

**Property-Level Custom Fields:**
- "Vastu Compliant" (yes/no) - for Ventures
- "Balcony Count" (number) - for Apartments
- "Garden Area" (number) - for Villas
- "Water Source" (dropdown) - for Farm Lands
- "Parking Slots" (number) - for Flats

### Database Schema

#### 5. **custom_fields** Collection

```javascript
{
  id: "cfield_123",
  tenant_id: "tenant123",
  project_id: "project456",  // null for tenant-level fields
  
  // Field details
  field_name: "RERA Registration Number",
  field_slug: "rera_registration_number",
  field_type: "text",  // text, number, dropdown, date, yes_no, multiselect
  
  // Where this field applies
  applies_to: "project",  // project, property, both
  
  // For property fields - which property types
  applicable_property_types: [],  // empty = all types
  
  // Validation
  is_required: true,
  min_value: null,  // for number type
  max_value: null,
  min_length: null,  // for text type
  max_length: 50,
  
  // For dropdown/multiselect
  options: [],  // ["Option 1", "Option 2"]
  
  // Default value
  default_value: null,
  
  // UI
  placeholder: "Enter RERA number",
  help_text: "As per RERA certificate",
  display_order: 1,
  
  // Settings
  is_active: true,
  show_in_list: true,  // Show in property list view
  show_in_details: true,
  
  // Audit
  created_by: "user123",
  created_at: "2024-01-15T00:00:00Z"
}

// Example: Property-level custom field
{
  id: "cfield_456",
  tenant_id: "tenant123",
  project_id: "project456",
  
  field_name: "Vastu Compliant",
  field_slug: "vastu_compliant",
  field_type: "yes_no",
  
  applies_to: "property",
  applicable_property_types: ["plot", "independent_house", "villa"],
  
  is_required: false,
  default_value: "yes",
  
  display_order: 5,
  is_active: true
}
```

---

#### 6. **custom_field_values** Collection

```javascript
{
  id: "cfval_123",
  custom_field_id: "cfield_123",
  
  // What this value belongs to
  entity_type: "project",  // project or property
  entity_id: "project456",
  
  // The actual value
  field_value: "P52100012345",  // RERA number
  
  // For dropdowns - store both
  field_value_id: null,
  field_value_text: "P52100012345",
  
  // Audit
  created_at: "2024-01-15T00:00:00Z",
  updated_at: "2024-02-01T00:00:00Z"
}

// Example: Property custom field value
{
  id: "cfval_456",
  custom_field_id: "cfield_456",
  
  entity_type: "property",
  entity_id: "property789",
  
  field_value: "yes",  // Vastu compliant
  
  created_at: "2024-01-15T00:00:00Z"
}
```

---

## 🎨 UI/UX DESIGNS

### 1. Master Categories Management (Super Admin)

```
┌──────────────────────────────────────────────────┐
│  🏛️ Master Categories Management                 │
│  System-Level Templates                          │
├──────────────────────────────────────────────────┤
│                                                  │
│  [+ Add Master Category] [Import] [Export]       │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📏 Units (8 subcategories)                 │ │
│  │ Used in 245 projects                        │ │
│  │ [View] [Edit] [Manage Subcategories]       │ │
│  ├────────────────────────────────────────────┤ │
│  │ 🧭 Facing Direction (8 subcategories)      │ │
│  │ Used in 230 projects                        │ │
│  │ [View] [Edit] [Manage Subcategories]       │ │
│  ├────────────────────────────────────────────┤ │
│  │ ◻️ Corner Plot (2 subcategories)           │ │
│  │ Used in 180 projects                        │ │
│  │ [View] [Edit] [Manage Subcategories]       │ │
│  ├────────────────────────────────────────────┤ │
│  │ ✅ Property Status (5 subcategories)       │ │
│  │ Used in 245 projects • Required            │ │
│  │ [View] [Edit] [Manage Subcategories]       │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

### 2. Project Categories Management (Tenant Admin)

```
┌──────────────────────────────────────────────────┐
│  📋 Project Categories - Green Valley            │
│  Manage categories specific to this project      │
├──────────────────────────────────────────────────┤
│                                                  │
│  [+ Add Custom Category] [Reset to Master]       │
│                                                  │
│  Categories (4 Active):                          │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ ✅ Units                                    │ │
│  │ 5 options • Default: Square Yards           │ │
│  │ Dumped from Master • Modified               │ │
│  │ [Edit] [Manage Options] [Deactivate]       │ │
│  │                                             │ │
│  │ Options:                                    │ │
│  │ ☑ Square Feet                              │ │
│  │ ☑ Square Yards (Default) ⭐                │ │
│  │ ☑ Square Meters                            │ │
│  │ ☐ Acres (Inactive)                         │ │
│  │ ☑ Guntas                                   │ │
│  │ [+ Add New Option]                         │ │
│  ├────────────────────────────────────────────┤ │
│  │ ✅ Facing Direction                         │ │
│  │ 8 options • No default                      │ │
│  │ Dumped from Master • Not modified           │ │
│  │ [Edit] [Manage Options] [Deactivate]       │ │
│  ├────────────────────────────────────────────┤ │
│  │ ✅ Corner Plot                              │ │
│  │ 2 options • No default                      │ │
│  │ Dumped from Master                          │ │
│  │ [Edit] [Manage Options] [Deactivate]       │ │
│  ├────────────────────────────────────────────┤ │
│  │ ✅ Plot Premium Category (Custom) 🆕       │ │
│  │ 3 options • Default: Regular                │ │
│  │ Created at project level                    │ │
│  │ Options: Regular, Premium, Corner Premium   │ │
│  │ [Edit] [Delete]                            │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

### 3. Custom Fields Management

```
┌──────────────────────────────────────────────────┐
│  🔧 Custom Fields - Green Valley Project         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Tabs: [Project Fields] [Property Fields]        │
│                                                  │
│  Property-Level Custom Fields (3):               │
│  [+ Add Custom Field]                            │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Vastu Compliant                             │ │
│  │ Type: Yes/No • Required: No                 │ │
│  │ Applies to: Plots only                      │ │
│  │ Used in: 45 properties                      │ │
│  │ [Edit] [Delete] [Deactivate]               │ │
│  ├────────────────────────────────────────────┤ │
│  │ Plot Dimensions                             │ │
│  │ Type: Text • Required: No                   │ │
│  │ Applies to: All property types              │ │
│  │ Placeholder: "40x60 feet"                   │ │
│  │ [Edit] [Delete] [Deactivate]               │ │
│  ├────────────────────────────────────────────┤ │
│  │ Distance from Main Road                     │ │
│  │ Type: Number (meters) • Required: No        │ │
│  │ Applies to: All property types              │ │
│  │ Min: 0 • Max: 1000                          │ │
│  │ [Edit] [Delete] [Deactivate]               │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

### 4. Property Creation Form (Using Categories & Custom Fields)

```
┌──────────────────────────────────────────────────┐
│  Add New Property - Green Valley                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Basic Details:                                  │
│                                                  │
│  Property Number * [A-105____________]          │
│                                                  │
│  Property Type * [Plot ▼]                       │
│                                                  │
│  Area * [1200____]  Unit [Square Yards ▼] ⭐    │
│  ℹ️ Default unit for this project               │
│                                                  │
│  Price * ₹ [50,00,000________________]          │
│                                                  │
│  ────────────────────────────────                │
│  Categories (From Master):                       │
│                                                  │
│  Facing * [East ▼]                              │
│  Corner Plot * [Yes ▼]                          │
│  Status * [Available ▼]                         │
│                                                  │
│  ────────────────────────────────                │
│  Custom Fields (Project-Specific):               │
│                                                  │
│  Vastu Compliant [Yes ▼]                        │
│  Plot Dimensions [40x60 feet________]           │
│  Distance from Main Road [50____] meters        │
│                                                  │
│  ────────────────────────────────                │
│  Additional Info:                                │
│                                                  │
│  Block [A____]                                   │
│  Floor (optional) [_____]                        │
│                                                  │
│  [Cancel] [Save Property]                       │
└──────────────────────────────────────────────────┘
```

---

## 📊 COMPLETE MASTER CATEGORIES LIST

### Recommended System-Level Master Categories

```javascript
[
  // 1. Units (Measurement)
  {
    name: "Units",
    subcategories: ["Square Feet", "Square Yards", "Square Meters", "Acres", "Guntas", "Hectares"]
  },
  
  // 2. Facing Direction
  {
    name: "Facing Direction",
    subcategories: ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"]
  },
  
  // 3. Corner Plot
  {
    name: "Corner Plot",
    subcategories: ["Yes", "No"]
  },
  
  // 4. Property Status
  {
    name: "Property Status",
    subcategories: ["Available", "Blocked", "Booked", "Sold", "Resale", "Under Construction"]
  },
  
  // 5. Currency
  {
    name: "Currency",
    subcategories: ["INR (₹)", "USD ($)", "EUR (€)"],
    default: "INR (₹)"
  },
  
  // 6. Amenities
  {
    name: "Amenities",
    subcategories: [
      // Common
      "Parking", "Security", "Power Backup", "Water Supply",
      // Apartments
      "Lift", "Gymnasium", "Swimming Pool", "Clubhouse", "Play Area",
      // Ventures
      "Street Lights", "Drainage", "Roads", "Parks",
      // Gated Community
      "Sports Complex", "Community Hall", "Garden", "Jogging Track"
    ]
  },
  
  // 7. Floor Range (for Apartments)
  {
    name: "Floor",
    subcategories: ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "Penthouse"]
  },
  
  // 8. Bedrooms (for Apartments/Houses)
  {
    name: "Bedrooms",
    subcategories: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"]
  },
  
  // 9. Bathrooms
  {
    name: "Bathrooms",
    subcategories: ["1", "2", "3", "4", "5+"]
  },
  
  // 10. Balconies
  {
    name: "Balconies",
    subcategories: ["0", "1", "2", "3+"]
  },
  
  // 11. Parking Type
  {
    name: "Parking Type",
    subcategories: ["Open Parking", "Covered Parking", "Basement Parking", "No Parking"]
  },
  
  // 12. Furnishing Status
  {
    name: "Furnishing",
    subcategories: ["Unfurnished", "Semi-Furnished", "Fully Furnished"]
  },
  
  // 13. Age of Property
  {
    name: "Age of Property",
    subcategories: ["Under Construction", "Ready to Move", "1-5 Years", "5-10 Years", "10+ Years"]
  },
  
  // 14. Soil Type (for Farm Lands)
  {
    name: "Soil Type",
    subcategories: ["Red Soil", "Black Soil", "Alluvial Soil", "Laterite Soil", "Mixed"]
  },
  
  // 15. Water Source (for Farm Lands)
  {
    name: "Water Source",
    subcategories: ["Bore Well", "Open Well", "Canal", "River", "Rain Water", "No Water"]
  },
  
  // 16. Road Width
  {
    name: "Road Width",
    subcategories: ["20 feet", "30 feet", "40 feet", "60 feet", "100 feet"]
  },
  
  // 17. Construction Type
  {
    name: "Construction Type",
    subcategories: ["RCC", "Load Bearing", "Pre-fabricated", "Steel Frame"]
  },
  
  // 18. Approval Status
  {
    name: "Approval Status",
    subcategories: ["RERA Approved", "DTCP Approved", "HMDA Approved", "Panchayat Approved", "Pending"]
  }
]
```

---

## 🔄 API ENDPOINTS

### Master Categories APIs (Super Admin)

```javascript
// Get all master categories
GET /api/admin/master-categories
Response: { categories: [...], total: 18 }

// Create master category
POST /api/admin/master-categories
Request: { name: "Units", slug: "units", ... }

// Create master subcategory
POST /api/admin/master-categories/{category_id}/subcategories
Request: { name: "Square Feet", slug: "sq_feet", ... }
```

---

### Project Categories APIs

```javascript
// Get project categories (during project creation)
GET /api/master-categories/for-project?project_type=venture
Response: { 
  recommended: [...],  // Based on project type
  all: [...]
}

// Dump master categories to project
POST /api/projects/{project_id}/dump-categories
Request: {
  master_category_ids: ["mcat_units", "mcat_facing", ...],
  defaults: { units: "msub_sq_yards" }
}

// Get project categories
GET /api/projects/{project_id}/categories
Response: { categories: [...] }

// Add custom category to project
POST /api/projects/{project_id}/categories
Request: { name: "Plot Premium", subcategories: ["Regular", "Premium"] }

// Update project subcategory (e.g., deactivate)
PUT /api/projects/{project_id}/subcategories/{subcat_id}
Request: { is_active: false }
```

---

### Custom Fields APIs

```javascript
// Get custom fields for project
GET /api/projects/{project_id}/custom-fields?applies_to=property

// Create custom field
POST /api/projects/{project_id}/custom-fields
Request: {
  field_name: "Vastu Compliant",
  field_type: "yes_no",
  applies_to: "property",
  applicable_property_types: ["plot"],
  is_required: false
}

// Get custom field values for property
GET /api/properties/{property_id}/custom-fields

// Set custom field value
POST /api/properties/{property_id}/custom-fields/{field_id}/value
Request: { field_value: "yes" }
```

---

## 🧪 TEST SCENARIOS

### Test Case 1: Create Project with Category Dump

```
Given: User creates new "Venture" project
When: At category selection step
Then:
  - Shows all master categories
  - Pre-selects: Units, Facing, Corner Plot, Status
  - User selects all pre-selected + Amenities
  - User sets default unit: Square Yards
  - Clicks "Dump & Create Project"
  - System creates:
    - project record
    - 5 project_categories records
    - 40+ project_subcategories records
  - All with project_id linked
  - User can now manage at project level
```

---

### Test Case 2: Add Custom Category at Project Level

```
Given: Project "Green Valley" exists
When: User goes to "Manage Categories"
  And: Clicks "Add Custom Category"
  And: Adds "Plot Premium Category"
  And: Adds subcategories: "Regular", "Premium", "Corner Premium"
Then:
  - Category created with created_from = "manual_add"
  - Not linked to any master category
  - Appears in property creation form
  - Can be used for pricing variations
```

---

### Test Case 3: Deactivate Subcategory at Project Level

```
Given: Project has "Units" category with 5 subcategories
When: User deactivates "Acres"
Then:
  - project_subcategories.is_active = false for "Acres"
  - "Acres" doesn't appear in property creation dropdown
  - Master subcategory unchanged (still active)
  - Existing properties with "Acres" not affected
```

---

### Test Case 4: Create Property with Custom Fields

```
Given: Project has custom field "Vastu Compliant" (yes/no)
When: Creating new property
Then:
  - Property form shows custom field
  - User selects "Yes"
  - Property created
  - custom_field_values record created
  - Property detail page shows "Vastu Compliant: Yes"
```

---

## ❓ QUESTIONS FOR APPROVAL

**Please Review and Confirm:**

### 1. Project Types
- ✅ 6 project types sufficient? (Venture, Apartment, Gated Community, Farm Land, Commercial, Mixed)
- ❓ Need more types?

### 2. Master Categories
- ✅ 18 master categories enough?
- ❓ Need more categories?
- ✅ Category dump process correct?

### 3. Project-Level Customization
- ✅ Allow add/edit/deactivate at project level?
- ✅ Don't affect master categories?
- ✅ Allow custom categories beyond master?

### 4. Custom Fields
- ✅ Support project and property level?
- ✅ 6 field types enough? (text, number, dropdown, date, yes_no, multiselect)
- ❓ Need more field types?

### 5. UI/UX
- ✅ Category selection during project creation?
- ✅ Separate pages for category and custom field management?
- ✅ Show custom fields in property form?

### 6. Implementation
- ❓ 6-8 week timeline okay?
- ❓ Start after multi-role and financial systems?
- ❓ Any modifications needed?

---

## 🎯 NEXT STEPS

After your approval:
1. ✅ Create master categories with all subcategories
2. ✅ Implement category dump process
3. ✅ Create project categories management UI
4. ✅ Implement custom fields system
5. ✅ Update property creation forms
6. ✅ Test all scenarios
7. ✅ Deploy to production

---

**Document Prepared By:** Agent E1
**Date:** November 28, 2024
**Status:** Awaiting Client Approval ⏳
**Complexity:** Very High (Multi-Type System with Dynamic Fields)
