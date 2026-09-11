# Reglas de Descarga y Procesamiento de Datos

## 1. Agenda de Vencimientos ([src/presentation/pages/Agenda.tsx](src/presentation/pages/Agenda.tsx))

- **Colección Firestore**: `users/{uid}/allBillings`
- **Rango de Fechas (Semana activa)**:
  - `dateFrom`: Lunes de la semana seleccionada a las `00:00:00.000` (ms timestamp).
  - `dateTo`: Domingo de la semana seleccionada a las `23:59:59.999` (ms timestamp).
- **Consultas Firestore en paralelo** ([src/data/repositories/FirestoreInvoiceRepository.ts](src/data/repositories/FirestoreInvoiceRepository.ts#L17)):
  1. **Programados de la semana**:
     - `Estado` `in` `["Pendiente", "Por vencer", "Vencido"]`
     - `Fecha Pago` `>= dateFrom`
     - `Fecha Pago` `<= dateTo`
  2. **Urgentes sin límite de fecha**:
     - `Estado` `in` `["Vencido", "Por vencer"]`
- **Merge y Filtrado en cliente**:
  - Unificar los documentos de ambas consultas descartando duplicados por `id`.
  - Excluir comprobantes sin saldo (`rest <= 0`).
- **Filtrado en UI**:
  - **Filtro Urgentes (`isFilteringUrgent = true`)**: Muestra comprobantes con `rest > 0` y estado `"Vencido"` o `"Por vencer"`, ordenados por `payDate` ascendente.
  - **Filtro Fecha (`isFilteringUrgent = false`)**: Muestra únicamente comprobantes cuya `payDate` coincida exactamente en año, mes y día con la fecha seleccionada (`selectedDate`).

---

## 2. Comisiones ([src/presentation/pages/Commissions.tsx](src/presentation/pages/Commissions.tsx))

- **Colecciones Firestore**:
  - `users/{uid}/factories`
  - `users/{uid}/paymentRegister`
  - `users/{uid}/allBillings`
- **Condición de Consulta**:
  - Requiere rango de fechas completo (`startDate` a las `00:00:00` ms y `endDate` a las `23:59:59.999` ms).
- **Flujo de Descarga** ([src/domain/usecases/CommissionUseCase.ts](src/domain/usecases/CommissionUseCase.ts#L33)):
  1. **Fábricas**: Carga de configuración de comisión por fábrica/segmento ([src/data/repositories/FirestorePaymentRegisterRepository.ts](src/data/repositories/FirestorePaymentRegisterRepository.ts#L18)).
  2. **Pagos (`paymentRegister`)**:
     - Query: `Fecha >= startDate` AND `Fecha <= endDate` (opcionalmente filtrado por `Marca` si se seleccionó fábrica).
  3. **Facturas (`allBillings`)**:
     - Consulta por lotes (batches de hasta 30 elementos) usando `Numero in [payment.documentNumber]`.
- **Filtrado en Cliente**:
  - Excluir movimientos virtuales (`!payment.isVirtual` y `method` no en `VIRTUAL_MOVEMENT_METHODS`).
  - Coincidencia estricta de rango de fechas en el pago (`payment.date`).
  - Filtrado opcional en memoria por `brand` (de pago o factura), `segment` (`billing.branch`) y `documentType` (`billing.type`).
- **Cálculo de Comisión**:
  - Aplicar `calculatePaymentCommission(payment, billing, factories, config)` sobre los registros válidos.
