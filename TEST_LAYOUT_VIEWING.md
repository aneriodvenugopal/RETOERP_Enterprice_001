# Testing Layout Viewing - Step by Step

## Problem Summary:
1. You upload SVG file with plots
2. Plots data is extracted and saved
3. When viewing, all plots appear in top-left corner
4. Layout doesn't show on website

## Solution Steps:

### Step 1: Check Your Existing Layouts
```
URL: http://localhost:3000/layouts
```
This should show list of all your layouts.

### Step 2: Find Your Project ID
```
URL: http://localhost:3000/projects
```
Click on your project to see its ID in the URL.

### Step 3: Link Layout to Project (Backend API)
You need to link your layout to a project. The backend needs:
- project_id
- layout data with plots

### Step 4: View on Website
```
URL: http://localhost:3000/public/project/{PROJECT_ID}
```
Replace {PROJECT_ID} with your actual project ID.

## Quick Test Commands:

### Check if layout exists:
```bash
# Replace with your tenant_id
curl http://localhost:8001/api/layouts?tenant_id=YOUR_TENANT_ID
```

### Check if project has layout:
```bash
# Replace with your project_id
curl http://localhost:8001/api/public/projects/YOUR_PROJECT_ID/layout
```

## What Might Be Wrong:

1. **Coordinate System Mismatch**
   - SVG coordinates might be different from display coordinates
   - Need to see actual plot coordinates to diagnose

2. **Layout Not Linked to Project**
   - Layout exists but not connected to project
   - Need to link them via API

3. **Public Visibility Not Enabled**
   - Layout might not be marked as public
   - Need to check layout settings

## Next Steps:

1. Tell me your project ID
2. Share screenshot of the plots data you see
3. I'll check the coordinate format and fix it
4. I'll help link layout to project for website viewing

