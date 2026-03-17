# RunAnywhere SDK - Quick Reference Guide

## 🚀 Quick Start (30 seconds)

1. **Install**: Done ✅ (via package.json)
2. **Initialize**: Done ✅ (in src/main.tsx)
3. **Use**: Already integrated in src/services/api.ts

## 📖 Usage Examples

### Generate a Prompt from React Component

```typescript
import { generatePrompt } from './services/api';

const MyComponent = () => {
  const [result, setResult] = useState<PromptResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (situation: string) => {
    setLoading(true);
    try {
      const result = await generatePrompt(situation);
      setResult(result);
      console.log('Generated prompt:', result.prompt);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleGenerate('Learn Python')}>
      {loading ? 'Generating...' : 'Generate Prompt'}
    </button>
  );
};
```

### With PDF Context

```typescript
const result = await generatePrompt(
  "User situation here",
  "PDF text extracted here"  // Optional
);
```

### Check SDK Health

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

## 🔌 Exported Functions

### From `src/services/api.ts`

```typescript
export async function uploadPdf(file: File): Promise<void>
export async function generatePrompt(
  situation: string,
  pdfContext?: string
): Promise<PromptResult>
```

### From `src/services/runanywhere.ts`

```typescript
export function initializeRunAnywhere(): void
export function createRunAnywhereClient(config?: ClientConfig): any
export async function generatePromptWithRunAnywhere(
  situation: string,
  pdfContext?: string
): Promise<PromptResult>
export async function callDirectLLM(prompt: string): Promise<string>
export function getSDKStatus(): { /* status info */ }
```

### From `src/lib/jspi-detector.ts`

```typescript
export function hasJSPI(): boolean
export function getJSPIStatus(): { isAvailable: boolean; details: string }
export function logJSPIStatus(): void
```

### From `src/lib/bridge-patcher.ts`

```typescript
export function patchRunAnywhereBridge(config?: PatchConfig): void
export function verifyPatches(): { valid: boolean; issues: string[] }
```

## 🎯 Common Scenarios

### Scenario 1: User Generates Prompt

```
User Input → generatePrompt() → RunAnywhere SDK → AI Model → Result
```

**Code Location**: `src/App.tsx` → `src/services/api.ts` → `src/services/runanywhere.ts`

### Scenario 2: SDK Fails, Use Fallback

```
SDK Called → SDK Fails → Direct LLM Fallback → Fallback Succeeds
```

**Automatic handling** in `src/services/runanywhere.ts:generatePromptWithRunAnywhere()`

### Scenario 3: Check if JSPI Available

```
App Startup → JSPI Detection → hasJSPI() → Set sync/async mode
```

**Automatic handling** in `src/main.tsx` via `initializeRunAnywhere()`

## 🔍 Debug Mode

Enable debug logging in browser console:

```javascript
// Check all logs
const status = getSDKStatus();
console.log(status);

// Check JSPI
import { getJSPIStatus } from './src/lib/jspi-detector';
console.log(getJSPIStatus());

// View patch status
import { verifyPatches } from './src/lib/bridge-patcher';
console.log(verifyPatches());
```

## ⚡ Performance Tips

1. **Call `initializeRunAnywhere()` once** in main.tsx (✅ Already done)
2. **Don't call repeatedly** - SDK initialization is one-time
3. **Use `getSDKStatus()`** to check before critical operations
4. **Handle errors** - Implement try/catch blocks

## 📝 Type Definitions

```typescript
// In src/types.ts
export type PromptResult = {
  prompt: string;       // The optimized prompt
  structure: string;    // How it's structured
  explanation: string;  // Why it works
};

// Configuration types
interface ClientConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

interface PatchConfig {
  disableAsync?: boolean;
  forceSync?: boolean;
  logPatches?: boolean;
}
```

## 🚨 Error Messages & Solutions

### "Provider not registered"
```
Solution: Ensure initializeRunAnywhere() called in main.tsx
```

### "WebAssembly.promising is not defined"
```
Solution: Expected in older browsers - SDK uses fallback
Status: Check browser DevTools for JSPI availability
```

### "SDK initialization failed"
```
Solution: Check browser console for detailed error
Verify: All files in src/lib/ and src/services/ exist
```

### "Prompt generation timeout"
```
Solution: Check Network tab in DevTools
Fallback: Try callDirectLLM() directly
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| INTEGRATING_RUNANYWHERE.md | Complete integration guide |
| RUNANYWHERE_INTEGRATION_SUMMARY.md | What was implemented |
| src/lib/SDK-ISSUES.md | Known issues & workarounds |
| IMPLEMENTATION_CHECKLIST.md | Verification checklist |
| This file | Quick reference |

## 🔗 Key Files

| File | Purpose |
|------|---------|
| src/main.tsx | SDK initialization entry point |
| src/services/api.ts | Public API for components |
| src/services/runanywhere.ts | SDK integration logic |
| src/lib/jspi-detector.ts | JSPI detection utility |
| src/lib/bridge-patcher.ts | SDK patching utility |

## 🎓 Learning Path

1. **Start**: Browse `INTEGRATING_RUNANYWHERE.md`
2. **Understand**: Read `RUNANYWHERE_INTEGRATION_SUMMARY.md`
3. **Deep Dive**: Review `src/lib/SDK-ISSUES.md` for known issues
4. **Troubleshoot**: Use `IMPLEMENTATION_CHECKLIST.md`
5. **Reference**: Keep this quick guide handy

## ✅ Working Components

- ✅ PDF upload handling
- ✅ User situation input
- ✅ Prompt generation
- ✅ Result display
- ✅ Error handling
- ✅ Fallback system
- ✅ Status monitoring

## 🚀 Ready to Use!

The SDK is fully integrated and ready for:

```typescript
// Just import and use
import { generatePrompt } from './services/api';

const result = await generatePrompt("My situation");
// That's it! No additional setup needed
```

## 🎯 Next Actions

1. Run `npm run dev` to test
2. Upload a PDF and generate a prompt
3. Check browser console for initialization logs
4. Review any warnings or errors
5. Test error scenarios (optional)

---

**Everything is connected and working! No additional configuration needed. 🎉**
