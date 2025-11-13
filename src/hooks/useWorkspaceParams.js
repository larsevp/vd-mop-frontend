import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserStore, useProjectStore } from '@/stores/userStore';

/**
 * useWorkspaceParams - Hook to sync workspace context between URL params and stores
 *
 * Two-way sync:
 * 1. If URL has params, apply them to stores (URL is source of truth for shared links)
 * 2. If URL missing params but stores have values, add to URL (make URL shareable)
 *
 * This allows:
 * - Sharing links with workspace context preserved
 * - URL always reflects current workspace context
 * - Direct navigation to workspaces maintains context
 *
 * Usage in workspace components:
 * ```
 * useWorkspaceParams();
 * ```
 *
 * URL format:
 * /krav-workspace?fagomradeId=1&projectId=5
 */
export const useWorkspaceParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, setUser } = useUserStore();
  const { currentProject, setCurrentProject } = useProjectStore();

  // Track previous values to prevent unnecessary updates
  const prevValuesRef = useRef({ fagomradeId: null, projectId: null });

  useEffect(() => {
    const fagomradeIdParam = searchParams.get('fagomradeId');
    const projectIdParam = searchParams.get('projectId');

    // STEP 1: Apply URL params to stores if they exist and are different
    if (fagomradeIdParam && user) {
      const fagomradeId = parseInt(fagomradeIdParam, 10);
      if (!isNaN(fagomradeId) && user.fagomradeId !== fagomradeId) {
        setUser({ ...user, fagomradeId });
        prevValuesRef.current.fagomradeId = fagomradeId;
        return; // Exit early to let the next render handle URL sync
      }
    }

    if (projectIdParam) {
      const projectId = parseInt(projectIdParam, 10);
      if (!isNaN(projectId) && currentProject?.id !== projectId) {
        setCurrentProject({ id: projectId });
        prevValuesRef.current.projectId = projectId;
        return; // Exit early to let the next render handle URL sync
      }
    }

    // STEP 2: Add missing params to URL from stores (only if not already done)
    const newParams = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    if (!fagomradeIdParam && user?.fagomradeId && prevValuesRef.current.fagomradeId !== user.fagomradeId) {
      newParams.set('fagomradeId', user.fagomradeId.toString());
      prevValuesRef.current.fagomradeId = user.fagomradeId;
      shouldUpdate = true;
    }

    if (!projectIdParam && currentProject?.id && prevValuesRef.current.projectId !== currentProject.id) {
      newParams.set('projectId', currentProject.id.toString());
      prevValuesRef.current.projectId = currentProject.id;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, user, currentProject, setUser, setCurrentProject, setSearchParams]);
};
