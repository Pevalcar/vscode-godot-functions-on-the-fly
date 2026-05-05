import * as vscode from "vscode";
import {
  buildFunctionBlock,
  buildGetterSetterBlock,
  containsFunction,
  escapeRegExp,
  inferArgsFromConnectExpression,
  parseVariableDeclaration,
  SUPPORTED_GDSCRIPT_LANGUAGE_IDS,
  type VariableDeclaration,
} from "./godotCodegen";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "godotFunctionsOnTheFly.createFunction",
      async (editor) => {
        await createMissingFunction(editor);
      },
    ),
    vscode.commands.registerTextEditorCommand(
      "godotFunctionsOnTheFly.createGetterSetter",
      async (editor) => {
        await createGetterSetter(editor);
      },
    ),
  );
}

export function deactivate(): void {}

async function createMissingFunction(editor: vscode.TextEditor): Promise<void> {
  if (!(await ensureGodotGDScriptContext(editor))) {
    return;
  }

  const callbackName = readSelectedIdentifier(editor);
  if (!callbackName) {
    void vscode.window.showWarningMessage(
      "Select a function name or place the cursor over one.",
    );
    return;
  }

  const text = editor.document.getText();
  if (containsFunction(text, callbackName)) {
    void vscode.window.showInformationMessage(
      `Function "${callbackName}" already exists.`,
    );
    return;
  }

  const args = inferArgsFromConnectExpression(text, callbackName);
  const block = buildFunctionBlock(
    callbackName,
    args,
    getEol(editor.document),
    detectIndentation(editor.document),
  );
  await appendBlockAtDocumentEnd(editor, block);
  void vscode.window.showInformationMessage(
    `Created function "${callbackName}".`,
  );
}

async function createGetterSetter(editor: vscode.TextEditor): Promise<void> {
  if (!(await ensureGodotGDScriptContext(editor))) {
    return;
  }

  const currentLine = editor.document.lineAt(editor.selection.active.line).text;
  const selectedIdentifier = readSelectedIdentifier(editor);
  const variable = findVariableDeclaration(
    editor.document,
    editor.selection.active.line,
    selectedIdentifier,
  );
  if (!variable) {
    void vscode.window.showWarningMessage(
      "Could not detect a GDScript variable declaration.",
    );
    return;
  }

  const getterName = `get_${variable.name}`;
  const setterName = `set_${variable.name}`;
  const text = editor.document.getText();

  if (
    containsFunction(text, getterName) ||
    containsFunction(text, setterName)
  ) {
    void vscode.window.showInformationMessage(
      `Getter/setter for "${variable.name}" already exists.`,
    );
    return;
  }

  const block = buildGetterSetterBlock(
    variable,
    getEol(editor.document),
    currentLine.match(/^\s*/)?.[0] ?? "",
    `${currentLine.match(/^\s*/)?.[0] ?? ""}${detectIndentation(editor.document)}`,
  );
  await editor.edit((editBuilder) => {
    editBuilder.replace(
      editor.document.lineAt(editor.selection.active.line).range,
      block,
    );
  });
  void vscode.window.showInformationMessage(
    `Created getter/setter for "${variable.name}".`,
  );
}

async function ensureGodotGDScriptContext(
  editor: vscode.TextEditor,
): Promise<boolean> {
  if (!SUPPORTED_GDSCRIPT_LANGUAGE_IDS.has(editor.document.languageId)) {
    void vscode.window.showWarningMessage(
      "This command only works with GDScript files.",
    );
    return false;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showWarningMessage(
      "Open a Godot project folder to use this extension.",
    );
    return false;
  }

  for (const folder of workspaceFolders) {
    const projectFile = vscode.Uri.joinPath(folder.uri, "project.godot");
    try {
      await vscode.workspace.fs.stat(projectFile);
      return true;
    } catch {
      continue;
    }
  }

  void vscode.window.showWarningMessage(
    "No project.godot found. This extension is only enabled for Godot projects.",
  );
  return false;
}

function readSelectedIdentifier(editor: vscode.TextEditor): string | undefined {
  const { document, selection } = editor;
  const selectedText = document.getText(selection).trim();
  if (selectedText.length > 0) {
    return selectedText.match(/[A-Za-z_][A-Za-z0-9_]*/)?.[0];
  }

  const range = document.getWordRangeAtPosition(
    selection.active,
    /[A-Za-z_][A-Za-z0-9_]*/,
  );
  if (!range) {
    return undefined;
  }

  return document.getText(range);
}

function findVariableDeclaration(
  document: vscode.TextDocument,
  activeLine: number,
  selectedIdentifier?: string,
): VariableDeclaration | undefined {
  const currentLine = document.lineAt(activeLine).text;
  const declarationFromLine = parseVariableDeclaration(currentLine);
  if (declarationFromLine) {
    return declarationFromLine;
  }

  const text = document.getText();

  if (selectedIdentifier) {
    const regex = new RegExp(
      `\\bvar\\s+(${escapeRegExp(selectedIdentifier)})\\s*(?::\\s*([^=\\n]+))?(?:\\s*=.*)?$`,
      "m",
    );
    const match = text.match(regex);
    if (match) {
      return {
        name: match[1],
        type: match[2]?.trim(),
      };
    }
  }

  return undefined;
}

async function appendBlockAtDocumentEnd(
  editor: vscode.TextEditor,
  block: string,
): Promise<void> {
  const text = editor.document.getText();
  const eol = getEol(editor.document);
  const endsWithLineBreak = text.endsWith("\n") || text.endsWith("\r");
  const prefix =
    text.trim().length === 0 ? "" : `${endsWithLineBreak ? "" : eol}${eol}`;
  const suffix = text.endsWith(eol) ? eol : "";

  await editor.edit((editBuilder) => {
    editBuilder.insert(
      editor.document.positionAt(text.length),
      `${prefix}${block}${suffix}`,
    );
  });
}

function detectIndentation(document: vscode.TextDocument): string {
  const lines = document.getText().split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(\s+)\S/);
    if (match) {
      return match[1];
    }
  }

  return "\t";
}

function getEol(document: vscode.TextDocument): string {
  return document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
}
