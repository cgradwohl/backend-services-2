# AUTOMATION_RUNS_TABLE Entities

# Access Patterns

## Cancelation Token

A unique identifier prefix is required on the pk to prevent collisions across tenants.

- pk: `${tenantId}/${token}`
- sk: `${token}/run/${runId}`

Get Many Cancelation Tokens by Token, TenantId

- pk = `${tenantId}/{token}` AND sk begins_with(`${token}/run/`)

## Run

- pk: `${runId}`
- sk: `${runId}`

Get Run by RunId, TenantId

- pk: `${runId}`
- sk: `${runId}`

## Step

- pk: `${runId}`
- sk: `${runId}/step/${stepId}`

Get Step by StepId and RunId

- pk: `${runId}`
- sk: `${runId}/step/${stepId}`

Get Steps by RunId

- throughput: 3000 rcu per sec
- pk: `${runId}`
- sk: begins_with(`${runId}/step/`)

## Step Reference

- pk: `${runId}/${name}`
- sk: `${runId}/${name}`

Get Step Reference by Name, RunId, TenantId

- pk = `${runId}/${name}`
- sk = `${runId}/${name}`
