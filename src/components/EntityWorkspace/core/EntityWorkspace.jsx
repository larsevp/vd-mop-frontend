/**
 * EntityWorkspace - Entry point that uses the working EntityWorkspaceCore
 * Preserves all functionality while maintaining clean folder structure
 */

import React from 'react';
import EntityWorkspaceCore from '../EntityWorkspaceCore';

const EntityWorkspace = (props) => {
  return <EntityWorkspaceCore {...props} />;
};

export default EntityWorkspace;