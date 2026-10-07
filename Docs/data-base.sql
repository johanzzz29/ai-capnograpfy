-- ==============================================================================
-- PROYECTO: Plataforma Inteligente para Gestión y Mantenimiento de Capnógrafos
-- SISTEMA: SIST 4.0 (Ingeniería Clínica y Metrología Biomédica)
-- MOTOR: PostgreSQL 15+ (Arquitectura Supabase BaaS)
-- FECHA: Octubre 2026
-- ==============================================================================

-- 0. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Para el módulo de Asistente IA (RAG sobre el manual de servicio con Google Gemini)
CREATE EXTENSION IF NOT EXISTS "vector";

-- ------------------------------------------------------------------------------
-- 1. TABLA: perfiles (Extensión de auth.users de Supabase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(40) NOT NULL DEFAULT 'Técnico Biomédico' 
        CHECK (rol IN ('Ingeniero Clínico', 'Técnico Biomédico', 'Administrador', 'Auditor de Calidad', 'Docente', 'Estudiante')),
    registro_profesional VARCHAR(60), -- Tarjeta profesional o cédula
    institucion VARCHAR(120) DEFAULT 'Universidad ECCI / Clínica Simulación',
    telefono VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: equipos (Inventario Maestro de Equipos Biomédicos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_qr VARCHAR(60) NOT NULL UNIQUE, -- Ej: 'CAP-TM35-001'
    placa_inventario VARCHAR(60) UNIQUE,  -- Código de activo fijo hospitalario
    numero_serie VARCHAR(60) NOT NULL UNIQUE,
    marca VARCHAR(60) NOT NULL DEFAULT 'Medtronic',
    modelo VARCHAR(60) NOT NULL DEFAULT 'Capnostream 35',
    nombre_equipo VARCHAR(100) NOT NULL DEFAULT 'Capnógrafo Portátil de Muestreo Secundario',
    tecnologia VARCHAR(30) NOT NULL DEFAULT 'Sidestream' 
        CHECK (tecnologia IN ('Sidestream', 'Mainstream', 'Dual')),
    clasificacion_riesgo VARCHAR(20) NOT NULL DEFAULT 'Clase IIb' 
        CHECK (clasificacion_riesgo IN ('Clase I', 'Clase IIa', 'Clase IIb', 'Clase III')),
    clasificacion_biomedica VARCHAR(40) NOT NULL DEFAULT 'Soporte de Vida' 
        CHECK (clasificacion_biomedica IN ('Diagnóstico', 'Tratamiento', 'Rehabilitación', 'Soporte de Vida', 'Monitoreo')),
    ubicacion_servicio VARCHAR(100) NOT NULL, -- Ej: 'UCI Adultos - Piso 3', 'Quirófano 2'
    ubicacion_especifica VARCHAR(100),       -- Ej: 'Cama 14', 'Torre de Anestesia B'
    estado_operativo VARCHAR(30) NOT NULL DEFAULT 'Operativo' 
        CHECK (estado_operativo IN ('Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'Calibración Pendiente', 'Dado de Baja')),
    horas_bomba_acumuladas NUMERIC(9, 1) NOT NULL DEFAULT 0.0 CHECK (horas_bomba_acumuladas >= 0),
    fecha_adquisicion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_instalacion DATE NOT NULL DEFAULT CURRENT_DATE,
    garantia_vencimiento DATE,
    url_foto TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: hoja_de_vida (Datos Metrológicos, Legales y Normativos - Res. 3100)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hoja_de_vida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_equipo UUID NOT NULL UNIQUE REFERENCES public.equipos(id) ON DELETE CASCADE,
    registro_invima VARCHAR(80) NOT NULL DEFAULT 'INVIMA 2018EBC-0018492',
    voltaje_operacion VARCHAR(40) NOT NULL DEFAULT '100 - 240 VAC',
    frecuencia_red VARCHAR(30) NOT NULL DEFAULT '50 / 60 Hz',
    potencia_consumo VARCHAR(30) NOT NULL DEFAULT '45 VA',
    tipo_alimentacion VARCHAR(80) NOT NULL DEFAULT 'Red eléctrica 110V + Batería Li-ion interna (Smart Battery)',
    flujo_nominal_aspiracion NUMERIC(5, 1) NOT NULL DEFAULT 50.0, -- Flujo Sidestream: 50.0 mL/min ± 7.5 mL/min
    tolerancia_flujo_mlmin NUMERIC(4, 1) NOT NULL DEFAULT 7.5,
    rango_medicion_etco2 VARCHAR(60) NOT NULL DEFAULT '0 a 99 mmHg (0 a 13.2 kPa)',
    frecuencia_mantenimiento_dias INT NOT NULL DEFAULT 180, -- Semestral
    frecuencia_calibracion_dias INT NOT NULL DEFAULT 365,   -- Anual
    fecha_ultimo_mantenimiento DATE,
    fecha_proximo_mantenimiento DATE,
    fecha_ultima_calibracion DATE,
    fecha_proxima_calibracion DATE,
    manual_servicio_referencia VARCHAR(120) DEFAULT 'Medtronic Capnostream 35 Portable Bedside Monitor Service Manual',
    norma_seguridad_electrica VARCHAR(50) DEFAULT 'IEC 62353 / IEC 60601-1',
    observaciones_tecnicas TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: repuestos_accesorios (Inventario Oficial de Piezas y Consumibles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repuestos_accesorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_referencia VARCHAR(60) NOT NULL UNIQUE, -- Ej: 'LPA3948', 'FIL7780'
    nombre VARCHAR(140) NOT NULL,
    categoria VARCHAR(40) NOT NULL 
        CHECK (categoria IN ('Consumible', 'Accesorio Reutilizable', 'Repuesto Electroneumático', 'Herramienta de Calibración')),
    descripcion TEXT,
    numero_lote VARCHAR(60),
    registro_invima VARCHAR(80),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 3 CHECK (stock_minimo >= 0),
    unidad_medida VARCHAR(30) NOT NULL DEFAULT 'Unidad',
    ubicacion_almacen VARCHAR(100) DEFAULT 'Almacén Biomédica - Gaveta Insumos Capnografía',
    estado VARCHAR(30) NOT NULL DEFAULT 'Disponible' 
        CHECK (estado IN ('Disponible', 'Stock Bajo', 'Agotado', 'Descontinuado')),
    precio_unitario_estimado NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: movimientos_inventario (Kardex / Auditoría de Entradas y Salidas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_repuesto UUID NOT NULL REFERENCES public.repuestos_accesorios(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(40) NOT NULL 
        CHECK (tipo_movimiento IN ('Entrada Stock', 'Salida Mantenimiento', 'Ajuste Físico', 'Descarte')),
    cantidad INT NOT NULL, -- Positivo para entradas, negativo para salidas
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    id_equipo_destino UUID REFERENCES public.equipos(id) ON DELETE SET NULL,
    id_usuario UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: mantenimientos (Órdenes de Trabajo e Intervenciones Técnicas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_equipo UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    id_tecnico UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    codigo_acta VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'ACTA-2026-0001'
    tipo_mantenimiento VARCHAR(35) NOT NULL 
        CHECK (tipo_mantenimiento IN ('Preventivo', 'Correctivo', 'Calibración Metrológica', 'Inspección Rutinaria')),
    fecha_ejecucion TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    horas_bomba_registradas NUMERIC(9, 1) NOT NULL CHECK (horas_bomba_registradas >= 0),
    
    -- Variables metrológicas y funcionales (Norma ISO 80601-2-55)
    valor_co2_referencia NUMERIC(5, 2), -- Patrón de gas (ej: 5.00 % o 38.0 mmHg)
    valor_co2_medido NUMERIC(5, 2),     -- Lectura del sensor NDIR
    error_relativo_porcentaje NUMERIC(5, 2), -- Deriva calculada
    flujo_aspiracion_mlmin NUMERIC(5, 1),    -- Lectura rotámetro (Nominal 50.0 ml/min)
    hermeticidad_circuito VARCHAR(15) DEFAULT 'Hermético' CHECK (hermeticidad_circuito IN ('Hermético', 'Fuga Leve', 'Fuga Crítica')),
    
    -- Ensayos de Seguridad Eléctrica (IEC 62353)
    seguridad_electrica_iec62353 VARCHAR(15) DEFAULT 'Conforme' CHECK (seguridad_electrica_iec62353 IN ('Conforme', 'No Conforme', 'No Aplica')),
    resistencia_tierra_ohmios NUMERIC(4, 2), -- Límite <= 0.20 Ohm
    corriente_fuga_chasis_ua NUMERIC(6, 1),  -- Límite <= 100 uA
    
    estado_final_equipo VARCHAR(30) NOT NULL DEFAULT 'Operativo'
        CHECK (estado_final_equipo IN ('Operativo', 'Requiere Repuesto', 'Fuera de Servicio', 'Pendiente Calibración')),
    observaciones TEXT,
    firma_digital_tecnico TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: mantenimiento_checklists (Puntos de Inspección Detallados)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mantenimiento_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mantenimiento UUID NOT NULL REFERENCES public.mantenimientos(id) ON DELETE CASCADE,
    seccion VARCHAR(60) NOT NULL, -- 'Inspección Física', 'Neumática', 'Metrología', 'Alarmas'
    criterio VARCHAR(180) NOT NULL,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('Pasa', 'Falla', 'No Aplica')),
    valor_medido VARCHAR(60),
    observacion TEXT
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: mantenimiento_repuestos_utilizados (Trazabilidad de Piezas Cambiadas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mantenimiento_repuestos_utilizados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_mantenimiento UUID NOT NULL REFERENCES public.mantenimientos(id) ON DELETE CASCADE,
    id_repuesto UUID NOT NULL REFERENCES public.repuestos_accesorios(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    tipo_accion VARCHAR(35) NOT NULL DEFAULT 'Reemplazo Preventivo'
        CHECK (tipo_accion IN ('Reemplazo Preventivo', 'Reemplazo por Falla', 'Instalación de Accesorio', 'Calibración')),
    motivo_cambio TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: documentos_manuales (Repositorio de Manuales del Capnógrafo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documentos_manuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_equipo UUID REFERENCES public.equipos(id) ON DELETE SET NULL,
    modelo_equipo VARCHAR(60) NOT NULL DEFAULT 'Capnostream 35',
    titulo VARCHAR(160) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL 
        CHECK (tipo_documento IN ('Manual de Servicio', 'Manual de Operación', 'Protocolo de Calibración', 'Guía Rápida', 'Ficha Técnica')),
    nombre_archivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL, -- Ruta en el bucket de Supabase Storage
    tamano_bytes BIGINT,
    formato VARCHAR(30) DEFAULT 'application/pdf',
    total_paginas INT,
    estado_indexacion VARCHAR(30) NOT NULL DEFAULT 'Pendiente' 
        CHECK (estado_indexacion IN ('Pendiente', 'Indexado', 'Error')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 10. TABLA: manual_embeddings (Base Vectorial para Asistente IA con Gemini)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manual_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_documento UUID NOT NULL REFERENCES public.documentos_manuales(id) ON DELETE CASCADE,
    pagina_numero INT NOT NULL,
    seccion_capitulo VARCHAR(140),
    contenido_texto TEXT NOT NULL,
    embedding VECTOR(768), -- Vector de 768 dimensiones (Google Gemini text-embedding-004)
    tokens_estimados INT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 11. TABLAS: asistente_conversaciones y mensajes (Historial Clínico Asistente)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asistente_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id_equipo UUID REFERENCES public.equipos(id) ON DELETE SET NULL,
    titulo VARCHAR(140) NOT NULL DEFAULT 'Consulta de Servicio Técnico',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.asistente_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversacion UUID NOT NULL REFERENCES public.asistente_conversaciones(id) ON DELETE CASCADE,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('user', 'assistant', 'system')),
    contenido TEXT NOT NULL,
    fuentes_citadas JSONB DEFAULT '[]'::jsonb, -- Array de páginas y fragmentos citados
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO Y BÚSQUEDA VECTORIAL
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_equipos_qr ON public.equipos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_equipos_serie ON public.equipos(numero_serie);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON public.equipos(estado_operativo);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo ON public.mantenimientos(id_equipo);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha ON public.mantenimientos(fecha_ejecucion);
CREATE INDEX IF NOT EXISTS idx_repuestos_codigo ON public.repuestos_accesorios(codigo_referencia);
CREATE INDEX IF NOT EXISTS idx_repuestos_stock ON public.repuestos_accesorios(stock_actual);
CREATE INDEX IF NOT EXISTS idx_checklists_mtto ON public.mantenimiento_checklists(id_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_manual_embeddings_doc ON public.manual_embeddings(id_documento);

-- Índice IVFFlat o HNSW para búsqueda por similitud vectorial (Cosene Distance)
CREATE INDEX IF NOT EXISTS idx_manual_embeddings_vector 
ON public.manual_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- ------------------------------------------------------------------------------
-- FUNCIONES Y TRIGGERS DE NEGOCIO (AUTOMATIZACIÓN EN POSTGRESQL)
-- ------------------------------------------------------------------------------

-- Trigger 1: Sincronización automática de perfil al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre_completo, correo_electronico, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Técnico Biomédico'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'rol', 'Técnico Biomédico')
    )
    ON CONFLICT (id) DO UPDATE
    SET correo_electronico = EXCLUDED.correo_electronico;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Descuento de stock en repuestos_accesorios al registrar pieza usada
CREATE OR REPLACE FUNCTION public.handle_repuesto_utilizado()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
    v_stock_min INT;
    v_id_equipo UUID;
BEGIN
    -- Obtener stock actual
    SELECT stock_actual, stock_minimo INTO v_stock_actual, v_stock_min
    FROM public.repuestos_accesorios
    WHERE id = NEW.id_repuesto;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el repuesto solicitado. Stock actual: %, solicitado: %', v_stock_actual, NEW.cantidad;
    END IF;

    -- Obtener id_equipo del mantenimiento
    SELECT id_equipo INTO v_id_equipo
    FROM public.mantenimientos
    WHERE id = NEW.id_mantenimiento;

    -- Actualizar inventario
    UPDATE public.repuestos_accesorios
    SET stock_actual = stock_actual - NEW.cantidad,
        estado = CASE 
            WHEN (stock_actual - NEW.cantidad) = 0 THEN 'Agotado'
            WHEN (stock_actual - NEW.cantidad) <= stock_minimo THEN 'Stock Bajo'
            ELSE 'Disponible'
        END,
        updated_at = NOW()
    WHERE id = NEW.id_repuesto;

    -- Registrar movimiento en kardex
    INSERT INTO public.movimientos_inventario (
        id_repuesto,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        id_equipo_destino,
        motivo
    ) VALUES (
        NEW.id_repuesto,
        'Salida Mantenimiento',
        -NEW.cantidad,
        v_stock_actual,
        v_stock_actual - NEW.cantidad,
        v_id_equipo,
        'Mantenimiento ejecutado: ' || NEW.tipo_accion || ' - ' || COALESCE(NEW.motivo_cambio, '')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_repuesto_utilizado
    AFTER INSERT ON public.mantenimiento_repuestos_utilizados
    FOR EACH ROW EXECUTE FUNCTION public.handle_repuesto_utilizado();

-- Trigger 3: Actualizar odómetro de bomba y fechas de mantenimiento en Hoja de Vida
CREATE OR REPLACE FUNCTION public.handle_post_mantenimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar horas acumuladas y estado en equipo
    UPDATE public.equipos
    SET horas_bomba_acumuladas = NEW.horas_bomba_registradas,
        estado_operativo = NEW.estado_final_equipo,
        updated_at = NOW()
    WHERE id = NEW.id_equipo;

    -- Actualizar fechas de control en Hoja de Vida
    UPDATE public.hoja_de_vida
    SET fecha_ultimo_mantenimiento = NEW.fecha_ejecucion::DATE,
        fecha_proximo_mantenimiento = (NEW.fecha_ejecucion::DATE + (frecuencia_mantenimiento_dias || ' days')::INTERVAL)::DATE,
        fecha_ultima_calibracion = CASE 
            WHEN NEW.tipo_mantenimiento = 'Calibración Metrológica' THEN NEW.fecha_ejecucion::DATE 
            ELSE fecha_ultima_calibracion 
        END,
        fecha_proxima_calibracion = CASE 
            WHEN NEW.tipo_mantenimiento = 'Calibración Metrológica' THEN (NEW.fecha_ejecucion::DATE + (frecuencia_calibracion_dias || ' days')::INTERVAL)::DATE 
            ELSE fecha_proxima_calibracion 
        END,
        updated_at = NOW()
    WHERE id_equipo = NEW.id_equipo;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_mantenimiento_completado
    AFTER INSERT ON public.mantenimientos
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_mantenimiento();

-- ------------------------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoja_de_vida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos_accesorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento_repuestos_utilizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_manuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistente_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistente_mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para usuarios autenticados del sistema clínico
CREATE POLICY "Permitir lectura completa a usuarios autenticados" ON public.equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura a usuarios autenticados" ON public.equipos FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura hoja de vida" ON public.hoja_de_vida FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura hoja de vida" ON public.hoja_de_vida FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura inventario" ON public.repuestos_accesorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura inventario" ON public.repuestos_accesorios FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura mantenimientos" ON public.mantenimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura mantenimientos" ON public.mantenimientos FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura checklists" ON public.mantenimiento_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura checklists" ON public.mantenimiento_checklists FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura repuestos usados" ON public.mantenimiento_repuestos_utilizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura repuestos usados" ON public.mantenimiento_repuestos_utilizados FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura manuales" ON public.documentos_manuales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura manuales" ON public.documentos_manuales FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir lectura embeddings" ON public.manual_embeddings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escritura embeddings" ON public.manual_embeddings FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir acceso a conversaciones propias" ON public.asistente_conversaciones FOR ALL TO authenticated USING (auth.uid() = id_usuario);
CREATE POLICY "Permitir acceso a mensajes de sus conversaciones" ON public.asistente_mensajes FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.asistente_conversaciones c WHERE c.id = id_conversacion AND c.id_usuario = auth.uid()));

CREATE POLICY "Permitir lectura de perfiles" ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir editar perfil propio" ON public.perfiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- DATOS INICIALES (SEED DATA CLÍNICO: CAPNOSTREAM 35 & INVENTARIO OFICIAL)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_equipo_id UUID;
BEGIN
    -- 1. Insertar equipo Capnostream 35 de prueba
    INSERT INTO public.equipos (
        codigo_qr, placa_inventario, numero_serie, marca, modelo, 
        nombre_equipo, tecnologia, clasificacion_riesgo, clasificacion_biomedica,
        ubicacion_servicio, ubicacion_especifica, estado_operativo, horas_bomba_acumuladas
    ) VALUES (
        'CAP-TM35-001', 'ACT-BIO-142526', 'SN-TM35-2026-8849', 'Medtronic', 'Capnostream 35',
        'Monitor Capnógrafo Portátil de Muestreo Secundario', 'Sidestream', 'Clase IIb', 'Soporte de Vida',
        'UCI Adultos - Unidad Coronaria', 'Cama 04 (Atril rodante)', 'Operativo', 142.5
    )
    ON CONFLICT (numero_serie) DO NOTHING
    RETURNING id INTO v_equipo_id;

    -- Si ya existía, obtener su id
    IF v_equipo_id IS NULL THEN
        SELECT id INTO v_equipo_id FROM public.equipos WHERE numero_serie = 'SN-TM35-2026-8849';
    END IF;

    -- 2. Insertar Hoja de Vida vinculada
    IF v_equipo_id IS NOT NULL THEN
        INSERT INTO public.hoja_de_vida (
            id_equipo, registro_invima, voltaje_operacion, frecuencia_red, potencia_consumo,
            flujo_nominal_aspiracion, tolerancia_flujo_mlmin, rango_medicion_etco2,
            frecuencia_mantenimiento_dias, frecuencia_calibracion_dias,
            fecha_ultimo_mantenimiento, fecha_proximo_mantenimiento,
            fecha_ultima_calibracion, fecha_proxima_calibracion,
            observaciones_tecnicas
        ) VALUES (
            v_equipo_id, 'INVIMA 2018EBC-0018492', '100-240 VAC', '50/60 Hz', '45 VA',
            50.0, 7.5, '0 a 99 mmHg (0 a 13.2 kPa)',
            180, 365,
            CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '135 days',
            CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '245 days',
            'Equipo en excelente estado. Bomba interna con prueba de flujo nominal a 49.8 mL/min (tolerancia 50 ± 7.5 mL/min conforme).'
        )
        ON CONFLICT (id_equipo) DO NOTHING;
    END IF;

    -- 3. Cargar Repuestos e Insumos Oficiales de "INVENTARIO ACCESORIOS.pdf"
    INSERT INTO public.repuestos_accesorios (codigo_referencia, nombre, categoria, descripcion, stock_actual, stock_minimo, unidad_medida, estado)
    VALUES
        ('LPA3948', 'Línea de muestreo Microstream FilterLine (Adulto/Pediátrico)', 'Consumible', 'Línea con trampa de humedad y filtro bacteriano para paciente intubado/no intubado', 10, 3, 'Unidad', 'Disponible'),
        ('LNI9384', 'Línea de muestreo Microstream FilterLine (Neonatal/Infantil)', 'Consumible', 'Línea pediátrica neonatal de bajo volumen muerto para monitoreo continuo', 10, 3, 'Unidad', 'Disponible'),
        ('LN0X8877', 'Línea de muestreo FilterLine con línea de O2 combinada', 'Consumible', 'Línea dual para suministro de oxígeno complementario y aspiración de EtCO2', 5, 2, 'Unidad', 'Disponible'),
        ('LNCAP48', 'Línea de muestreo Smart CapnoLine Hemo', 'Consumible', 'Línea de alta durabilidad resistente a humedad y secreciones', 5, 2, 'Unidad', 'Disponible'),
        ('FIL7780', 'Filtro hidrófobo o trampa de humedad de repuesto', 'Consumible', 'Filtro de protección neumática para celda de detección NDIR', 3, 2, 'Unidad', 'Disponible'),
        ('PAPTYER993', 'Papel térmico para impresora integrada', 'Consumible', 'Rollo de papel termosensible para registro de tendencias de capnograma', 6, 2, 'Rollo', 'Disponible'),
        ('SPO2-ADU', 'Sensor de SpO2 reutilizable Adulto (Dedo)', 'Accesorio Reutilizable', 'Sensor óptico de pulsoximetría tecnología Nellcor compatible', 2, 1, 'Unidad', 'Disponible'),
        ('SPO2-NEO', 'Sensor de SpO2 suave de silicona (Neonatal / Pediátrico)', 'Accesorio Reutilizable', 'Sensor tipo envoltura suave para pacientes neonatales', 2, 1, 'Unidad', 'Disponible'),
        ('CBL-SPO2', 'Cable troncal de SpO2 (Interface Cable)', 'Accesorio Reutilizable', 'Cable de extensión y conexión al conector frontal del monitor', 2, 1, 'Unidad', 'Disponible'),
        ('BAT-TM35', 'Batería externa de repuesto (Smart Battery Pack)', 'Repuesto Electroneumático', 'Pack inteligente de Ion-Litio con indicador de carga integrado', 1, 1, 'Unidad', 'Stock Bajo'),
        ('ATR-ROD', 'Base rodante o atril con canastilla', 'Accesorio Reutilizable', 'Soporte móvil hospitalario con sistema de frenos y canasta de accesorios', 3, 1, 'Unidad', 'Disponible'),
        ('MAL-TRA', 'Maletín de transporte portátil de lona impermeable', 'Accesorio Reutilizable', 'Bolso acolchado para traslado intrahospitalario y emergencias', 1, 1, 'Unidad', 'Stock Bajo'),
        ('PRT-SIL', 'Protector de pantalla de silicona o carcasa anti-golpes', 'Accesorio Reutilizable', 'Funda de amortiguación para bordes y chasis del monitor', 1, 1, 'Unidad', 'Stock Bajo'),
        ('MOD-FLU449', 'Módulo de sensor de flujo o muestreo neumático de repuesto', 'Repuesto Electroneumático', 'Ensamble de microbomba de succión y bloque de válvulas neumáticas', 1, 1, 'Unidad', 'Stock Bajo')
    ON CONFLICT (codigo_referencia) DO NOTHING;

END $$;

-- ------------------------------------------------------------------------------
-- 12. FUNCIÓN RPC: Registro Clínico de Usuarios sin límite de cuota SMTP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crear_usuario_clinico(
    new_email text,
    new_password text,
    new_nombre text,
    new_rol text,
    new_registro_prof text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_encrypted_pw text;
    v_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = lower(trim(new_email))) INTO v_exists;
    IF v_exists THEN
        RETURN json_build_object('success', false, 'error', 'El correo ya se encuentra registrado en el sistema clínico');
    END IF;

    v_user_id := gen_random_uuid();
    v_encrypted_pw := extensions.crypt(new_password, extensions.gen_salt('bf'::text, 10));

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, is_sso_user, is_anonymous
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        lower(trim(new_email)), v_encrypted_pw, now(), '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
            'sub', v_user_id::text, 'email', lower(trim(new_email)),
            'nombre_completo', new_nombre, 'rol', new_rol,
            'registro_profesional', COALESCE(new_registro_prof, 'T.P. 144048-BIO'),
            'email_verified', true
        ),
        now(), now(), false, false
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_user_id,
        jsonb_build_object(
            'sub', v_user_id::text, 'email', lower(trim(new_email)),
            'nombre_completo', new_nombre, 'rol', new_rol,
            'registro_profesional', COALESCE(new_registro_prof, 'T.P. 144048-BIO')
        ),
        'email', v_user_id::text, now(), now(), now()
    );

    INSERT INTO public.perfiles (
        id, nombre_completo, correo_electronico, rol, registro_profesional, institucion, telefono
    ) VALUES (
        v_user_id, new_nombre, lower(trim(new_email)), new_rol,
        COALESCE(new_registro_prof, 'T.P. 144048-BIO'), 'Universidad ECCI / Clínica Simulación', '+57 310 849 2026'
    )
    ON CONFLICT (id) DO UPDATE SET
        nombre_completo = EXCLUDED.nombre_completo,
        rol = EXCLUDED.rol,
        registro_profesional = EXCLUDED.registro_profesional;

    RETURN json_build_object('success', true, 'user_id', v_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_usuario_clinico(text, text, text, text, text) TO anon, authenticated, service_role;