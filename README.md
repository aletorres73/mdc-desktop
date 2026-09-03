# MDC Desktop

Aplicacion comercial de escritorio para gestionar fabricas, clientes, pedidos,
facturas, comisiones y agenda. La interfaz usa React y TypeScript; la persistencia
y autenticacion usan Firebase; Tauri empaqueta la aplicacion para escritorio.

## Requisitos

- Node.js 20 o superior
- npm
- Rust y las dependencias de Tauri 2 para ejecutar o empaquetar la aplicacion
- Un proyecto Firebase con Authentication por email y Firestore habilitados

## Configuracion local

1. Instala las dependencias:

	```bash
	npm install
	```

2. Copia `.env.example` a `.env.local` y completa las credenciales de la app web
	de Firebase. No subas ese archivo al repositorio.

3. Inicia la interfaz web:

	```bash
	npm run dev
	```

4. Para ejecutar la aplicacion de escritorio:

	```bash
	npm run tauri dev
	```

## Comandos

```bash
npm run build       # Verifica TypeScript y genera dist/
npm run preview     # Sirve la build web localmente
npm run tauri build # Genera los instaladores de escritorio
```

## Estructura

- `src/presentation`: paginas, rutas, hooks y componentes de interfaz.
- `src/domain`: entidades, reglas de negocio y casos de uso.
- `src/data`: datasources, mappers y repositorios Firebase.
- `src/di`: composition root de repositorios y casos de uso.
- `src-tauri`: configuracion y codigo nativo de Tauri.

Las reglas de Firestore y los indices requeridos deben configurarse en el
proyecto Firebase asociado antes de usar datos reales.
