# Technology Stack

## Architecture

Hybrid feature-based + layered architecture. Each feature module (players, session, history) is internally organized as UI → hooks → services → data. Shared core provides database instance, types, and utility functions.

## Core Technologies

- **Language**: TypeScript 5.9 (strict mode)
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3 (mobile-first)
- **Data/Storage**: Dexie.js v4 (IndexedDB)
- **Routing**: React Router v7 (lazy-loaded history route)
- **Testing**: Vitest + Testing Library

## Development Standards

### Type Safety
- TypeScript strict mode enabled
- No `any` — use proper types or `unknown`
- Use `Result<T, E>` discriminated union for service error handling

### Code Quality
- ESLint with TypeScript + React hooks rules
- Tailwind CSS purge in production

### Testing
- Vitest with jsdom environment
- Unit tests for services, hooks, and pure functions
- Integration tests for core flows

## Common Commands
```bash
# Dev: npm run dev
# Build: npm run build
# Test: npm run test
# Test (watch): npm run test:watch
```

---

## Coding Principles

> Source: [Clean Code Developer — Red Degree](https://clean-code-developer.de/en/the-straight/red-degree/)

### 1. DRY (Don't Repeat Yourself)
- Do not write the same logic in multiple places. When duplication is found, extract it into shared functions or utilities.
- Repeated patterns such as validation rules, error-handling patterns, and database connection management should be consolidated into shared modules.
- However, avoid premature abstraction when duplication occurs only twice. Consider refactoring only after the third occurrence (Rule of Three).

### 2. KISS (Keep It Simple, Stupid)
- Choose the simplest implementation that satisfies the requirements. Adopt more complex solutions only after proving that simpler approaches cannot meet the requirements.
- Apply design patterns only when their necessity is clearly justified. Avoid using patterns for their own sake.
- Methods should ideally fit within a single screen. If they exceed that length, consider splitting them into smaller methods.

### 3. Beware of Premature Optimization
- Do not perform optimizations that reduce readability unless performance issues are proven with a profiler.
- Optimize based on measured results rather than assumptions such as "this might be slow."
- First write code that works correctly, then optimize it only when necessary.

### 4. FCoI (Favor Composition over Inheritance)
- Prefer composition (dependency injection, mixins, protocols) over inheritance.
- Leverage TypeScript interfaces and dependency injection patterns to achieve loose coupling.
- Design systems so that dependencies can easily be replaced with mocks during testing.

### 5. IOSP (Integration Operation Segregation Principle)
- Clearly separate methods into **Operation** and **Integration** types:
  - **Operation**: Contains only logic, transformations, and conditionals. It should not call other methods.
  - **Integration**: Contains only calls to other methods and does not implement business logic.
- This separation keeps methods short, easier to test, and easier to understand.

---

> Source: [Clean Code Developer — Orange Degree](https://clean-code-developer.de/en/the-straight/orange-degree/)

### 6. SLA (Single Level of Abstraction)
- Do not mix different abstraction levels within a single method.
- Follow the "newspaper structure": public methods provide high-level summaries, while private methods handle implementation details.

### 7. SRP (Single Responsibility Principle)
- A class/module should have only one responsibility. If it has multiple reasons to change, it should be split.
- If you cannot describe what a module does in a single sentence, it likely has too many responsibilities.

### 8. SoC (Separation of Concerns)
- Do not mix concerns such as logging, validation, error handling, and data access.
- Cross-cutting concerns (logging, tracing) should be separated using decorators or middleware.
- Each module should maintain high cohesion and low coupling, and remain independently testable.

### 9. Source Code Conventions
- Code is read more often than it is written. Maintain consistent naming conventions:
  - TypeScript: `camelCase` for variables and functions, `PascalCase` for classes/interfaces/types, `UPPER_CASE` for constants.
  - File names: `camelCase.ts` for modules, `PascalCase.tsx` for React components.
- Comments should explain **why**, not **what**. The code itself should express what it does.
- Formatter and linter configurations should be shared and maintained consistently across the team.

### 10. Automated Integration Tests
- In addition to unit tests (with mocks), create integration tests to verify interactions between components.
- In CI/CD pipelines, unit tests should run continuously, while integration tests can run conditionally.

---

> Source: [Clean Code Developer — Green Degree](https://clean-code-developer.de/en/the-straight/green-degree/)

### 11. OCP (Open Closed Principle)
- Classes should be open for extension but closed for modification.
- When adding new features, extend the system by adding new classes or modules instead of modifying existing code.
- Leverage TypeScript interfaces or the Strategy pattern to enable behavior substitution.

### 12. Tell, Don't Ask
- Instead of querying an object's state and making decisions externally, instruct the object to perform the action itself.
- Instead of `if obj.status === "failed" { handleError() }`, use `obj.handleIfFailed()`.
- This preserves encapsulation, increases cohesion, and reduces coupling.

### 13. LoD (Law of Demeter)
- "Do not talk to strangers." Avoid deep method chains such as `a.b.c.do()`.
- Only call methods of: the current class, method arguments, related classes, objects created by the class itself.

### 14. Continuous Integration
- Automatically build and run tests whenever code changes are committed to version control.
- Ensure that all team members' code is continuously integrated so errors can be detected early.

### 15. Static Code Analysis
- Use automated tools (ESLint, TypeScript strict mode) to evaluate code quality beyond functional requirements.
- These tools complement manual code reviews and help maintain consistent quality standards.

---

> Source: [Clean Code Developer — Blue Degree](https://clean-code-developer.de/en/the-straight/blue-degree/)

### 16. Design and Implementation Don't Overlap
- Clearly separate the responsibilities of design (architecture) and implementation (code).
- Design defines component structure, dependencies, and boundaries, while implementation focuses on internal details of components.
- Developers should not change the architecture independently. Architectural changes must go through `design.md`.

### 17. Implementation Reflects Design
- The physical code structure (directories, module separation) should faithfully reflect the logical design.
- Component boundaries defined in `design.md` must be visually identifiable in the source code.
- If divergence between design and implementation occurs, update the design first rather than modifying the code arbitrarily.

### 18. YAGNI (You Ain't Gonna Need It)
- Implement only the features that are currently required. Do not implement features based on speculation about future needs.
- Avoid excessive flexibility (configurable parameters, plugin architectures, etc.) until real requirements justify them.
- Complementary to KISS: KISS focuses on simplicity, while YAGNI focuses on implementing only what is necessary.
