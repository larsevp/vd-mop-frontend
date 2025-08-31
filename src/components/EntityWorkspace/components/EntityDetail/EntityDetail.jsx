/**
 * EntityDetail - Clean entry point for entity detail view
 * Uses the existing working EntityDetailPane to preserve functionality
 */

import React from 'react';
import EntityDetailPane from '../../layouts/EntityDetailPane';

const EntityDetail = (props) => {
  return <EntityDetailPane {...props} />;
};

export default EntityDetail;