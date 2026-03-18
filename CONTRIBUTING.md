# Contributing to DTMS

## Overview

This repository follows a structured contribution workflow to maintain code quality and consistency. All contributions must go through pull requests.

Repository: <https://github.com/codingstar99222/dtms>

---

## Before You Start

- Check the **Issues** tab for existing tasks
- Do not start work without an issue
- If you want to work on an issue, **comment on it** stating your intention
- Do not assume assignment (contributors are not collaborators)
- If a contributor has already proposed to work on an issue and the owner has approved it, **do not work on or submit changes for that issue**

---

## Contribution Workflow

### 1. Fork the Repository

Create your own copy of the repository:

- Go to: <https://github.com/codingstar99222/dtms>
- Click **Fork**

---

### 2. Clone Your Fork

Clone the forked repository to your local machine:

```bash
git clone https://github.com/<your-username>/dtms.git
cd dtms
```

---

### 3. Add Upstream Remote

Link the original repository:

```bash
git remote add upstream https://github.com/codingstar99222/dtms.git
```

---

### 4. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b <type>/<short-description>
```

#### Branch naming examples

- `fix/task-status-bug`
- `refactor/report-service`
- `feat/add-time-filter`

---

### 5. Make Changes

- Follow existing code structure and conventions
- Ensure type safety (TypeScript)
- Keep changes minimal and focused

---

### 6. Stage Changes

Add modified files:

```bash
git add .
```

---

### 7. Commit Changes

Use clear and structured commit messages:

```bash
git commit -m "<type>: <short description>"
```

#### Examples

- `fix: incorrect task status transition`
- `refactor: simplify report validation logic`
- `feat: add monthly financial summary`

---

### 8. Sync with Upstream

Before pushing, ensure your branch is up to date:

```bash
git fetch upstream
git rebase upstream/main
```

---

### 9. Push to Your Fork

Push your branch:

```bash
git push origin <branch-name>
```

---

### 10. Create Pull Request

- Go to your fork on GitHub
- Click **Compare & pull request**
- Set base repository to:
  `codingstar99222/dtms`
- Provide:
  - Clear title
  - Reference to the issue (e.g., `Closes #12`)
  - Description of changes

---

## Pull Request Rules

- One pull request per issue
- Do not mix unrelated changes
- Ensure the application builds and runs
- Resolve conflicts before requesting review

---

## Code Standards

- Use TypeScript consistently
- Follow modular structure (backend/frontend separation)
- Validate inputs (DTOs, Zod)
- Avoid hardcoded values
- Maintain readability and separation of concerns

---

## Prohibited

- Direct commits to main branch
- Large unstructured changes
- Skipping issue discussion before starting work
- Breaking existing functionality

---

## Before Submitting a PR

1. Run `npm run lint` to check for code style issues
2. Run `npm run typecheck` to verify TypeScript types
3. Run `npm run test` to ensure tests pass
4. Run `npm run build` to verify the build works

## PR Requirements

- ✅ All CI checks must pass
- ✅ No `any` types allowed
- ✅ Test coverage should not decrease
- ✅ PR description must explain the changes
- ✅ Screenshots for UI changes

## Summary

1. Fork  
2. Clone  
3. Create branch  
4. Make changes  
5. Add  
6. Commit  
7. Sync with upstream  
8. Push  
9. Create pull request  
