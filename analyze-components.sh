#!/bin/bash

# React Component Dead Code Analyzer
# Analyzes React components to find unused exports, components, and imports

echo "🔍 React Component Dead Code Analysis"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to extract component name from file
get_component_name() {
    local file="$1"
    # Try to find export default, export function, export const, or export class
    grep -E "^export (default |function |const |class )" "$file" | head -1 | \
    sed -E 's/.*export (default |function |const |class )([A-Za-z0-9_]+).*/\2/' | \
    sed 's/default//' | \
    sed 's/^[[:space:]]*//' | \
    sed 's/[[:space:]]*$//'
}

# Function to check if component is used
is_component_used() {
    local component="$1"
    local file="$2"
    local count=0
    
    # Check for JSX usage: <ComponentName
    count=$((count + $(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
        xargs grep -l "<$component\b" 2>/dev/null | grep -v "$file" | wc -l)))
    
    # Check for import usage: import ComponentName
    count=$((count + $(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
        xargs grep -l "import.*\b$component\b" 2>/dev/null | grep -v "$file" | wc -l)))
    
    # Check for from import: from './file'
    local basename=$(basename "$file" .tsx)
    basename=$(basename "$basename" .jsx)
    basename=$(basename "$basename" .ts)
    basename=$(basename "$basename" .js)
    count=$((count + $(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
        xargs grep -l "from.*['\"].*$basename['\"]" 2>/dev/null | grep -v "$file" | wc -l)))
    
    echo $count
}

echo "📁 Finding all component files..."
component_files=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v node_modules | grep -v "\.d\.ts$")

echo "📊 Analysis Results:"
echo

unused_components=()
used_components=()
total_files=0

for file in $component_files; do
    total_files=$((total_files + 1))
    
    # Skip index files and test files
    basename=$(basename "$file")
    if [[ "$basename" == "index."* ]] || [[ "$basename" == *".test."* ]] || [[ "$basename" == *".spec."* ]]; then
        continue
    fi
    
    component=$(get_component_name "$file")
    
    if [ ! -z "$component" ] && [ "$component" != "export" ]; then
        usage_count=$(is_component_used "$component" "$file")
        
        if [ "$usage_count" -eq 0 ]; then
            unused_components+=("$file|$component")
            echo -e "${RED}❌ UNUSED:${NC} $component ${YELLOW}($file)${NC}"
        else
            used_components+=("$file|$component")
            echo -e "${GREEN}✅ USED:${NC} $component ${BLUE}($usage_count references)${NC}"
        fi
    fi
done

echo
echo "📈 Summary:"
echo "==========="
echo -e "Total component files analyzed: ${BLUE}$total_files${NC}"
echo -e "Used components: ${GREEN}${#used_components[@]}${NC}"
echo -e "Unused components: ${RED}${#unused_components[@]}${NC}"

if [ ${#unused_components[@]} -gt 0 ]; then
    echo
    echo -e "${RED}🗑️  Potentially Safe to Remove:${NC}"
    echo "================================"
    for item in "${unused_components[@]}"; do
        IFS='|' read -r file component <<< "$item"
        echo "   $file"
    done
fi

echo
echo "🔍 Checking for unused imports in form/index.tsx..."
if [ -f "src/components/ui/form/index.tsx" ]; then
    echo
    exports=$(grep "^export" src/components/ui/form/index.tsx | sed -E 's/.*\{ ([^}]+) \}.*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    
    for export_item in $exports; do
        if [ ! -z "$export_item" ]; then
            usage_count=$(find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
                xargs grep -l "\b$export_item\b" 2>/dev/null | grep -v "src/components/ui/form/" | wc -l)
            
            if [ "$usage_count" -eq 0 ]; then
                echo -e "${RED}❌ UNUSED EXPORT:${NC} $export_item from form/index.tsx"
            else
                echo -e "${GREEN}✅ USED EXPORT:${NC} $export_item ($usage_count references)"
            fi
        fi
    done
fi

echo
echo "🎯 Recommendations:"
echo "==================="
echo "1. Review files marked as UNUSED before deleting"
echo "2. Check if components are used in dynamic imports or string templates"
echo "3. Verify components aren't used in configuration files or external scripts"
echo "4. Consider keeping generic components (like EntitySelect) even if unused"

echo
echo -e "${GREEN}✨ Analysis complete!${NC}"