# Graph Report - Student_Visual_Carrer_Front  (2026-10-13)

## Corpus Check
- Corpus is ~17,773 words - fits in a single context window. You may not need a graph.

## Summary
- 148 nodes · 227 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Build Configuration and DevOps
- Core UI Views and Dashboard
- TypeScript Compiler Configuration
- Community Forum and Discussions
- Build Dependencies and Tooling
- Curriculum Map and Governance Concepts
- Application Versioning and Updates
- Academic Logic and Study Plan State
- Application Entry and DOM Mounting
- Task Management and Progress Concepts
- Brand Visual Identity and Assets
- Vite Environment Type Declarations

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `react` - 16 edges
3. `App()` - 14 edges
4. `navigate()` - 9 edges
5. `Link()` - 7 edges
6. `useStudyPlan()` - 7 edges
7. `scripts` - 4 edges
8. `AdminDashboard()` - 4 edges
9. `ClusterColumn()` - 4 edges
10. `ForumPage()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `allowBuilds.esbuild` --conceptually_related_to--> `vite`  [INFERRED]
  pnpm-workspace.yaml → package.json
- `frontend service` --semantically_similar_to--> `CI Build Job`  [INFERRED] [semantically similar]
  docker-compose.yml → .github/workflows/ci.yml
- `CI Build Job` --references--> `build`  [EXTRACTED]
  .github/workflows/ci.yml → package.json
- `Backend Integration Proxy` --conceptually_related_to--> `frontend service`  [INFERRED]
  README.md → docker-compose.yml
- `App()` --calls--> `ClusterColumn()`  [EXTRACTED]
  src/App.jsx → src/components/ClusterColumn.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Continuous Integration Build Pipeline** — _github_workflows_ci_build_job, package_scripts_build, pnpm_workspace_allow_builds_esbuild [INFERRED 0.85]
- **SPA Entry and Mounting Flow** — index, index_root, src_main, src_app [INFERRED 0.95]
- **Frontend Dockerized Deployment with API Proxy** — docker_compose_frontend, readme_backend_integration, package [INFERRED 0.85]

## Communities (14 total, 4 thin omitted)

### Community 0 - "Build Configuration and DevOps"
Cohesion: 0.07
Nodes (27): CI Build Job, frontend service, author, dependencies, react, react-dom, description, keywords (+19 more)

### Community 1 - "Core UI Views and Dashboard"
Cohesion: 0.22
Nodes (16): react, App(), AdminDashboard(), ForumPage(), Layout(), PlanSelector(), Proposal, StudentPlanEditor() (+8 more)

### Community 2 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, checkJs, isolatedModules, jsx, lib, module (+12 more)

### Community 3 - "Community Forum and Discussions"
Cohesion: 0.13
Nodes (15): CATEGORIES, ForumModalProps, MOCK_POSTS, CATEGORIES, ForumPageProps, MOCK_POSTS, ForumComment, ForumPost (+7 more)

### Community 4 - "Build Dependencies and Tooling"
Cohesion: 0.15
Nodes (12): devDependencies, autoprefixer, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+4 more)

### Community 5 - "Curriculum Map and Governance Concepts"
Cohesion: 0.36
Nodes (6): Curriculum Map Visualization, Institutional Academic Forum, Student Governance & Real-time Voting, Student Visual Carrer Frontend, ClusterColumn(), SubjectNode()

### Community 6 - "Application Versioning and Updates"
Cohesion: 0.29
Nodes (4): CURRENT_VERSION, UpdateItem, UPDATES, UpdatesModalProps

### Community 7 - "Academic Logic and Study Plan State"
Cohesion: 0.71
Nodes (5): useStudyPlan(), getPassedCredits(), getTotalPlanCredits(), isSubjectAvailable(), normalizeData()

### Community 9 - "Task Management and Progress Concepts"
Cohesion: 1.00
Nodes (3): Task Checklist Concept, Task Progress and Completion Tracking, Task List Illustration Icon

### Community 10 - "Brand Visual Identity and Assets"
Cohesion: 1.00
Nodes (3): Application Visual Identity Branding, Wolf Mascot and Avatar Motif, Wolf Head Vector Graphic

## Knowledge Gaps
- **68 isolated node(s):** `name`, `version`, `type`, `packageManager`, `dev` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 78 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Core UI Views and Dashboard` to `Build Configuration and DevOps`, `Community Forum and Discussions`, `Curriculum Map and Governance Concepts`, `Application Versioning and Updates`, `Academic Logic and Study Plan State`, `Application Entry and DOM Mounting`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Build Dependencies and Tooling` to `Build Configuration and DevOps`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build Configuration and DevOps` be split into smaller, more focused modules?**
  _Cohesion score 0.06628787878787878 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community Forum and Discussions` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._