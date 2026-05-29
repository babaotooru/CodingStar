import sampleFallbackLookup from '../data/problemSampleLookup.json';

export const SAMPLE_FALLBACK_BUILD_TAG = '2026-05-29-1';

export function pickSampleText(value) {
  if (typeof value !== 'string') return value || '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
  }
  return trimmed;
}

export function getSampleFallback(problemId) {
  if (problemId === null || problemId === undefined) return null;
  const key = String(problemId);
  return sampleFallbackLookup[key] || sampleFallbackLookup[String(parseInt(key, 10))] || null;
}

export function resolveSampleFields(problem) {
  const sampleTestcase = Array.isArray(problem?.testcases)
    ? problem.testcases.find((testcase) => testcase?.isSample) || problem.testcases[0]
    : null;
  const fallback = getSampleFallback(problem?.id);

  const sampleInput = pickSampleText(
    problem?.sampleInput || problem?.sample_input || sampleTestcase?.input || fallback?.sampleInput || ''
  );
  const sampleOutput = pickSampleText(
    problem?.sampleOutput || problem?.sample_output || sampleTestcase?.output || fallback?.sampleOutput || ''
  );
  const sampleExplanation = pickSampleText(
    problem?.sampleExplanation ||
      problem?.sample_explanation ||
      sampleTestcase?.explanation ||
      fallback?.sampleExplanation ||
      ''
  );

  return { sampleInput, sampleOutput, sampleExplanation };
}
