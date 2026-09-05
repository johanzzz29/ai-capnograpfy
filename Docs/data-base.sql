-- ============================================================
-- PROYECTO: Plataforma Inteligente para Capnógrafos (SIST 4.0)
-- ARCHIVO: schema.sql (Modelo Entidad-Relación - MER)
-- MOTOR: PostgreSQL 14+
-- ============================================================

-- Limpieza previa de tablas (en orden inverso a sus dependencias)
DROP TABLE IF EXISTS LECTURAS_GEMELO CASCADE;
DROP TABLE IF EXISTS EVIDENCIAS CASCADE;
DROP TABLE IF EXISTS MANTENIMIENTOS CASCADE;
DROP TABLE IF EXISTS HOJA_DE_VIDA CASCADE;
DROP TABLE IF EXISTS EQUIPOS CASCADE;
DROP TABLE IF EXISTS USUARIOS CASCADE;

-- ------------------------------------------------------------
-- 1. TABLA: USUARIOS
-- Almacena la información de los técnicos, ingenieros y admin.
-- ------------------------------------------------------------
CREATE TABLE USUARIOS (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('Técnico Biomédico', 'Ingeniero Clínico', 'Administrador', 'Docente', 'Estudiante')),
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. TABLA: EQUIPOS
-- Registro maestro de cada Capnógrafo administrado.
-- ------------------------------------------------------------
CREATE TABLE EQUIPOS (
    id_equipo BIGSERIAL PRIMARY KEY,
    codigo_qr VARCHAR(50) NOT NULL UNIQUE,
    numero_serie VARCHAR(50) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    tecnologia VARCHAR(30) NOT NULL CHECK (tecnologia IN ('Sidestream', 'Mainstream')),
    ubicacion_servicio VARCHAR(80) NOT NULL, -- Ej: Quirófano 3, UCI Adultos
    estado_operativo VARCHAR(30) NOT NULL DEFAULT 'Operativo' CHECK (estado_operativo IN ('Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'Dado de Baja')),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ------------------------------------------------------------
-- 3. TABLA: HOJA_DE_VIDA
-- Datos técnicos, legales y metrológicos vinculados al equipo.
-- ------------------------------------------------------------
CREATE TABLE HOJA_DE_VIDA (
    id_hoja BIGSERIAL PRIMARY KEY,
    id_equipo BIGINT NOT NULL UNIQUE REFERENCES EQUIPOS(id_equipo) ON DELETE CASCADE,
    registro_invima VARCHAR(50) NOT NULL,
    frecuencia_manto_dias INT NOT NULL DEFAULT 180, -- Ej: cada 6 meses
    frecuencia_calibracion_dias INT NOT NULL DEFAULT 365, -- Ej: anual
    ultima_calibracion DATE,
    proxima_calibracion DATE,
    observaciones_legales TEXT
);

-- ------------------------------------------------------------
-- 4. TABLA: MANTENIMIENTOS
-- Registro de protocolos preventivos, correctivos y pruebas IEC 62353.
-- ------------------------------------------------------------
CREATE TABLE MANTENIMIENTOS (
    id_mantenimiento BIGSERIAL PRIMARY KEY,
    id_equipo BIGINT NOT NULL REFERENCES EQUIPOS(id_equipo) ON DELETE CASCADE,
    id_usuario BIGINT NOT NULL REFERENCES USUARIOS(id_usuario) ON DELETE RESTRICT,
    fecha_ejecucion DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_mantenimiento VARCHAR(30) NOT NULL CHECK (tipo_mantenimiento IN ('Preventivo', 'Correctivo', 'Calibración', 'Inspección')),
    horas_bomba_succion INT NOT NULL CHECK (horas_bomba_succion >= 0),
    valor_co2_medido NUMERIC(4,2), -- Valor medido con gas patrón (ej: 4.90%)
    flujo_aspiracion_mlmin NUMERIC(5,1), -- Flujo de succión (ej: 150.0 ml/min)
    resultado_seg_electrica VARCHAR(10) CHECK (resultado_seg_electrica IN ('Pasa', 'Falla', 'N/A')),
    observaciones TEXT
);

-- ------------------------------------------------------------
-- 5. TABLA: EVIDENCIAS
-- Registro de fotografías y documentos adjuntos al mantenimiento.
-- ------------------------------------------------------------
CREATE TABLE EVIDENCIAS (
    id_evidencia BIGSERIAL PRIMARY KEY,
    id_mantenimiento BIGINT NOT NULL REFERENCES MANTENIMIENTOS(id_mantenimiento) ON DELETE CASCADE,
    url_fotografia VARCHAR(255) NOT NULL,
    tipo_evidencia VARCHAR(50) CHECK (tipo_evidencia IN ('Prueba Metrológica', 'Estado Filtros', 'Daño Físico', 'Reporte Firmado')),
    descripcion TEXT,
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. TABLA: LECTURAS_GEMELO
-- Simulación o registros históricos para el Gemelo Digital.
-- ------------------------------------------------------------
CREATE TABLE LECTURAS_GEMELO (
    id_lectura BIGSERIAL PRIMARY KEY,
    id_equipo BIGINT NOT NULL REFERENCES EQUIPOS(id_equipo) ON DELETE CASCADE,
    timestamp_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    etco2_referencia NUMERIC(4,2) NOT NULL, -- Valor patrón (ej: 5.00%)
    etco2_simulado NUMERIC(4,2) NOT NULL, -- Valor que simula el equipo
    deriva_porcentaje NUMERIC(4,2), -- Desviación calculada %
    alarma_oclusion BOOLEAN DEFAULT FALSE
);

-- ------------------------------------------------------------
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ------------------------------------------------------------
CREATE INDEX idx_equipos_qr ON EQUIPOS(codigo_qr);
CREATE INDEX idx_mantenimientos_equipo ON MANTENIMIENTOS(id_equipo);
CREATE INDEX idx_evidencias_mantenimiento ON EVIDENCIAS(id_mantenimiento);
CREATE INDEX idx_gemelo_equipo ON LECTURAS_GEMELO(id_equipo);