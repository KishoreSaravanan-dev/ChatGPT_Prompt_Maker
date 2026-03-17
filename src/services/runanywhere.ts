/**
 * RunAnywhere SDK Service
 *
 * Initializes RunAnywhere + LlamaCPP backend and handles model
 * registration/download/load before prompt generation.
 */

import { RunAnywhere, LLMFramework, ModelCategory, SDKEnvironment } from '@runanywhere/web';
import { LlamaCPP, TextGeneration } from '@runanywhere/web-llamacpp';
import { patchRunAnywhereBridge, verifyPatches } from '../lib/bridge-patcher';
import { hasJSPI, logJSPIStatus } from '../lib/jspi-detector';
import type { PromptResult } from '../types';

function readEnv(name: string): string | undefined {
  const raw = (import.meta.env[name] as string | undefined) ?? undefined;
  if (!raw) return undefined;
  return raw.trim().replace(/^['\"]|['\"]$/g, '');
}

const DEFAULT_MODEL_ID = 'qwen2.5-0.5b-instruct-q4_0';
const DEFAULT_MODEL_NAME = 'Qwen2.5 0.5B Instruct (Q4_0)';
const DEFAULT_MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf';

const MODEL_PREP_TIMEOUT_MS = 8 * 60 * 1000;
const GENERATION_TIMEOUT_MS = 2 * 60 * 1000;

let sdkInitPromise: Promise<void> | null = null;
let modelReadyPromise: Promise<void> | null = null;
let downloadedModelBytes: Uint8Array | null = null;

type RuntimeModelConfig = {
  id: string;
  name: string;
  url: string;
  framework: LLMFramework;
  modality: ModelCategory;
  memoryRequirement: number;
};

function getModelDefinition(): RuntimeModelConfig {
  const url = (readEnv('VITE_RUNANYWHERE_MODEL_URL') || DEFAULT_MODEL_URL).replace(
    /\?download=true$/,
    ''
  );

  return {
    id: readEnv('VITE_RUNANYWHERE_MODEL_ID') || DEFAULT_MODEL_ID,
    name: readEnv('VITE_RUNANYWHERE_MODEL_NAME') || DEFAULT_MODEL_NAME,
    url,
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: Number(readEnv('VITE_RUNANYWHERE_MODEL_MEMORY_BYTES') || 900000000),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.floor(timeoutMs / 1000)}s`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function downloadModelBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Model download failed with HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error('Model download returned empty data');
  }

  return new Uint8Array(buffer);
}

function getEnvironment(): SDKEnvironment {
  const value = (readEnv('VITE_RUNANYWHERE_ENV') || 'development').toLowerCase();
  if (value === 'production') return SDKEnvironment.Production;
  if (value === 'staging') return SDKEnvironment.Staging;
  return SDKEnvironment.Development;
}

async function ensureSDKInitialized(): Promise<void> {
  if (sdkInitPromise) {
    return sdkInitPromise;
  }

  sdkInitPromise = (async () => {
    logJSPIStatus();

    patchRunAnywhereBridge({
      disableAsync: !hasJSPI(),
      forceSync: !hasJSPI(),
      logPatches: true,
    });

    await RunAnywhere.initialize({
      environment: getEnvironment(),
      debug: (readEnv('VITE_RUNANYWHERE_DEBUG') || 'false') === 'true',
    });

    await LlamaCPP.register();

    RunAnywhere.registerModels([getModelDefinition()]);

    const verification = verifyPatches();
    if (!verification.valid) {
      console.warn('[RunAnywhere] Patch verification issues:', verification.issues);
    }
  })();

  try {
    await sdkInitPromise;
  } catch (error) {
    sdkInitPromise = null;
    throw error;
  }
}

async function ensureModelReady(): Promise<void> {
  if (modelReadyPromise) {
    return modelReadyPromise;
  }

  modelReadyPromise = (async () => {
    await ensureSDKInitialized();

    const modelDef = getModelDefinition();

    if (!downloadedModelBytes) {
      console.log(`[RunAnywhere] Downloading model: ${modelDef.name}`);
      downloadedModelBytes = await withTimeout(
        downloadModelBytes(modelDef.url),
        MODEL_PREP_TIMEOUT_MS,
        'RunAnywhere model download'
      );
      console.log(
        `[RunAnywhere] Model downloaded: ${(downloadedModelBytes.byteLength / 1024 / 1024).toFixed(1)} MB`
      );
    }

    if (!(TextGeneration as any).isModelLoaded) {
      await withTimeout(
        TextGeneration.loadModelFromData({
          model: {
            id: modelDef.id,
            name: modelDef.name,
            url: modelDef.url,
          },
          data: downloadedModelBytes,
        } as any),
        MODEL_PREP_TIMEOUT_MS,
        'RunAnywhere model load'
      );

      if (!(TextGeneration as any).isModelLoaded) {
        throw new Error(`Failed to load RunAnywhere model: ${modelDef.name}`);
      }
    }
  })();

  try {
    await modelReadyPromise;
  } catch (error) {
    modelReadyPromise = null;
    throw error;
  }
}

/**
 * Initialize RunAnywhere SDK configuration.
 */
export function initializeRunAnywhere(): void {
  void ensureSDKInitialized().then(() => {
    const model = getModelDefinition();
    console.log(`[RunAnywhere] Initialized with model: ${model.name}`);
  }).catch((error) => {
    console.error('[RunAnywhere] Initialization failed:', error);
  });
}

/**
 * Generates a structured AI prompt using RunAnywhere SDK.
 */
export async function generatePromptWithRunAnywhere(
  situation: string,
  pdfContext?: string
): Promise<PromptResult> {
  if (!situation.trim()) {
    throw new Error('Situation cannot be empty');
  }

  await ensureModelReady();

  const aiPrompt = buildAIPrompt(situation, pdfContext);
  const generation = await withTimeout(
    TextGeneration.generate(aiPrompt, {
      temperature: 0.7,
      maxTokens: 1200,
    }),
    GENERATION_TIMEOUT_MS,
    'RunAnywhere generation'
  );

  const response = generation.text || '';
  return parseRunAnywhereResponse(response);
}

/**
 * Builds a structured prompt for the AI
 * Incorporates best practices for prompt engineering
 * Uses PDF context if available for enhanced results
 */
function buildAIPrompt(situation: string, pdfContext?: string): string {
  let context = '';
  
  if (pdfContext && pdfContext.trim()) {
    // Include first portion of PDF as knowledge source
    const knowledgeExcerpt = pdfContext.slice(0, 5000);
    context = `

KNOWLEDGE SOURCE (from prompt engineering guide):
${knowledgeExcerpt}

Use the principles, frameworks, and examples from this guide to create the optimal prompt.`;
  }

  return `You are an expert prompt engineering specialist.

Your task is to analyze the user's situation and create an optimized prompt that will help them achieve their goal.${context}

USER SITUATION:
${situation}

Generate a high-quality prompt by following these steps:

1. Understand the core objective from the situation
2. Define the optimal ROLE for the AI to take
3. Specify the exact TASK or GOAL
4. Include relevant CONTEXT or CONSTRAINTS
5. Define the expected OUTPUT FORMAT
6. Add special INSTRUCTIONS for quality improvement

Structure your response as three sections separated by dashes:

PROMPT
--------
The complete optimized prompt to use

STRUCTURE
--------
Explanation of the prompt's architectural components and why each part matters

WHY IT WORKS
--------
Why this prompt is effective for the situation and how to use it

Focus on creating a prompt that is:
- Clear and unambiguous
- Actionable with specific examples
- Optimized for the situation
- Professional and well-structured
- Ready to use immediately`;
}

/**
 * Parses the RunAnywhere API response into structured sections
 * Handles both text-based format with dashes and JSON format
 */
function parseRunAnywhereResponse(response: string): PromptResult {
  try {
    // First try JSON parsing
    try {
      const parsed = JSON.parse(response);
      return {
        prompt: parsed.prompt || '',
        structure: parsed.structure || '',
        explanation: parsed.explanation || '',
      };
    } catch {
      // If JSON fails, try dash-separated format
    }

    // Parse dash-separated format
    // Look for PROMPT, STRUCTURE, and WHY IT WORKS sections
    const promptMatch = response.match(
      /PROMPT\s*-+\s*([\s\S]*?)(?=STRUCTURE\s*-+|$)/i
    );
    const structureMatch = response.match(
      /STRUCTURE\s*-+\s*([\s\S]*?)(?=WHY IT WORKS|EXPLANATION|-+|$)/i
    );
    const explanationMatch = response.match(
      /(?:WHY IT WORKS|EXPLANATION)\s*-+\s*([\s\S]*?)$/i
    );

    const prompt = promptMatch ? promptMatch[1].trim() : response;
    const structure = structureMatch ? structureMatch[1].trim() : '';
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    return {
      prompt: prompt || response,
      structure: structure || 'Prompt structure explanation',
      explanation:
        explanation || 'This prompt is optimized based on prompt engineering principles',
    };
  } catch (error) {
    console.error('[RunAnywhere] Failed to parse response:', error);
    // Return the raw response as prompt with defaults
    return {
      prompt: response,
      structure: 'Unable to parse response structure',
      explanation:
        'The response could not be formatted as expected. Use the prompt as provided.',
    };
  }
}

/**
 * Gets current RunAnywhere integration status.
 */
export function getSDKStatus(): {
  initialized: boolean;
  model: string;
  status: string;
} {
  const model = getModelDefinition();
  const loaded = Boolean((TextGeneration as any).isModelLoaded);

  return {
    initialized: RunAnywhere.isInitialized,
    model: model.name,
    status: loaded
      ? 'RunAnywhere ready. Model loaded.'
      : 'RunAnywhere initialized. Model will download/load on first generate.',
  };
}
