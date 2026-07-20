# Workflow Engine

This directory contains the generic, domain-agnostic workflow state machine for the Organ Transport System. It is designed to enforce state transitions centrally, ensuring consistency across all domain modules (Hospital, Donor, Organ, Transport, etc.).

## Public API

All external modules should import from `src/workflow/index.js`. Do not import internal files directly.

```javascript
import { createStateMachine, WORKFLOW_ERRORS } from '../../workflow/index.js';
```

## How to Create a New Workflow

1. Create a new transition map in `src/workflow/transitions/<domain>.transitions.js`.
2. Define the map following the `TransitionMap` contract.
3. Export an instance of the machine for the domain service to use.

### Transition Map Format

A transition map is an object where keys are the **action names** (matching API endpoints) and values are rules specifying valid origins (`from`) and the destination (`to`).

```javascript
// src/workflow/transitions/example.transitions.js
import { createStateMachine } from '../index.js';

export const EXAMPLE_TRANSITIONS = Object.freeze({
  submit: {
    from: ['DRAFT'],
    to: 'PENDING_REVIEW'
  },
  approve: {
    from: ['PENDING_REVIEW'],
    to: 'APPROVED'
  }
});

export const exampleMachine = createStateMachine(EXAMPLE_TRANSITIONS);
```

## Integrating with a Domain Service

In your service layer, pass all state-changing actions through the machine's `transition()` method. 

```javascript
// src/example/services/example.service.js
import { exampleMachine } from '../../workflow/transitions/example.transitions.js';
import { WORKFLOW_ERRORS } from '../../workflow/index.js';

export const submitExample = async (id, actorId) => {
  const entity = await ExampleModel.findById(id);
  
  // This will throw WORKFLOW_ERRORS.INVALID_TRANSITION if not allowed
  const newStatus = exampleMachine.transition(entity.status, 'submit');
  
  entity.status = newStatus;
  await entity.save();
  return entity;
};
```

## Testing

The core engine (`stateMachine.js`) is exhaustively tested in `tests/workflow.stateMachine.test.js`. When adding a new domain, you only need to test the specific transition rules of your domain's map in that test suite.
