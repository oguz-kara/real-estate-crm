export type EvalArgs = { label: string; onlyIds: string[] | null };

export const parseEvalArgs = (args: string[]): EvalArgs => {
  const onlyIndex = args.indexOf('--only');
  const onlyIds =
    onlyIndex === -1 ? null : (args[onlyIndex + 1] ?? '').split(',').filter((id) => id !== '');
  const positional = args.filter(
    (arg, index) => arg !== '--only' && (onlyIndex === -1 || index !== onlyIndex + 1),
  );

  return { label: positional[0] ?? 'deepseek-flash', onlyIds };
};
