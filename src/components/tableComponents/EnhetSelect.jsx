import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEnheter } from '../../api/endpoints';
import { getThemeClasses } from '../../hooks/useTheme';

/**
 * EnhetSelec            className={`
            ${getThemeClasses.input.base} relative w-full pl-4 pr-10 py-3 text-left cursor-pointer
            transition-all duration-200 ease-in-out
            ${errors 
              ? getThemeClasses.input.error 
              : ''
            }
            ${isLoading ? 'bg-background-muted cursor-not-allowed' : 'hover:bg-background-muted'}
            ${isOpen ? getThemeClasses.input.focus : ''}
          `}t for hierarchical unit selection
 * Features:
 * - Hierarchical display with indentation
 * - Proper level indicators
 * - Loading and error states
 * - Integration with form validation
 */
export default function EnhetSelect({ 
  name, 
  value, 
  onChange, 
  label, 
  required = false, 
  placeholder = 'Velg enhet...',
  className = ''
}) {
  const [errors, setErrors] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dropdownPosition, setDropdownPosition] = React.useState('bottom');
  const dropdownRef = React.useRef(null);

  const { data: enheter = [], isLoading, error } = useQuery({
    queryKey: ['enheter'],
    queryFn: getEnheter,
    select: (response) => {
      console.log('EnhetSelect API response:', response);
      // Handle both direct array and response.data patterns
      const data = Array.isArray(response) ? response : (response.data || []);
      console.log('EnhetSelect processed data:', data);
      return data;
    }
  });

  // Close dropdown when clicking outside and handle positioning
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    function calculateDropdownPosition() {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // If there's not enough space below (less than 320px for dropdown), show above
        if (spaceBelow < 320 && spaceAbove > spaceBelow) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    }
    
    if (isOpen) {
      calculateDropdownPosition();
      window.addEventListener('scroll', calculateDropdownPosition);
      window.addEventListener('resize', calculateDropdownPosition);
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', calculateDropdownPosition);
      window.removeEventListener('resize', calculateDropdownPosition);
    };
  }, [isOpen]);

  // Sort enheter hierarchically
  const sortedEnheter = React.useMemo(() => {
    console.log('EnhetSelect - Processing enheter for sorting:', enheter);
    if (!enheter.length) return [];

    // Build a tree structure
    const enhetMap = new Map();
    const roots = [];

    // First pass: create map and identify roots
    enheter.forEach(enhet => {
      enhetMap.set(enhet.id, { ...enhet, children: [] });
      // A root is either parentId null/undefined, or parentId equals its own id (self-reference)
      if (!enhet.parentId || enhet.parentId === enhet.id) {
        roots.push(enhet.id);
      }
    });

    console.log('EnhetSelect - Roots:', roots, 'Map size:', enhetMap.size);

    // Second pass: build parent-child relationships
    enheter.forEach(enhet => {
      // Only add as child if parentId exists, is different from own id, and parent exists in map
      if (enhet.parentId && enhet.parentId !== enhet.id && enhetMap.has(enhet.parentId)) {
        enhetMap.get(enhet.parentId).children.push(enhet.id);
      }
    });

    // Flatten the tree in hierarchical order
    const flattenTree = (nodeId, depth = 0) => {
      const node = enhetMap.get(nodeId);
      if (!node) return [];

      const result = [{ ...node, depth }];
      
      // Sort children by name and recursively add them
      node.children
        .sort((a, b) => enhetMap.get(a).navn.localeCompare(enhetMap.get(b).navn))
        .forEach(childId => {
          result.push(...flattenTree(childId, depth + 1));
        });

      return result;
    };

    // Start with root nodes, sorted by name
    const result = roots
      .sort((a, b) => enhetMap.get(a).navn.localeCompare(enhetMap.get(b).navn))
      .flatMap(rootId => flattenTree(rootId));
    
    console.log('EnhetSelect - Sorted result:', result);
    return result;
  }, [enheter]);

  // Filter enheter based on search term
  const filteredEnheter = React.useMemo(() => {
    if (!searchTerm) return sortedEnheter;
    return sortedEnheter.filter(enhet => 
      enhet.navn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedEnheter, searchTerm]);

  // Find selected enhet
  const selectedEnhet = sortedEnheter.find(enhet => enhet.id === value);

  function handleSelect(enhet) {
    console.log('EnhetSelect - handleSelect:', enhet);
    setErrors('');
    setIsOpen(false);
    setSearchTerm('');
    
    onChange({
      target: {
        name,
        value: enhet.id,
        type: 'select'
      }
    });
  }

  function handleClear() {
    setErrors('');
    onChange({
      target: {
        name,
        value: null,
        type: 'select'
      }
    });
  }

  function getIndentedName(enhet) {
    // Use simple visual indicators for hierarchy
    const indicators = {
      0: '', // Root level - no indicator
      1: '├─ ', // First level
      2: '├──', // Second level  
      3: '├───' // Third level and beyond
    };
    
    const indicator = indicators[Math.min(enhet.depth, 3)] || '├───';
    return `${indicator}${enhet.navn}`;
  }

  function getDisplayName(enhet) {
    if (!enhet) return '';
    return getIndentedName(enhet);
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Main trigger button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            ${getThemeClasses.input.base} relative w-full pl-4 pr-10 py-3 text-left cursor-pointer
            transition-all duration-200 ease-in-out
            ${errors 
              ? getThemeClasses.input.error 
              : ''
            }
            ${isLoading ? 'bg-background-muted cursor-not-allowed' : 'hover:bg-background-muted'}
            ${isOpen ? getThemeClasses.input.focus : ''}
          `}
        >
          <span className={`block truncate ${selectedEnhet ? 'text-text-primary' : 'text-text-muted'}`}>
            {isLoading 
              ? 'Laster enheter...' 
              : selectedEnhet 
                ? selectedEnhet.navn 
                : placeholder
            }
          </span>
          
          {/* Dropdown arrow */}
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {selectedEnhet && !isLoading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="mr-2 p-1 hover:bg-background-muted rounded-full transition-colors pointer-events-auto"
              >
                <svg className="w-4 h-4 text-text-muted hover:text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg 
              className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* Dropdown panel */}
        {isOpen && !isLoading && (
          <div 
            className={`
              absolute z-50 w-full bg-background-primary shadow-elevated max-h-80 rounded-lg border border-border-muted overflow-hidden
              ${dropdownPosition === 'top' 
                ? 'bottom-full mb-1' 
                : 'top-full mt-1'
              }
            `}
            style={{
              minHeight: 'fit-content',
              maxHeight: '320px'
            }}
          >
            {/* Search input */}
            <div className="sticky top-0 bg-background-primary border-b border-border-muted p-3">
              <input
                type="text"
                placeholder="Søk etter enhet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={getThemeClasses.input.base}
              />
            </div>
            
            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight: '256px' }}>
              {filteredEnheter.length === 0 ? (
                <div className="px-4 py-3 text-text-muted text-center">
                  {searchTerm ? 'Ingen enheter funnet' : 'Ingen enheter tilgjengelig'}
                </div>
              ) : (
                filteredEnheter.map((enhet) => (
                  <button
                    key={enhet.id}
                    type="button"
                    onClick={() => handleSelect(enhet)}
                    className={`
                      w-full text-left px-4 py-3 hover:bg-background-muted focus:bg-background-muted focus:outline-none
                      transition-colors duration-150 border-b border-border-subtle last:border-b-0
                      ${enhet.id === value ? 'bg-primary-50 text-primary-600' : 'text-text-primary'}
                      ${enhet.depth === 0 ? 'font-semibold' : enhet.depth === 1 ? 'font-medium' : 'font-normal'}
                    `}
                    style={{
                      paddingLeft: `${16 + (enhet.depth * 24)}px`,
                      fontSize: enhet.depth === 0 ? '15px' : '14px'
                    }}
                  >
                    <div className="flex items-center">
                      <span className={`
                        ${enhet.depth === 0 
                          ? 'text-text-primary' 
                          : enhet.depth === 1 
                            ? 'text-text-secondary' 
                            : 'text-text-muted'
                        }
                      `}>
                        {getIndentedName(enhet)}
                      </span>
                      {enhet.id === value && (
                        <svg className="ml-auto w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {errors && (
        <div className="mt-2 flex items-center text-sm text-error-600">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{errors}</span>
        </div>
      )}
    </div>
  );
}
