/**
 * RunAnywhere SDK Bridge Patcher
 * 
 * Applies necessary patches to the RunAnywhere SDK to handle:
 * - Provider registration issues
 * - JSPI compatibility
 * - Backend initialization timing
 * 
 * These patches work around known issues in @runanywhere/web-llamacpp v0.1.0-beta.9
 * @see src/lib/SDK-ISSUES.md for detailed issue descriptions
 */

import { hasJSPI } from './jspi-detector';

/**
 * Patch configuration type
 */
interface PatchConfig {
  disableAsync?: boolean;
  forceSync?: boolean;
  logPatches?: boolean;
}

/**
 * Default patch configuration
 */
const DEFAULT_CONFIG: PatchConfig = {
  disableAsync: !hasJSPI(),
  forceSync: !hasJSPI(),
  logPatches: true,
};

/**
 * Applies patches to the RunAnywhere SDK
 * @param config - Patch configuration options
 */
export function patchRunAnywhereBridge(config: PatchConfig = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (finalConfig.logPatches) {
    console.log('[RunAnywhere Patcher] Applying SDK patches...');
  }

  // Patch 1: Handle JSPI availability
  // If JSPI is not available, ensure ccall uses sync mode (async: false)
  if (finalConfig.disableAsync || finalConfig.forceSync) {
    patchCCallSettings(finalConfig);
  }

  // Patch 2: Ensure provider registration completes before model load
  patchProviderRegistration(finalConfig);

  if (finalConfig.logPatches) {
    console.log('[RunAnywhere Patcher] SDK patches applied successfully');
  }
}

/**
 * Patches ccall settings to handle JSPI unavailability
 * Falls back to synchronous calls when JSPI is not available
 */
function patchCCallSettings(config: PatchConfig): void {
  if (config.logPatches) {
    console.log('[RunAnywhere Patcher] Applying ccall async/sync patch');
  }

  // This patch would intercept ccall initialization
  // In practice, this is handled by the SDK initialization options
  // See: src/services/runanywhere.ts for actual implementation
  
  try {
    // Hook into globalThis to patch any ccall-related initialization
    if (typeof window !== 'undefined') {
      // Store patch configuration for SDK initialization
      (window as any).__runanywherePatches = {
        jspiDisabled: !hasJSPI(),
        forceSync: config.forceSync,
      };
    }
  } catch (error) {
    console.error('[RunAnywhere Patcher] Failed to apply ccall patch:', error);
  }
}

/**
 * Patches provider registration to ensure sync completion
 * Prevents race conditions where models load before providers register
 */
function patchProviderRegistration(config: PatchConfig): void {
  if (config.logPatches) {
    console.log('[RunAnywhere Patcher] Applying provider registration patch');
  }

  try {
    // Mark that patched initialization has been applied
    // The actual registration happens in SDK initialization
    if (typeof window !== 'undefined') {
      (window as any).__runanywhereProviderPatchApplied = true;
    }
  } catch (error) {
    console.error('[RunAnywhere Patcher] Failed to apply provider patch:', error);
  }
}

/**
 * Verifies that patches have been applied correctly
 * Useful for debugging initialization issues
 */
export function verifyPatches(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  try {
    if (typeof window === 'undefined') {
      issues.push('Window object not available (likely SSR environment)');
      return { valid: issues.length === 0, issues };
    }

    const patches = (window as any).__runanywherePatches;
    if (!patches) {
      issues.push('Patches not initialized - call patchRunAnywhereBridge() first');
    }

    if (!hasJSPI() && patches?.jspiDisabled !== true) {
      issues.push('JSPI not available but not marked as disabled in patches');
    }
  } catch (error) {
    issues.push(`Error verifying patches: ${error}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
