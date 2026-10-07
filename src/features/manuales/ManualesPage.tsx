import React, { useState, useEffect } from 'react'
import { ManualesService } from '@/shared/lib/storageService'
import type { DocumentoManual } from '@/shared/types'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { StatusLed } from '@/shared/components/ui/StatusLed'
import { SegmentedTabs } from '@/shared/components/ui/SegmentedTabs'
import { 
  UploadCloud, 
  FileText, 
  Eye, 
  Search, 
  Sparkles, 
  BookOpen, 
  HardDrive 
} from 'lucide-react'
import { toast } from 'sonner'

export const ManualesPage: React.FC = () => {
  const [manuales, setManuales] = useState<DocumentoManual[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocumentoManual | null>(null)

  const [form, setForm] = useState({
    titulo: '',
    tipo_documento: 'Manual de Servicio' as const,
    modelo_equipo: 'Capnostream 35',
    nombre_archivo: '',
    tamano_bytes: 5242880,
    total_paginas: 156
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const docs = await ManualesService.getManuales()
      setManuales(docs)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.nombre_archivo.trim()) {
      toast.error('Título y nombre de archivo son obligatorios')
      return
    }

    try {
      await ManualesService.registrarManual({
        modelo_equipo: form.modelo_equipo,
        titulo: form.titulo,
        tipo_documento: form.tipo_documento,
        nombre_archivo: form.nombre_archivo,
        storage_path: `manuales/${form.nombre_archivo}`,
        tamano_bytes: form.tamano_bytes,
        formato: 'application/pdf',
        total_paginas: form.total_paginas,
        estado_indexacion: 'Indexado'
      })
      toast.success('Manual cargado e indexado para el Asistente IA.')
      setIsUploadOpen(false)
      load()
    } catch {
      toast.error('Error al registrar manual')
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const filtered = manuales.filter(m => {
    const matchesSearch = 
      m.titulo.toLowerCase().includes(search.toLowerCase()) ||
      m.nombre_archivo.toLowerCase().includes(search.toLowerCase()) ||
      m.tipo_documento.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = 
      filterTipo === 'todos' || 
      (filterTipo === 'servicio' && m.tipo_documento === 'Manual de Servicio') ||
      (filterTipo === 'calibracion' && m.tipo_documento.toLowerCase().includes('calibración')) ||
      (filterTipo === 'partes' && m.tipo_documento.toLowerCase().includes('partes'))

    return matchesSearch && matchesFilter
  })

  const TABS = [
    { id: 'todos', label: 'Todos los Documentos', count: manuales.length },
    { id: 'servicio', label: 'Manuales de Servicio', count: manuales.filter(m => m.tipo_documento === 'Manual de Servicio').length },
    { id: 'calibracion', label: 'Guías de Calibración', count: manuales.filter(m => m.tipo_documento.toLowerCase().includes('calibración')).length },
    { id: 'partes', label: 'Despiece / Partes', count: manuales.filter(m => m.tipo_documento.toLowerCase().includes('partes')).length }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
              <BookOpen className="w-3.5 h-3.5" />
              DOCUMENTACIÓN TÉCNICA OFICIAL
            </span>
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              MOTOR DE CONOCIMIENTO RAG
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-2.5">
            Biblioteca de Manuales y Especificaciones
            <StatusLed color="cyan" size="sm" pulse />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Archivos PDF indexados para resolución automatizada de fallas y calibración asistida por IA
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={() => setIsUploadOpen(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Cargar Manual Técnico (PDF)
        </Button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SegmentedTabs 
          options={TABS} 
          selectedId={filterTipo} 
          onChange={setFilterTipo} 
          layoutId="manualesTabs"
        />

        <div className="w-full md:w-80">
          <Input 
            placeholder="Buscar por título o código de manual..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* RAG Engine Info Banner (Material 3 Tonal Card) */}
      <div className="p-4.5 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-[var(--md-sys-color-on-surface)] text-sm">
              Indexación Vectorial de Servicio Medtronic:
            </span>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
              pgvector 768-dim Activo
            </span>
          </div>
          <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs mt-1.5 leading-relaxed">
            Todos los documentos marcados como <em>"Indexado"</em> son procesados por los embeddings para alimentar el módulo de Asistente IA, permitiendo resolver alarmas de oclusión, caudales de 50 mL/min y pruebas de fuga IEC 62353 con citas textuales de página.
          </p>
        </div>
      </div>

      {/* Manuals Grid */}
      {loading ? (
        <div className="p-12 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">
          Cargando biblioteca de manuales biomédicos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(doc => (
            <InstrumentCard 
              key={doc.id} 
              variant="elevated"
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--md-sys-color-on-surface)] text-sm sm:text-base tracking-tight">
                        {doc.titulo}
                      </h3>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono mt-0.5">
                        {doc.nombre_archivo}
                      </p>
                    </div>
                  </div>
                  <Badge variant={doc.estado_indexacion === 'Indexado' ? 'success' : 'warning'}>
                    {doc.estado_indexacion}
                  </Badge>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[var(--md-sys-color-outline-variant)] text-xs grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60">
                    <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Categoría</span>
                    <span className="text-[var(--md-sys-color-on-surface)] font-medium text-xs truncate block mt-0.5">
                      {doc.tipo_documento}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60">
                    <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Páginas</span>
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] text-xs mt-0.5 block font-mono">
                      {doc.total_paginas || 'N/A'} págs
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/60">
                    <span className="block text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Tamaño</span>
                    <span className="font-semibold text-[var(--md-sys-color-primary)] text-xs mt-0.5 block font-mono">
                      {formatSize(doc.tamano_bytes)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs">
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 truncate max-w-[220px]">
                  <HardDrive className="w-3.5 h-3.5 shrink-0" />
                  {doc.storage_path}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setSelectedDoc(doc)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                >
                  Ficha Técnica
                </Button>
              </div>
            </InstrumentCard>
          ))}
        </div>
      )}

      {/* Modal: Detalles de Documento (M3 Dialog) */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.titulo}
          subtitle={`Archivo: ${selectedDoc.nombre_archivo}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Modelo Compatible:</span>
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">{selectedDoc.modelo_equipo}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Tipo de Documento:</span>
                <span className="font-medium text-[var(--md-sys-color-primary)]">{selectedDoc.tipo_documento}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Páginas de Referencia:</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)] font-mono">{selectedDoc.total_paginas}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Tamaño del Archivo:</span>
                <span className="font-semibold text-[var(--md-sys-color-on-surface)] font-mono">{formatSize(selectedDoc.tamano_bytes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">Estado en Base Vectorial:</span>
                <Badge variant="success">{selectedDoc.estado_indexacion}</Badge>
              </div>
            </div>

            <p className="text-[var(--md-sys-color-on-surface-variant)] text-xs leading-relaxed">
              Este manual se encuentra almacenado localmente en <code className="text-[var(--md-sys-color-primary)] font-mono px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container)]">{selectedDoc.storage_path}</code> y sus fragmentos semánticos están conectados al asistente de ingeniería clínica para respuesta rápida a fallas.
            </p>

            <div className="flex justify-end pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <Button variant="primary" size="sm" onClick={() => setSelectedDoc(null)}>
                Entendido
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Carga de Nuevo Manual (M3 Dialog) */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Carga de Manual Biomédico"
        subtitle="Almacenamiento e indexación en base de datos para Asistente IA"
        maxWidth="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input 
            label="Título Oficial del Documento *"
            placeholder="Ej: Manual de Servicio Medtronic Capnostream 35"
            required
            value={form.titulo}
            onChange={(e) => setForm({...form, titulo: e.target.value})}
          />

          <div>
            <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
              Tipo de Documento
            </label>
            <select
              value={form.tipo_documento}
              onChange={(e) => setForm({...form, tipo_documento: e.target.value as any})}
              className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
            >
              <option value="Manual de Servicio">Manual de Servicio Técnico</option>
              <option value="Guía Rápida de Operación">Guía Rápida de Operación</option>
              <option value="Protocolo de Calibración">Protocolo de Calibración NDIR</option>
              <option value="Catálogo de Repuestos">Catálogo de Repuestos y Accesorios</option>
            </select>
          </div>

          <Input 
            label="Nombre del Archivo PDF *"
            placeholder="Ej: Capnostream_35_Service_Manual.pdf"
            required
            value={form.nombre_archivo}
            onChange={(e) => setForm({...form, nombre_archivo: e.target.value})}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Total Páginas"
              type="number"
              value={form.total_paginas}
              onChange={(e) => setForm({...form, total_paginas: Number(e.target.value)})}
            />
            <Input 
              label="Tamaño Estimado (Bytes)"
              type="number"
              value={form.tamano_bytes}
              onChange={(e) => setForm({...form, tamano_bytes: Number(e.target.value)})}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button variant="outlined" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Guardar e Indexar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
