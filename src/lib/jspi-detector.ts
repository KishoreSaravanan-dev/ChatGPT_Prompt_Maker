/**
 * JSPI (WebAssembly.promising) Detection and Compatibility Module
 * 
 * The RunAnywhere SDK uses JSPI for async WebAssembly calls, but it's not
 * available in all browsers/environments. This detector helps handle those cases.
 * 
 * @see https://github.com/RunanywhereAI/runanywhere-sdks/issues
 */

/**
 * Detects if JSPI (WebAssembly.promising) is available in the current environment
 * @returns {boolean} True if JSPI is available, false otherwise
 */
export function hasJSPI(): boolean {
  try {
    // Check if WebAssembly.promising is available
    const wa = WebAssembly as any;
    return typeof wa !== 'undefined' && 
           'promising' in wa &&
           typeof wa.promising === 'object';
  } catch {
    return false;
  }
}

/**
 * Gets JSPI availability status and logs it for debugging
 * @returns {object} Status object with isAvailable flag and details
 */
export function getJSPIStatus(): { isAvailable: boolean; details: string } {
  const isAvailable = hasJSPI();
  
  if (isAvailable) {
    return {
      isAvailable: true,
      details: 'JSPI (WebAssembly.promising) is available - async ccall will be used'
    };
  }
  
  return {
    isAvailable: false,
    details: 'JSPI not available - falling back to sync ccall. Performance may be affected.'
  };
}

/**
 * Initializes logging for JSPI availability
 * Call this once at app startup for debugging
 */
export function logJSPIStatus(): void {
  const status = getJSPIStatus();
  console.log(`[RunAnywhere SDK] ${status.details}`);
  
  if (!status.isAvailable) {
    console.warn(
      '[RunAnywhere SDK] JSPI (async WebAssembly) is not available in this browser. ' +
      'This will impact performance of local LLM execution. ' +
      'Consider using a modern browser with JSPI support.'
    );
  }
}
