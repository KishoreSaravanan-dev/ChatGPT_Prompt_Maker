# Integrating RunAnywhere SDK Guide

This guide provides step-by-step instructions for integrating the RunAnywhere SDK into a React + TypeScript frontend application for AI-powered prompt generation.

## Overview

**What this integration does:**
- Provides access to local/remote AI models via RunAnywhere SDK
- Generates optimized prompts based on user input
- Handles SDK compatibility issues (JSPI, provider registration)
- Provides graceful fallbacks if SDK unavailable

**Architecture:**
```
Frontend (React)
    ↓
API Service (services/api.ts)
    ↓
RunAnywhere Service (services/runanywhere.ts)
    ↓
RunAnywhere SDK
    ↓
AI Model (Local or Remote)
```

## Installation

### 1. Install Dependencies

```bash
npm install @runanywhere/web-llamacpp@0.1.0-beta.9
```

### 2. Copy Utility Files

The following files handle SDK compatibility:

```
src/lib/
  ├── jspi-detector.ts      # JSPI availability detection
  ├── bridge-patcher.ts     # SDK patching for compatibility
  └── SDK-ISSUES.md         # Detailed issue documentation
```

These files are already provided in your project.

### 3. Add SDK Service

File: `src/services/runanywhere.ts` (Already created)

This service handles:
- SDK initialization
- Prompt generation
- Error handling and fallbacks

## Usage in Components

### Step 1: Initialize SDK at App Startup

**In `src/main.tsx`:**

```typescript
import { initializeRunAnywhere } from './services/runanywhere';

// Initialize SDK before rendering app
initializeRunAnywhere();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### Step 2: Use in Components

**In any page/component:**

```typescript
import { generatePrompt } from './services/api';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGeneratePrompt = async (situation: string) => {
    setLoading(true);
    try {
      const result = await generatePrompt(situation);
      setPrompt(result.prompt);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your component JSX
  );
};
```

## Key Functions

### `initializeRunAnywhere()`

Initializes the SDK and applies all necessary patches.

**Call once at app startup.**

```typescript
import { initializeRunAnywhere } from './services/runanywhere';

initializeRunAnywhere();
```

### `generatePrompt(situation: string, pdfContext?: string)`

Generates an optimized prompt based on user situation.

```typescript
import { generatePrompt } from './services/api';

const result = await generatePrompt(
  "I want to prepare for a software engineering interview"
);

console.log(result.prompt);      // The optimized prompt
console.log(result.structure);   // How the prompt is structured
console.log(result.explanation); // Why this prompt works
```

### `getSDKStatus()`

Check current SDK status and health.

```typescript
import { getSDKStatus } from './services/runanywhere';

const status = getSDKStatus();
console.log(status);
// {
//   initialized: true,
//   jspiAvailable: true,
//   patchesVerified: true,
//   status: "Ready to generate prompts"
// }
```

### `callDirectLLM(prompt: string)` *(Advanced)*

Direct fallback to llama.cpp if SDK fails.

```typescript
import { callDirectLLM } from './services/runanywhere';

try {
  const response = await callDirectLLM("My prompt here");
} catch (error) {
  console.log('Direct LLM also unavailable');
}
```

## Configuration

### JSPI Detection

The SDK automatically detects JSPI availability:

```typescript
import { hasJSPI, getJSPIStatus } from './src/lib/jspi-detector';

if (!hasJSPI()) {
  console.warn('JSPI not available - performance may be affected');
}

const status = getJSPIStatus();
console.log(status.details);
```

### Custom Patching

If you need custom patch configuration:

```typescript
import { patchRunAnywhereBridge } from './src/lib/bridge-patcher';

patchRunAnywhereBridge({
  disableAsync: true,    // Force sync mode
  forceSync: true,       // No async operations
  logPatches: true,      // Log patch application
});
```

## TypeScript Interfaces

### PromptResult

```typescript
interface PromptResult {
  prompt: string;       // The optimized prompt to use
  structure: string;    // Breakdown of prompt structure
  explanation: string;  // Why this prompt is effective
}
```

## Error Handling

The implementation provides three-tier error handling:

### Tier 1: RunAnywhere SDK
Primary prompt generation service.

### Tier 2: Direct LLM Fallback
If SDK fails, tries direct llama.cpp connection.

### Tier 3: Template Fallback
If all else fails, returns template-based prompt.

```typescript
// This is handled automatically in generatePrompt()
try {
  // Tier 1: SDK
  const result = await generatePromptWithRunAnywhere(situation);
  return result;
} catch (e1) {
  try {
    // Tier 2: Direct LLM
    const response = await callDirectLLM(prompt);
    return parseResponse(response);
  } catch (e2) {
    // Tier 3: Template
    return buildTemplateFallback(situation);
  }
}
```

## PDF Context Support

To use PDF context in prompt generation:

```typescript
import { generatePrompt } from './services/api';

// Extract text from PDF (requires pdfjs-dist)
const pdfText = await extractPdfText(file);

// Generate prompt with context
const result = await generatePrompt(
  "User situation here",
  pdfText  // Optional PDF context
);
```

To extract PDF text, install:

```bash
npm install pdfjs-dist
```

Then use:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ');
  }
  
  return text;
}
```

## Testing

### Test SDK Initialization

In your test file:

```typescript
import { initializeRunAnywhere, getSDKStatus } from './services/runanywhere';

describe('RunAnywhere Integration', () => {
  test('SDK initializes successfully', () => {
    initializeRunAnywhere();
    const status = getSDKStatus();
    expect(status.initialized).toBe(true);
  });

  test('JSPI status is detected', () => {
    const status = getSDKStatus();
    expect(typeof status.jspiAvailable).toBe('boolean');
  });
});
```

### Test Prompt Generation

```typescript
import { generatePrompt } from './services/api';

describe('Prompt Generation', () => {
  test('generates prompt from situation', async () => {
    const result = await generatePrompt('Learn Python');
    
    expect(result.prompt).toBeDefined();
    expect(result.structure).toBeDefined();
    expect(result.explanation).toBeDefined();
  });
});
```

## Troubleshooting

### "Provider not registered" Error

**Cause:** Provider registration didn't complete before model load.

**Fix:**
1. Ensure `initializeRunAnywhere()` is called in `main.tsx`
2. Check console logs for patch application messages
3. Verify `getSDKStatus().patchesVerified` returns true

### "WebAssembly.promising is not defined" Error

**Cause:** JSPI isn't available in your browser/environment.

**Fix:**
1. Check `getJSPIStatus()` output
2. The SDK should automatically fall back to sync mode
3. Update to a browser with JSPI support (Chrome 106+, Edge 106+)

### Prompt Generation Times Out

**Cause:** The AI model is slow or SDK is blocked.

**Fix:**
1. Check browser DevTools → Network tab for hanging requests
2. Verify SDK initialized: `getSDKStatus()`
3. Try `callDirectLLM()` directly to bypass SDK
4. Check console for patch warnings

### SDK Not Initializing

**Cause:** Missing initialization call or import error.

**Fix:**
```typescript
// ✅ CORRECT - Call in main.tsx before rendering
import { initializeRunAnywhere } from './services/runanywhere';
initializeRunAnywhere();

// ❌ WRONG - Calling in JSX component (too late)
export function MyComponent() {
  initializeRunAnywhere(); // Don't do this!
}
```

## Known Issues and Workarounds

See [src/lib/SDK-ISSUES.md](./SDK-ISSUES.md) for:
- Provider registration failures
- JSPI incompatibility
- Bridge initialization timing
- Version pinning rationale

## Upgrading the SDK

When `@runanywhere/web-llamacpp` v0.1.1+ is released:

1. Update version in `package.json`:
   ```json
   "@runanywhere/web-llamacpp": "^0.1.1"
   ```

2. Test thoroughly:
   ```bash
   npm install
   npm run build
   npm test
   ```

3. Review and remove unneeded patches from `bridge-patcher.ts`

4. Update [src/lib/SDK-ISSUES.md](./SDK-ISSUES.md) with fixed status

## Best Practices

### 1. Initialize Early
Always call `initializeRunAnywhere()` in `main.tsx`, not in components.

### 2. Handle Errors
Implement proper error boundaries and loading states:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleGenerate = async (situation: string) => {
  setLoading(true);
  setError(null);
  try {
    const result = await generatePrompt(situation);
    // Use result
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### 3. Use TypeScript
Leverage types for safety:

```typescript
import type { PromptResult } from './types';

const result: PromptResult = await generatePrompt(situation);
```

### 4. Log Status
Check SDK status on app startup:

```typescript
import { getSDKStatus } from './services/runanywhere';

console.log('[App] SDK Status:', getSDKStatus());
```

### 5. Provide User Feedback
Show JSPI warnings if performance may be affected:

```typescript
import { hasJSPI } from './lib/jspi-detector';

if (!hasJSPI()) {
  showNotification({
    type: 'warning',
    message: 'Your browser may have reduced performance. Consider using a modern browser.',
  });
}
```

## Performance Considerations

### With JSPI (Modern Browsers)
- Async calls don't block main thread
- Smooth UI interactions
- Better for long-running operations

### Without JSPI (Older Browsers)
- Synchronous calls may block main thread
- Show loading indicator for user feedback
- Can cause UI jank for 100-500ms during operations

## Next Steps

1. ✅ Install RunAnywhere SDK
2. ✅ Copy utility files (already done)
3. Call `initializeRunAnywhere()` in main App entry point
4. Use `generatePrompt()` in your components
5. Test in your target browsers
6. Review [SDK-ISSUES.md](./SDK-ISSUES.md) for any issues
7. Monitor console logs for warnings/errors

## Support

For issues:
1. Check [SDK-ISSUES.md](./SDK-ISSUES.md)
2. Review browser console for error messages
3. Check RunAnywhere SDK repository: https://github.com/RunanywhereAI/runanywhere-sdks
4. File issues with detailed reproduction steps

## References

- [RunAnywhere SDK Docs](https://github.com/RunanywhereAI/runanywhere-sdks)
- [JSPI Proposal](https://github.com/WebAssembly/jspi)
- [WebAssembly MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [llama.cpp](https://github.com/ggerganov/llama.cpp)
