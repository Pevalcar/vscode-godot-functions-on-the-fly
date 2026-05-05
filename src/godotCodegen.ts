export type FunctionArgument = {
  name: string;
  type?: string;
};

export type VariableDeclaration = {
  name: string;
  type?: string;
};

export const SUPPORTED_GDSCRIPT_LANGUAGE_IDS = new Set([
  "gdscript",
  "gdscript3",
]);

const SIGNAL_SIGNATURES_BY_NAME: Record<string, FunctionArgument[]> = {
  pressed: [],
  timeout: [],
  toggled: [{ name: "toggled_on", type: "bool" }],
  text_changed: [{ name: "new_text", type: "String" }],
  item_selected: [{ name: "index", type: "int" }],
  value_changed: [{ name: "value", type: "float" }],
  body_entered: [{ name: "body", type: "Node" }],
  body_exited: [{ name: "body", type: "Node" }],
};

export function containsFunction(text: string, functionName: string): boolean {
  const regex = new RegExp(
    `^\\s*func\\s+${escapeRegExp(functionName)}\\s*\\(`,
    "m",
  );
  return regex.test(text);
}

export function collectTypedVariables(text: string): Map<string, string> {
  const result = new Map<string, string>();
  const regex = /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=\n]+)/g;

  let match = regex.exec(text);
  while (match) {
    result.set(match[1], match[2].trim());
    match = regex.exec(text);
  }

  return result;
}

export function inferArgsFromConnectExpression(
  text: string,
  callbackName: string,
): FunctionArgument[] {
  const variableTypeByName = collectTypedVariables(text);
  const connectRegex =
    /([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\.connect\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g;

  let match = connectRegex.exec(text);
  while (match) {
    const signalName = match[2];
    const callback = match[3];

    if (callback === callbackName) {
      const fromSignalName = SIGNAL_SIGNATURES_BY_NAME[signalName];
      if (fromSignalName) {
        return fromSignalName;
      }

      const objectName = match[1];
      const objectType = variableTypeByName.get(objectName);
      if (
        objectType &&
        objectType.toLowerCase() === "timer" &&
        signalName === "timeout"
      ) {
        return [];
      }
    }

    match = connectRegex.exec(text);
  }

  return [];
}

export function parseVariableDeclaration(
  line: string,
): VariableDeclaration | undefined {
  const match = line.match(
    /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([^=\n:]+))?(?:\s*=.*)?\s*:?\s*$/,
  );
  if (!match) {
    return undefined;
  }

  return {
    name: match[1],
    type: match[2]?.trim(),
  };
}

export function buildFunctionBlock(
  functionName: string,
  args: FunctionArgument[],
  eol: string,
  indentation: string,
): string {
  const argText = args
    .map((arg) => (arg.type ? `${arg.name}: ${arg.type}` : arg.name))
    .join(", ");

  return [
    `func ${functionName}(${argText}) -> void:`,
    `${indentation}pass`,
  ].join(eol);
}

export function buildGetterSetterBlock(
  variable: VariableDeclaration,
  eol: string,
  lineIndentation: string,
  bodyIndentation: string,
): string {
  return [
    `${lineIndentation}var ${variable.name}${variable.type ? `: ${variable.type}` : ""}:`,
    `${bodyIndentation}get:`,
    `${bodyIndentation}${bodyIndentation}return ${variable.name}`,
    "",
    `${bodyIndentation}set(value):`,
    `${bodyIndentation}${bodyIndentation}${variable.name} = value`,
  ].join(eol);
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
