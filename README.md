# Plataforma Inteligente para la Gestión y Mantenimiento de Capnógrafos (SIST 4.0)

> **Entrega 1: Diseño e Ingeniería Clínica**  
> **Asignatura:** Gestión de Tecnología Médica / Ingeniería Clínica  
> **Institución:** Universidad ECCI  
> **Fecha:** 31 de Agosto de 2026  

---

## 👥 Integrantes del Equipo
* **Johan Smith Bonilla Guzman** - *Ingeniería Biomédica* 
* **Mariana Valentina Muñoz Velandia** - *Ingeniería Biomédica*
* **Juana Camila Pineda Rubiano** - *Ingeniería Biomédica* 
* **Camilo Salinas Avila** - *Ingeniería Biomédica* 

---

## 📌 1. Descripción y Justificación Técnica

La gestión metrológica y el mantenimiento de equipos de monitoreo de gases respiratorios representan un desafío crítico en las áreas de cuidado intensivo (UCI) y salas de cirugía. El **Capnógrafo de tecnología Sidestream (Muestreo Secundario)** permite la medición continua y no invasiva de la presión parcial de dióxido de carbono al final de la espiración ($EtCO_2$), la $FiCO_2$ y la Frecuencia Respiratoria (FR).

### Justificación Clínica e Ingeniería
1. **Criticidad Asistencial:** La pérdida de la curva de capnografía o la lectura errónea de $EtCO_2$ puede derivar en la no detección a tiempo de una desintubación accidental, oclusión de la vía aérea o falla en la ventilación mecánica.
2. **Desafíos Neumáticos y Metrológicos:** Al ser de tecnología *Sidestream*, utiliza una bomba de aspiración interna (flujo de $150 \text{ ml/min} - 200 \text{ ml/min}$) que sufre desgaste mecánico continuo, sumado al alto riesgo de oclusión por condensación en la trampa de agua y trampas de aerosol.
3. **Necesidad Digital (SIST 4.0):** Requiere un control riguroso de calibración de cero y *span* en sus celdas de detección NDIR (Infrarrojo No Dispersivo). Esta plataforma integra trazabilidad por código QR, telemetría para un Gemelo Digital y un motor de IA (RAG) para optimizar los protocolos de mantenimiento preventivo y correctivo.

---

## ⚖️ 2. Marco Normativo y Regulación

La arquitectura y los protocolos del sistema están alineados con la siguiente normativa técnica y legal:

* **ISO 80601-2-55:** Requisitos particulares para la seguridad básica y funcionamiento esencial de los monitores de gas respiratorio.
* **IEC 60601-1:** Equipos electromédicos. Requisitos generales para la seguridad básica y funcionamiento esencial.
* **IEC 62353:** Equipos electromédicos – Ensayos recurrentes y ensayos después de la reparación de equipos electromédicos (Seguridad Eléctrica).
* **Resolución 3100 de 2019 (Colombia / MINSALUD):** Criterios del Estándar de Dispositivos Médicos para la habilitación de servicios de salud.
* **Regulación INVIMA:** Trazabilidad e historial de intervenciones técnicas en la Hoja de Vida Digital.

---

## 🏗️ 3. Arquitectura del Sistema

El sistema implementa un flujo de datos en 5 capas principales que conectan desde el dispositivo físico en el entorno asistencial hasta los servicios en la nube e Inteligencia Artificial:

```mermaid
flowchart TD
    %% Estilos Visuales (Fondo Blanco, Texto Oscuro y Bordes Azules)
    classDef capa fill:#ffffff,stroke:#1d4ed8,stroke-width:2px,color:#0f172a;
    classDef nodo fill:#f8fafc,stroke:#3b82f6,stroke-width:1.5px,color:#0f172a;
    classDef db fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;

    subgraph C1["1. EQUIPO BIOMÉDICO Y CAPTURA"]
        EQ["Capnógrafo Sidestream"] --- QR["Código QR / NFC"]
        QR --> REG["Captura: Checklists, Evidencias Fotográficas y Lecturas EtCO2"]
    end

    subgraph C2["2. PLATAFORMA WEB (SISTEMA 4.0)"]
        MOD["Módulos: Hoja de Vida | Mantenimiento | Gemelo Digital | Dashboard"]
    end

    subgraph C3["3. SERVICIOS Y ALMACENAMIENTO (BACKEND)"]
        API["Servidor API (FastAPI / Node.js)"]
        DB[("Base de Datos Relacional\nPostgreSQL")]
        ST[("Almacenamiento Cloud\nFotos y Manuales")]
        
        API <---> DB
        API <---> ST
    end

    subgraph C4["4. ASISTENTE TÉCNICO DE IA"]
        RAG["Motor RAG (Recuperación de Manuales)"]
        LLM["Modelo IA (Responde Dudas Técnicas)"]
        RAG <---> LLM
    end

    subgraph C5["5. USUARIOS DEL SISTEMA"]
        USR["Técnicos | Ingenieros Clínicos | Administradores | Estudiantes"]
    end

    REG -->|"1. Envía datos registrados"| MOD
    MOD <==>|"2. Peticiones de información"| API
    API <==>|"3. Consulta manuales y fallas"| RAG
    USR <==>|"4. Interacción con la plataforma"| MOD

    class C1,C2,C3,C4,C5 capa;
    class EQ,QR,REG,MOD,API,LLM,USR nodo;
    class DB,ST,RAG db;