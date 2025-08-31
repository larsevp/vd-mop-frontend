/**
 * Manual Emne Change Debugger
 * 
 * This script can be run in the browser console to debug emne change visibility issues.
 * It simulates the exact user workflow and logs every step to identify where entities disappear.
 * 
 * HOW TO USE:
 * 1. Open browser to your krav workspace
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: debugEmneChangeIssue()
 * 5. Follow the console output to identify the bug
 */

window.debugEmneChangeIssue = async function() {
  console.log('🔍 EMNE CHANGE DEBUGGER STARTED');
  console.log('═══════════════════════════════════════');
  
  try {
    // Step 1: Get current React Fiber to access component state
    const reactFiber = document.querySelector('[data-testid="entity-workspace"], .entity-workspace, [class*="EntityWorkspace"]');
    if (!reactFiber) {
      console.warn('❌ Could not find EntityWorkspace component in DOM');
      console.log('💡 Try running this on a krav or tiltak page');
      return;
    }
    
    console.log('✅ Found EntityWorkspace component');
    
    // Step 2: Access React Query client if available
    let queryClient = null;
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React Query detected');
    } else {
      console.log('ℹ️ React Query devtools not available');
    }
    
    // Step 3: Check current URL and entity type
    const currentUrl = window.location.href;
    const entityType = currentUrl.includes('/krav') ? 'krav' : 
                      currentUrl.includes('/tiltak') ? 'tiltak' :
                      currentUrl.includes('/prosjekt-krav') ? 'prosjekt-krav' :
                      currentUrl.includes('/prosjekt-tiltak') ? 'prosjekt-tiltak' :
                      'unknown';
    
    console.log(`📍 Current page: ${entityType}`);
    console.log(`🔗 URL: ${currentUrl}`);
    
    // Step 4: Check for active filters in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search') || '';
    const filterParam = urlParams.get('filter') || '';
    
    console.log('🔍 Active search/filters:');
    console.log(`  Search: "${searchParam}"`);
    console.log(`  Filter: "${filterParam}"`);
    
    // Check localStorage for persistent filters
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes(entityType) || key.includes('filter') || key.includes('emne')
    );
    
    console.log('💾 localStorage filters:');
    localStorageKeys.forEach(key => {
      console.log(`  ${key}: ${localStorage.getItem(key)}`);
    });
    
    // Step 5: Check React Query cache
    if (window.ReactQueryDevtools) {
      console.log('🗄️ Checking React Query cache...');
      // Try to access cache data
    }
    
    // Step 6: Analyze DOM structure
    const entityGroups = document.querySelectorAll('[data-emne-group], [class*="emne-group"], [class*="group"]');
    console.log(`📊 Found ${entityGroups.length} entity groups in DOM`);
    
    entityGroups.forEach((group, index) => {
      const groupTitle = group.querySelector('h2, h3, [class*="title"], [class*="emne"]');
      const entities = group.querySelectorAll('[data-entity-id], [class*="entity"], [class*="krav"], [class*="tiltak"]');
      console.log(`  Group ${index + 1}: ${groupTitle?.textContent || 'Unknown'} (${entities.length} entities)`);
    });
    
    // Step 7: Check for JavaScript errors
    const originalConsoleError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args);
      originalConsoleError.apply(console, args);
    };
    
    // Step 8: Manual emne change simulation instructions
    console.log('');
    console.log('🔧 MANUAL TEST INSTRUCTIONS:');
    console.log('═══════════════════════════════════════');
    console.log('1. Note the current entity groups shown above');
    console.log('2. Find a krav/tiltak and note which group it\'s in');
    console.log('3. Edit that entity and change its emne to a different one');
    console.log('4. Save the changes');
    console.log('5. Run: debugEmneChangeIssue.checkAfterChange() to see what happened');
    console.log('');
    
    // Create a follow-up function
    window.debugEmneChangeIssue.checkAfterChange = function() {
      console.log('🔄 CHECKING AFTER EMNE CHANGE');
      console.log('═══════════════════════════════════');
      
      // Re-analyze DOM
      const newEntityGroups = document.querySelectorAll('[data-emne-group], [class*="emne-group"], [class*="group"]');
      console.log(`📊 Now found ${newEntityGroups.length} entity groups in DOM`);
      
      newEntityGroups.forEach((group, index) => {
        const groupTitle = group.querySelector('h2, h3, [class*="title"], [class*="emne"]');
        const entities = group.querySelectorAll('[data-entity-id], [class*="entity"], [class*="krav"], [class*="tiltak"]');
        console.log(`  Group ${index + 1}: ${groupTitle?.textContent || 'Unknown'} (${entities.length} entities)`);
      });
      
      // Check for new errors
      if (errors.length > 0) {
        console.log('❌ JavaScript errors detected:');
        errors.forEach((error, index) => {
          console.log(`  Error ${index + 1}:`, error);
        });
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      // Check network requests
      console.log('🌐 Check Network tab for recent API calls');
      console.log('🔍 Look for calls to:');
      console.log('  - /api/krav/grouped-by-emne/paginated');
      console.log('  - /api/krav/{id} (PUT request)');
      console.log('  - Any cache invalidation requests');
      
      // Final diagnosis
      console.log('');
      console.log('🩺 DIAGNOSIS CHECKLIST:');
      console.log('═══════════════════════════════');
      console.log('□ Did the entity move to the correct new emne group?');
      console.log('□ Did the entity disappear completely?');
      console.log('□ Are there any JavaScript errors?');
      console.log('□ Did the API calls succeed?');
      console.log('□ Is there a cache invalidation issue?');
      console.log('□ Are there active filters that might hide the entity?');
    };
    
    // Step 9: Check for common bug patterns
    console.log('🚨 CHECKING FOR COMMON BUG PATTERNS:');
    console.log('═══════════════════════════════════');
    
    // Pattern 1: Stale filter state
    const possibleFilterElements = document.querySelectorAll('input[type="text"], select, [data-filter]');
    console.log(`🔍 Found ${possibleFilterElements.length} potential filter elements`);
    
    // Pattern 2: Cache key inconsistencies
    console.log('💾 Cache key patterns to check:');
    console.log('  - Query keys should not include emne-specific data');
    console.log('  - Entity updates should invalidate correct cache keys');
    console.log('  - Optimistic updates should not break grouping');
    
    // Pattern 3: Component state issues
    console.log('⚛️ Component state patterns to check:');
    console.log('  - Active entity state should update after save');
    console.log('  - Group collapse state should persist');
    console.log('  - Filter state should not conflict with emne changes');
    
    console.log('');
    console.log('✅ DEBUGGER SETUP COMPLETE');
    console.log('💡 Now perform the emne change and run checkAfterChange()');
    
  } catch (error) {
    console.error('❌ Debugger failed:', error);
  }
};

// Also create a quick entity finder
window.findEntityInDOM = function(entityId) {
  const selectors = [
    `[data-entity-id="${entityId}"]`,
    `[data-krav-id="${entityId}"]`,
    `[data-tiltak-id="${entityId}"]`,
    `[id="${entityId}"]`,
    `[data-id="${entityId}"]`
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Found entity ${entityId}:`, element);
      console.log('📍 Parent groups:', element.closest('[data-emne-group], [class*="group"]'));
      return element;
    }
  }
  
  console.log(`❌ Entity ${entityId} not found in DOM`);
  return null;
};

// Quick start function
window.debugEmne = window.debugEmneChangeIssue;