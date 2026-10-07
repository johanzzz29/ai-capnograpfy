import { test, expect } from '@playwright/test'

test.describe('CapnoGuard SIST 4.0 - Suite de Pruebas E2E', () => {
  
  test.beforeEach(async ({ page }, testInfo) => {
    // Para las pruebas 1-7, pre-autenticar sesión clínica; para la prueba 8, iniciar sin sesión
    if (!testInfo.title.includes('8. Autenticación Supabase')) {
      await page.addInitScript(() => {
        window.localStorage.setItem('capnoguard_active_user', JSON.stringify({
          id: '9698c090-86ac-47cf-a08a-4d3238cc7f0c',
          nombre_completo: 'Ing. Johan Smith Bonilla Guzmán',
          correo_electronico: 'johan.bonilla@ecci.edu.co',
          rol: 'Ingeniero Clínico',
          registro_profesional: 'T.P. 144048-BIO',
          institucion: 'Universidad ECCI / Clínica Simulación',
          telefono: '+57 310 849 2026'
        }))
      })
    }
  })

  test('1. Dashboard: Renderizado de KPIs y Parámetros Metrológicos', async ({ page }) => {
    await page.goto('/')
    
    // Validar título y branding del sistema 4.0
    await expect(page.locator('h1')).toContainText('Gestión Metrológica de Capnógrafos')
    await expect(page.getByText('TELEMETRÍA SIDESTREAM: 50 mL/min NOMINAL')).toBeVisible()

    // Validar 4 tarjetas de KPIs
    await expect(page.getByText('Parque Activo')).toBeVisible()
    await expect(page.getByText('Calibración / Alerta')).toBeVisible()
    await expect(page.getByText('Horas Bomba Succión')).toBeVisible()
    await expect(page.getByRole('main').getByText('Insumos & Repuestos')).toBeVisible()

    // Validar presencia del Capnostream 35 en la lista
    await expect(page.getByText('Capnostream 35').first()).toBeVisible()
  })

  test('2. Equipos & Código QR: Visualización de Etiqueta y Registro', async ({ page }) => {
    await page.goto('/equipos')
    
    await expect(page.locator('h1')).toContainText('Registro y Control de Capnógrafos')

    // Abrir Modal de QR
    const verQrBtn = page.getByRole('button', { name: 'Ver QR' }).first()
    await verQrBtn.click()

    // Comprobar que el modal de QR se abre y muestra el SVG
    await expect(page.getByText('Código QR Oficial')).toBeVisible()
    await expect(page.locator('#equipo-qr-svg')).toBeVisible()

    // Cerrar modal
    await page.getByRole('button', { name: 'Aceptar' }).click()
    await expect(page.getByText('Código QR Oficial')).not.toBeVisible()

    // Registrar nuevo equipo
    await page.getByRole('button', { name: 'Registrar Nuevo Equipo' }).click()
    await page.getByLabel('Número de Serie (S/N) *').fill('SN-TM35-TEST-2026')
    await page.getByLabel('Servicio Hospitalario *').fill('UCI Neonatal - Cama 01')
    await page.getByRole('button', { name: 'Guardar y Generar QR' }).click()

    // Verificar notificación y presencia en la lista
    await expect(page.getByText('SN-TM35-TEST-2026')).toBeVisible()
  })

  test('3. Hoja de Vida: Cumplimiento de Res. 3100 e INVIMA', async ({ page }) => {
    await page.goto('/hoja-de-vida')

    await expect(page.locator('h1')).toContainText('Hoja de Vida Oficial de Equipo Biomédico')
    await expect(page.getByText('RESOLUCIÓN 3100 DE 2019')).toBeVisible()

    // Comprobar especificaciones técnicas del Capnostream 35
    await expect(page.getByText('50 mL/min (±7.5)')).toBeVisible()
    await expect(page.getByText('0 a 99 mmHg (0 a 13.2 kPa)')).toBeVisible()
    await expect(page.getByText('IEC 62353 / IEC 60601-1')).toBeVisible()
  })

  test('4. Inventario: Catálogo de Piezas y Ajuste de Stock', async ({ page }) => {
    await page.goto('/inventario')

    await expect(page.locator('h1')).toContainText('Inventario de Piezas y Accesorios')

    // Verificar consumibles y repuestos del PDF oficial
    await expect(page.getByText('LPA3948')).toBeVisible()
    await expect(page.getByText('Línea de muestreo Microstream FilterLine (Adulto/Pediátrico)')).toBeVisible()
    await expect(page.getByText('Sensor de SpO2 reutilizable Adulto (Dedo)')).toBeVisible()

    // Probar ajuste rápido (+1 unidad) en el primer ítem
    const addBtn = page.getByTitle('Sumar 1 unidad').first()
    await addBtn.click()
    await expect(page.getByText('Stock de LPA3948 ajustado')).toBeVisible()
  })

  test('5. Checklists & Mantenimiento: Protocolo IEC 62353 y Registro de Piezas Cambiadas', async ({ page }) => {
    await page.goto('/mantenimiento')

    await expect(page.locator('h1')).toContainText('Checklists de Mantenimiento e Historial')

    // Abrir Formulario de Checklist
    await page.getByRole('button', { name: 'Nueva Orden / Checklist' }).click()
    await expect(page.getByText('Registro de Orden de Mantenimiento y Checklist Metrológico')).toBeVisible()

    // Validar puntos de inspección normativos
    await expect(page.getByText('Flujo nominal de aspiración Sidestream dentro de rango')).toBeVisible()
    await expect(page.getByText('Resistencia de conductor de protección a tierra <= 0.20 Ohm')).toBeVisible()

    // Agregar una pieza cambiada
    await page.getByRole('button', { name: 'Agregar Pieza' }).click()
    await expect(page.getByPlaceholder('Motivo del reemplazo...')).toBeVisible()

    // Guardar Acta
    await page.getByRole('button', { name: 'Firmar y Guardar Acta Oficial' }).click()
    await expect(page.getByText(/Acta ACTA-\d{4}-\d{4} guardada/)).toBeVisible()
  })

  test('6. Asistente IA (RAG): Respuesta fundamentada en el Manual de Servicio', async ({ page }) => {
    await page.goto('/asistente')

    await expect(page.locator('h1')).toContainText('Asistente IA de Mantenimiento')
    await expect(page.getByText('RAG Activo')).toBeVisible()

    // Hacer clic en sugerencia técnica
    const sugerencia = page.getByRole('button', { name: '¿Cómo resolver la alarma de oclusión en FilterLine?' })
    await sugerencia.click()

    // Validar que el asistente responde con citas explícitas del manual oficial
    await expect(page.getByText('Capítulo 4: Detección y Resolución de Fallas Neumáticas')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Pág. 42')).toBeVisible()
  })

  test('7. Dar de Baja de Equipos y Verificación de Historial Limpio', async ({ page }) => {
    // 1. Validar Historial de Mantenimientos
    await page.goto('/mantenimiento')
    await expect(page.locator('h1')).toContainText('Checklists de Mantenimiento e Historial')

    // 2. Validar Advertencia de Dar de Baja en Equipos
    await page.goto('/equipos')
    const trashBtn = page.getByTitle('Dar de baja o retirar equipo del inventario').first()
    await expect(trashBtn).toBeVisible()
    await trashBtn.click()

    // Validar modal de advertencia crítica
    await expect(page.getByText('Dar de Baja Definitiva de Equipo Biomédico')).toBeVisible()
    await expect(page.getByText('¡ADVERTENCIA CRÍTICA: ACCIÓN IRREVERSIBLE!')).toBeVisible()
    await expect(page.getByText('Motivo Oficial de la Baja *')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar Baja y Eliminar' })).toBeDisabled()

    // Cancelar para mantener integridad de prueba
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByText('Dar de Baja Definitiva de Equipo Biomédico')).not.toBeVisible()
  })

  test('8. Autenticación Supabase: Protección de Rutas, Login con Credenciales y Logout', async ({ page }) => {
    // 1. Intentar ingresar a una ruta protegida directamente (/equipos) sin estar autenticado
    await page.goto('/equipos')
    // Debe bloquear el acceso y redirigir inmediatamente a /login
    await expect(page.locator('h1')).toContainText('Acceso al Sistema Clínico')
    await expect(page.getByText('Supabase Auth')).toBeVisible()

    // 2. Llenar manualmente usuario y contraseña de Supabase
    await page.getByLabel('Usuario o Correo Institucional *').fill('johan.bonilla@ecci.edu.co')
    await page.getByLabel('Contraseña *').fill('CapnoGuard2026*')

    // 3. Iniciar sesión en Supabase
    await page.getByRole('button', { name: 'Ingresar al Sistema' }).click()

    // 4. Debe permitir acceso y redirigir al Dashboard principal
    await expect(page.locator('h1')).toContainText('Gestión Metrológica de Capnógrafos', { timeout: 10000 })
    await expect(page.getByText('Ing. Johan Smith Bonilla Guzmán')).toBeVisible()

    // 5. Cerrar sesión
    await page.getByText('Ing. Johan Smith Bonilla Guzmán').click()
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click()
    await expect(page.locator('h1')).toContainText('Acceso al Sistema Clínico')

    // 6. Intentar ingresar a otra ruta protegida (/hoja-de-vida) tras cerrar sesión
    await page.goto('/hoja-de-vida')
    // Debe bloquearse y volver a /login
    await expect(page.locator('h1')).toContainText('Acceso al Sistema Clínico')
  })
})


