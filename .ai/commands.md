# Comandos del proyecto

_Ejecutar siempre desde la raíz del proyecto (donde está `angular.json`)._

## Desarrollo
```bash
npm start                 # ng serve → http://localhost:4200 (o --port 8100)
# jugable con teclado; añade ?dev=1 a la URL para overlay de fps/draw calls
```

## Build
```bash
npm run build             # producción → www/
npm run lint              # ESLint
npm test                  # Karma/Jasmine (specs del starter; dominio aún sin tests)
```

## iOS (Capacitor) — requiere Xcode + CocoaPods
```bash
npm run build             # SIEMPRE antes de sync (Capacitor copia www/)
npx cap add ios           # solo la primera vez: genera ios/
npx cap sync ios          # copia www/ + plugins al proyecto nativo
npx cap open ios          # abre Xcode: firmar, orientación landscape, AppIcon, splash
# En Xcode: Product → Run en un dispositivo/simulador
```

## Android (opcional, mismo flujo)
```bash
npx cap add android && npx cap sync android && npx cap open android
```

## Redesplegar la versión web en Higgsfield (legado)
1. `npm run build`
2. Añadir a `www/` el stub `logic.js` (ver docs/decisions.md D11; el stub está documentado
   en el historial: exporta meta/setup/validateAction/applyAction/isGameOver/viewFor).
3. Zip del CONTENIDO de `www/` (index.html en la raíz del zip).
4. Subir con `media_upload` → PUT → `media_confirm` (MCP Higgsfield) y llamar `deploy_game`
   **con** `game_id: f54a41b9-0b44-4ab2-90b0-4540bdab20fb` (¡nunca sin él!).

## Git
```bash
git status && git log --oneline
git add -A && git commit -m "mensaje en español"
# push: configurar remoto primero (git remote add origin <url>)
```
