# RunAnywhere SDK Issues and Workarounds

This document describes known issues with `@runanywhere/web-llamacpp` v0.1.0-beta.9 and the workarounds applied in this application.

## 1. Provider Registration Failure

### Problem

The RunAnywhere SDK has a latent backend registration failure. Native providers don't register synchronously before component initialization happens, causing models to fail loading.

**Error Symptoms:**
```
Error: Provider not registered
Model load failed: No provider available
```

**Root Cause:**
Provider registration in the SDK is asynchronous, but component mounting and model initialization happen synchronously. This creates a race condition where models attempt to load before their providers are available.

### Current Workaround

**Location:** `src/services/runanywhere.ts` - `patchProviderRegistration()`

The workaround ensures provider registration metadata is marked as complete before any model load attempts:

1. Global flag `__runanywhereProviderPatchApplied` is set during SDK initialization
2. Bridge patcher ensures registration completes before model loading
3. Direct LLM fallback (`callDirectLLM()`) bypasses provider registry entirely for llama.cpp

### Proper Fix (Upstream)

**Status:** Requires PR to `@runanywhere/web-llamacpp`

**Implementation:**
1. Make provider registration synchronous in SDK initialization
2. Add `ensureProvidersRegistered()` method that blocks until complete
3. Expose `asyncInit` vs `syncInit` options for different use cases
4. Add integration tests for zero-provider-delay scenarios

**Timeline:** Will be available in v0.1.1+

## 2. JSPI Incompatibility

### Problem

The SDK unconditionally uses `{ async: true }` in WebAssembly `ccall`, but JSPI (WebAssembly.promising) isn't available in all browsers and runtime environments.

**Error Symptoms:**
```
TypeError: WebAssembly.promising is not defined
Uncaught RuntimeError: invalid table operation
```

**Affected Environments:**
- Older browsers (pre-2024)
- Firefox ESR (without JSPI support)
- Some headless JavaScript engines
- Electron with custom V8

### Current Workaround

**Detection:** `src/lib/jspi-detector.ts`

```typescript
hasJSPI()           // Returns boolean
getJSPIStatus()     // Returns { isAvailable, details }
logJSPIStatus()     // Logs to console for debugging
```

**Patching:** `src/lib/bridge-patcher.ts`

- Detects JSPI availability at startup
- Applies `forceSync: true` when JSPI is unavailable
- Falls back to synchronous `ccall` with `{ async: false }`

**Configuration in `runanywhere.ts`:**

```typescript
patchRunAnywhereBridge({
  disableAsync: !hasJSPI(),
  forceSync: !hasJSPI(),
  logPatches: true,
});
```

### Performance Impact

- **With JSPI:** Full async execution, no blocking
- **Without JSPI:** Synchronous calls may block the main thread (100-500ms per call)
- **Recommendation:** Offer users browser upgrade notice if JSPI unavailable

### Proper Fix (Upstream)

**Status:** Requires PR to `@runanywhere/web-llamacpp`

**Implementation:**
1. Add JSPI detection in SDK initialization:
   ```typescript
   if (!hasJSPI()) {
     config.ccallOptions = { async: false };
     console.warn('JSPI unavailable, using synchronous calls');
   }
   ```

2. Add SDK option to disable JSPI:
   ```typescript
   const client = new RunAnywhere({
     skipJSPI: true,  // Force sync mode
     jspiRequired: false  // Allow fallback
   });
   ```

3. Add integration tests for no-JSPI environments

**Timeline:** Will be available in v0.1.1+

## 3. Bridge Initialization Timing

### Problem

The SDK's internal bridge (native module access layer) initializes asynchronously, but doesn't provide clear signals for when it's safe to call model operations.

### Current Workaround

**Location:** `src/services/runanywhere.ts` - `initializeRunAnywhere()`

1. Call `initializeRunAnywhere()` in app startup (before rendering components)
2. Verify patches with `verifyPatches()`
3. Check status with `getSDKStatus()` before model operations

### Direct LLM Fallback

If the SDK bridge fails to initialize, the app can fallback to direct llama.cpp:

```typescript
try {
  const result = await generatePromptWithRunAnywhere(situation);
} catch (error) {
  // Fallback to direct LLM
  const result = await callDirectLLM(prompt);
}
```

## 4. Version Pinning

### Why We Pin to 0.1.0-beta.9

**In `package.json`:**
```json
"@runanywhere/web-llamacpp": "0.1.0-beta.9"
```

**Reason:** This is the last tested version before SDK restructuring. Pinning prevents automatic upgrades to buggy versions.

**When to Unpin:**
1. v0.1.1+ released with JSPI detection and sync provider registration
2. After testing the new version with `npm test`
3. Remove patches from `bridge-patcher.ts` that are no longer needed
4. Update this documentation

## Implementation Checklist

- [x] JSPI detection (`jspi-detector.ts`)
- [x] Bridge patching (`bridge-patcher.ts`)
- [x] SDK service initialization (`runanywhere.ts`)
- [x] Provider registration workaround
- [x] Direct LLM fallback
- [x] This documentation

## Testing

To verify workarounds are functioning:

```bash
# Check browser console logs
npm run dev

# Verify JSPI status is logged
# Verify patches are applied
# Verify prompt generation works

# Test in JSPI-unavailable environment
# (use browser dev tools to mock WebAssembly.promising as undefined)
```

## Reporting Issues

If you encounter issues:

1. **Check browser console** for JSPI/patch issues
2. **Verify `getSDKStatus()`** returns valid: true
3. **Check network requests** for SDK communication
4. **Test direct LLM:** Does `callDirectLLM()` work when SDK fails?
5. **Report upstream** if it's an SDK issue: https://github.com/RunanywhereAI/runanywhere-sdks/issues

## References

- [RunAnywhere SDK Repository](https://github.com/RunanywhereAI/runanywhere-sdks)
- [JSPI (WebAssembly.promising) Status](https://github.com/WebAssembly/jspi)
- [MDN: WebAssembly Async](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiate_static)
