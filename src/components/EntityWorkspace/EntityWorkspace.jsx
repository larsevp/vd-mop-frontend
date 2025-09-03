/**
 * EntityWorkspace - Pure wrapper component
 * 
 * This is just a clean pass-through wrapper to EntityWorkspaceModern.
 * It sets nothing and changes nothing - just forwards all props.
 */

import React from 'react';
import EntityWorkspaceModern from './EntityWorkspaceModern';

/**
 * Pure wrapper - passes all props directly through
 */
const EntityWorkspace = (props) => {
  return <EntityWorkspaceModern {...props} />;
};

export default EntityWorkspace;