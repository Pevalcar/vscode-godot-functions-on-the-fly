import * as assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildFunctionBlock,
  buildGetterSetterBlock,
  collectTypedVariables,
  containsFunction,
  inferArgsFromConnectExpression,
  parseVariableDeclaration,
} from "../godotCodegen";

test("parseVariableDeclaration reads typed variables with assignments", () => {
  assert.deepEqual(
    parseVariableDeclaration("var enemies: Array[String] = []"),
    {
      name: "enemies",
      type: "Array[String]",
    },
  );
});

test("parseVariableDeclaration accepts a trailing colon", () => {
  assert.deepEqual(parseVariableDeclaration("var prueba : String:"), {
    name: "prueba",
    type: "String",
  });
});

test("collectTypedVariables indexes multiple typed declarations", () => {
  const variables = collectTypedVariables(`
var timer: Timer
var target: Node2D = $Target
`);

  assert.equal(variables.get("timer"), "Timer");
  assert.equal(variables.get("target"), "Node2D");
});

test("inferArgsFromConnectExpression uses built-in signal signatures", () => {
  const text = `
func _ready():
\tbutton.pressed.connect(on_button_pressed)
`;

  assert.deepEqual(
    inferArgsFromConnectExpression(text, "on_button_pressed"),
    [],
  );
});

test("inferArgsFromConnectExpression infers typed signal arguments", () => {
  const text = `
func _ready():
\tline_edit.text_changed.connect(on_text_changed)
`;

  assert.deepEqual(inferArgsFromConnectExpression(text, "on_text_changed"), [
    { name: "new_text", type: "String" },
  ]);
});

test("buildFunctionBlock formats a callback body", () => {
  assert.equal(
    buildFunctionBlock(
      "on_text_changed",
      [{ name: "new_text", type: "String" }],
      "\n",
      "\t",
    ),
    "func on_text_changed(new_text: String) -> void:\n\tpass",
  );
});

test("buildGetterSetterBlock formats typed accessors", () => {
  assert.equal(
    buildGetterSetterBlock({ name: "player", type: "Node2D" }, "\n", "", "\t"),
    "var player: Node2D:\n\tget:\n\t\treturn player\n\n\tset(value):\n\t\tplayer = value",
  );
});

test("containsFunction finds existing functions", () => {
  assert.equal(
    containsFunction("func get_player():\n\treturn player", "get_player"),
    true,
  );
});
