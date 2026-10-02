# Command Audit Results

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)

---

## 1. `npx expo-doctor`
- **Exit Code**: 1
- **Status**: FAILED (1 issue detected)
- **Output**:
```
Running 21 checks on your project...
20/21 checks passed. 1 checks failed. Possible issues detected:
Use the --verbose flag to see more details about passed checks.

✖ Check that required peer dependencies are installed
Missing peer dependency: expo-font
Required by: @expo/vector-icons
Advice:
Install missing required peer dependency with "npx expo install expo-font"
Your app may crash outside of Expo Go without this dependency. Native module peer dependencies must be installed directly.

1 check failed, indicating possible issues with the project.
```

---

## 2. `npx expo install --check`
- **Exit Code**: 0
- **Status**: PASSED
- **Output**:
```
env: load .env
env: export EXPO_PUBLIC_API_URL
Dependencies are up to date
```

---

## 3. `npm run typecheck` (`tsc --noEmit`)
- **Exit Code**: 0
- **Status**: PASSED
- **Output**:
```
> mediate-mr-mobile@1.0.0 typecheck
> tsc --noEmit
```

---

## 4. `npm run lint`
- **Exit Code**: 1
- **Status**: FAILED (Script missing in package.json)
- **Output**:
```
npm error Missing script: "lint"
npm error
npm error Did you mean this?
npm error   npm link # Symlink a package folder
npm error
npm error To see a list of scripts, run:
npm error   npm run
```

---

## 5. `npm test`
- **Exit Code**: 1
- **Status**: FAILED (Script missing in package.json)
- **Output**:
```
npm error Missing script: "test"
npm error
npm error Did you mean this?
npm error   npm run
```
