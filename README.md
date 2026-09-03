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

## Estado actual (Sesión 2025-09-03)

### ✅ Completado
- Fixtures compartidos con datos Android (700+ líneas)
- Tests de dominio: 19/19 recalculate tests PASANDO
- Algoritmo de comisiones alineado con Android (factory.name como clave)
- Alta de factura desde pedido (CreateInvoiceFromOrderUseCase + mappers)
- Reglas de Firestore con acceso por UID y validación de suscripción
- Build Tauri compilando exitosamente

### 🔄 En progreso
- Reparación de encoding UTF-8 en tests de CommissionCalculator (10/18 pasando)

### 📋 Próximas tareas P0
- Edición de factura con recalculation
- Eliminación de factura con confirmación UI
- Registro de pago y movimientos virtuales
- Conciliación/imputación de pagos

### 🧪 Tests

```bash
npm run test                              # Ejecutar todos los tests
npm run test:watch                        # Watch mode
npm run test:ui                           # UI interactiva
npm run test -- domain/logic/             # Solo tests de dominio
npm run test -- domain/logic/recalculate  # Test específico
```

**Status**: 30/37 tests pasando (19 recalculate ✅, 10 commission en reparación)

**Status**: ✨ **37/37 tests PASANDO** ✨
- recalculate.test.ts: 19/19 ✅
- commissionCalculator.test.ts: 18/18 ✅
- Build: Exitoso (no errores TS)
### 📁 Estructura relevante

- `src/domain/` - Lógica de negocio, entidades, interfaces
- `src/data/` - Mappers, repositorios, datasources Firebase
- `src/__tests__/` - Fixtures (700+ líneas) y tests de dominio
- `.context/` - Documentación de tareas y guías
  - `TAREAS_PARIDAD.md` - Checklist de paridad Android/Desktop
  - `NEXT_STEPS.md` - Guía para siguientes tareas P0
  - `PARIDAD_ANDROID_DESKTOP.md` - Mapeo de equivalencias
- `firestore.rules` - Reglas de seguridad (compiladas)

### 🚨 Notas importantes

1. **Mapeo crítico**: `BillingModel.brand` DEBE coincidir con `FactoryModel.name`
	- Esto es requerido por CommissionCalculator
	- Ver `src/domain/logic/commissionCalculator.ts` línea ~XX

2. **Recalculation centralizado**: Usar `recalculateBilling(billing, paymentCondition)` 
	- No calcular en la UI
	- Todos los cambios (pago, descuento) disparan recalculation

3. **Encoding UTF-8**: Los reemplazos de PowerShell pueden corromper caracteres acentuados
	- Ver `.context/NEXT_STEPS.md` opción de reparación

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
