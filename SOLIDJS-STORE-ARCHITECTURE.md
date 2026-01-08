# SolidJS Store Architecture Standard

## Core Philosophy

**Centralized Master Store with Scoped Data Organization** - One authoritative store that organizes data by domain/context rather than multiple isolated stores, optimized for real-time synchronization and cross-context operations.

## Architectural Patterns

### 1. Centralized Master Store Pattern

```typescript
// Master store with domain-scoped data organization
const [store, setStore] = createStore<{
  status: "loading" | "partial" | "complete"
  entities: Entity[]
  // Context-scoped data uses dictionary pattern
  itemsByContext: { [contextID: string]: Item[] }
  metadataByContext: { [contextID: string]: Metadata[] }
  permissionsByContext: { [contextID: string]: Permission[] }
}>()
```

**Principles:**

- Single source of truth for all application state
- Context-scoped data organized as dictionaries keyed by context identifier
- Binary search or similar optimization for efficient array operations
- Avoid creating individual stores per context instance

### 2. Context Provider Standard

```typescript
export const { use: useDomainStore, provider: DomainProvider } = createContext({
  name: "Domain",
  init: () => {
    const [store, setStore] = createStore(initialState)

    // Setup real-time synchronization
    syncService.listen(handleSyncEvent)

    return {
      data: store,
      set: setStore,
      ready: () => store.status === "ready",
      // Domain-specific operations
      operations: createDomainOperations(store, setStore),
    }
  },
})
```

**Principles:**

- Type-safe context creation with consistent interface
- Async initialization with readiness state management
- Encapsulate store creation and synchronization setup
- Provide both data access and operation methods

### 3. Event-Driven Synchronization Pattern

```typescript
syncService.listen((event) => {
  switch (event.type) {
    case "entity.updated":
      // Efficient object reconciliation
      setStore("entities", index, reconcile(event.data))
      break
    case "context.data.updated":
      // Update scoped data imperatively
      setStore("itemsByContext", event.contextID, event.items)
      break
  }
})
```

**Principles:**

- External events drive all state mutations
- Use reconciliation for efficient deep updates
- Update scoped data by context identifier
- Maintain consistency between local and remote state

### 4. Domain Separation Pattern

```typescript
// Global application state
const globalStore = createGlobalStore() // main entities, cross-cutting concerns

// Feature-specific state
const featureStore = createFeatureStore() // UI state, selections, transient data

// User preferences
const preferenceStore = createPreferenceStore() // themes, settings, persistent prefs
```

**Principles:**

- Separate stores by architectural concern, not by instance
- Global state vs feature state vs persistent state
- Each store manages its own synchronization lifecycle
- Clear boundaries between different state domains

### 5. Optimistic Updates with Reconciliation

```typescript
// Apply optimistic update for responsive UI
setStore("entities", entityIndex, reconcile(updatedEntity))

// Server validates and broadcasts authoritative update
// Client reconciles to maintain consistency
```

**Principles:**

- Immediate client-side updates for user responsiveness
- Server remains authoritative for state consistency
- Reconcile client state with authoritative server updates
- Use immutable update patterns for array operations

## Implementation Standards

### File Organization

```
src/stores/
├── global.ts      # Master application state
├── features.ts    # Feature-specific UI state
├── preferences.ts # User preference state
└── utils.ts       # Store creation utilities
```

### Context Organization

```
src/contexts/
├── GlobalContext.tsx   # Global state provider
├── FeatureContext.tsx  # Feature state provider
└── hooks.ts           # Custom context hooks
```

### Key Conventions

- **Stores**: Domain-concern names (`global`, `features`, `preferences`)
- **Context Hooks**: `use[Concern]Store` pattern (`useGlobal`, `useFeatures`)
- **Data Organization**: `{ [contextId: string]: DataType[] }` for scoped data
- **Events**: Descriptive action format (`entity.updated`, `context.changed`)

## Core Rules

1. **Single master store per architectural concern** - avoid store proliferation
2. **Context-scoped data organization** - use dictionary pattern, not per-instance stores
3. **Event-driven state transitions** - no direct state mutation
4. **Efficient reconciliation** - use optimized update patterns
5. **Clear domain separation** - global vs feature vs persistent concerns

## Advanced Patterns

### Lazy Loading Pattern

```typescript
// Load context-specific data on-demand
const loadContextData = async (contextId: string) => {
  if (loadedContexts.has(contextId)) return

  const data = await api.getContextData(contextId)
  setStore("itemsByContext", contextId, data.items)
  loadedContexts.add(contextId)
}
```

### Hierarchical State Pattern

```typescript
// Support parent-child relationships in state
const updateHierarchicalState = (entityId: string, update: Partial<Entity>) => {
  const entity = findEntity(entityId)
  setStore("entities", entity.index, reconcile(update))

  // Cascade to child contexts if needed
  if (entity.childContexts) {
    entity.childContexts.forEach((childId) => {
      // Apply relevant portions of update to children
    })
  }
}
```

This standard provides the architectural foundation for building scalable SolidJS applications with centralized state management, adaptable to any domain while maintaining consistency and performance.

---

_Reference implementation based on centralized store philosophy with scoped data organization pattern._
