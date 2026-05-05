# Godot Functions On The Fly (VS Code)

> Inspirado en [nhb_functions_on_the_fly](https://github.com/NickHatBoecker/nhb_functions_on_the_fly)

Extensión de VS Code enfocada en flujo GDScript.

## Qué hace

- Crea funciones faltantes al detectar un callback seleccionado.
- Crea `get_`/`set_` para una variable GDScript.
- Solo funciona si:
  - Estás editando un archivo con `languageId` de GDScript (`gdscript` o `gdscript3`).
  - El workspace contiene `project.godot`.

## Comandos

- `Godot: Create Function On The Fly`
- `Godot: Create Getter/Setter On The Fly`

También aparecen en el menú contextual del editor para archivos GDScript.
También tienen atajos por defecto:

- `Ctrl + [` para crear función.
- `Ctrl + '` para crear getter/setter.

En macOS usan `Cmd` en lugar de `Ctrl`.

### Atajos configurables

Sí, los atajos quedan configurables por el usuario desde VS Code.

Para cambiarlos:

1. Abre `Keyboard Shortcuts` con `Ctrl + K`, luego `Ctrl + S`.
2. Busca `Godot: Create Function On The Fly` o `Godot: Create Getter/Setter On The Fly`.
3. Asigna el atajo que prefieras.

Si prefieres editar JSON, abre `Keyboard Shortcuts (JSON)` y añade algo como esto:

```json
[
   {
      "key": "ctrl+alt+f",
      "command": "godotFunctionsOnTheFly.createFunction",
      "when": "editorTextFocus && (resourceLangId == gdscript || resourceLangId == gdscript3)"
   },
   {
      "key": "ctrl+alt+g",
      "command": "godotFunctionsOnTheFly.createGetterSetter",
      "when": "editorTextFocus && (resourceLangId == gdscript || resourceLangId == gdscript3)"
   }
]
```

## Desarrollo local

1. Instala dependencias:
   - `npm install`
2. Compila:
   - `npm run compile`
3. Abre este proyecto en VS Code y presiona `F5` para lanzar Extension Development Host.

## Instalación manual

Si prefieres instalar la extensión sin compilarla, puedes descargar el archivo `.vsix` desde la página de releases:

- https://github.com/Pevalcar/vscode-godot-functions-on-the-fly/releases/tag/0.0.1

Después, en VS Code usa `Extensions: Install from VSIX...` y selecciona el archivo descargado.

## Publicación

1. Verifica que todo compile y pase pruebas:
   - `npm test`
2. Genera el paquete `.vsix`:
   - `npm run package`
3. Inicia sesión en Marketplace con tu publisher:
   - `vsce login pevalcar`
4. Publica la extensión:
   - `npm run publish`

Si todavía no tienes el token de publicación, crea uno en Azure DevOps/Marketplace y guárdalo cuando `vsce login` te lo pida.

## Notas

- La inferencia de argumentos para callbacks usa señales comunes (`pressed`, `text_changed`, etc.) y puede ampliarse fácilmente en `src/extension.ts`.
- Para crear un getter/setter, coloca el cursor sobre una variable declarada con `var` y ejecuta el comando o atajo.
- Para crear una función, coloca el cursor sobre el nombre de la función faltante y ejecuta el comando o atajo.
