import React, { useState, useEffect } from 'react'
import { InventarioService } from '@/shared/lib/storageService'
import type { RepuestoAccesorio, CategoriaRepuesto } from '@/shared/types'
import { InstrumentCard } from '@/shared/components/ui/InstrumentCard'
import { SegmentedTabs } from '@/shared/components/ui/SegmentedTabs'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { 
  Plus, 
  Search, 
  PackageMinus, 
  PackagePlus
} from 'lucide-react'
import { toast } from 'sonner'

export const InventarioPage: React.FC = () => {
  const [repuestos, setRepuestos] = useState<RepuestoAccesorio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('todas')
  
  // Modal registro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    codigo_referencia: '',
    nombre: '',
    categoria: 'Consumible' as CategoriaRepuesto,
    descripcion: '',
    numero_lote: '',
    registro_invima: '',
    stock_actual: 5,
    stock_minimo: 2,
    unidad_medida: 'Unidad',
    ubicacion_almacen: 'Almacén Biomédica - Gaveta Capnografía'
  })

  useEffect(() => {
    loadRepuestos()
  }, [])

  async function loadRepuestos() {
    setLoading(true)
    try {
      const data = await InventarioService.getRepuestos()
      setRepuestos(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.codigo_referencia.trim() || !formData.nombre.trim()) {
      toast.error('Código y nombre son obligatorios')
      return
    }

    try {
      await InventarioService.saveRepuesto({
        codigo_referencia: formData.codigo_referencia,
        nombre: formData.nombre,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        numero_lote: formData.numero_lote,
        registro_invima: formData.registro_invima,
        stock_actual: Number(formData.stock_actual),
        stock_minimo: Number(formData.stock_minimo),
        unidad_medida: formData.unidad_medida,
        ubicacion_almacen: formData.ubicacion_almacen,
        estado: formData.stock_actual === 0 ? 'Agotado' : formData.stock_actual <= formData.stock_minimo ? 'Stock Bajo' : 'Disponible'
      })
      toast.success(`Pieza ${formData.codigo_referencia} guardada en inventario`)
      setIsModalOpen(false)
      loadRepuestos()
      setFormData({
        codigo_referencia: '',
        nombre: '',
        categoria: 'Consumible',
        descripcion: '',
        numero_lote: '',
        registro_invima: '',
        stock_actual: 5,
        stock_minimo: 2,
        unidad_medida: 'Unidad',
        ubicacion_almacen: 'Almacén Biomédica - Gaveta Capnografía'
      })
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message)
    }
  }

  const handleQuickAdjust = async (id: string, delta: number) => {
    const item = repuestos.find(r => r.id === id)
    if (!item) return

    const nuevoStock = Math.max(0, item.stock_actual + delta)
    try {
      await InventarioService.saveRepuesto({
        ...item,
        stock_actual: nuevoStock
      })
      toast.success(`Stock de ${item.codigo_referencia} ajustado a ${nuevoStock} ${item.unidad_medida}`)
      loadRepuestos()
    } catch {
      toast.error('Error ajustando stock')
    }
  }

  const filtered = repuestos.filter(r => {
    const matchesSearch = 
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      r.codigo_referencia.toLowerCase().includes(search.toLowerCase()) ||
      (r.numero_lote && r.numero_lote.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = filterCat === 'todas' || r.categoria === filterCat
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Inventario de Piezas y Accesorios</h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Control de consumibles Microstream FilterLine, celdas NDIR, sensores SpO2 y módulos de succión
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Agregar Insumo / Pieza
        </Button>
      </div>

      {/* Filter and search with M3 SegmentedTabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input 
            placeholder="Buscar por código (ej: LPA3948, FIL7780), nombre o lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <SegmentedTabs 
          options={[
            { id: 'todas', label: 'Todas', count: repuestos.length },
            { id: 'Consumible', label: 'Consumibles' },
            { id: 'Accesorio Reutilizable', label: 'Accesorios' },
            { id: 'Repuesto Electroneumático', label: 'Repuestos' }
          ]}
          selectedId={filterCat}
          onChange={setFilterCat}
          layoutId="inventarioCatTabs"
        />
      </div>

      {/* Inventory Table inside MD3 Card */}
      {loading ? (
        <div className="p-12 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">Cargando catálogo de inventario...</div>
      ) : (
        <InstrumentCard variant="outlined" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Código / Ref</th>
                  <th className="py-3.5 px-4 font-medium">Descripción de la Pieza</th>
                  <th className="py-3.5 px-4 font-medium">Categoría</th>
                  <th className="py-3.5 px-4 font-medium">Lote / INVIMA</th>
                  <th className="py-3.5 px-4 text-center font-medium">Stock Actual</th>
                  <th className="py-3.5 px-4 text-center font-medium">Mínimo</th>
                  <th className="py-3.5 px-4 font-medium">Estado</th>
                  <th className="py-3.5 px-4 text-right font-medium">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--md-sys-color-primary)]">
                      {item.codigo_referencia}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[var(--md-sys-color-on-surface)]">{item.nombre}</p>
                      {item.descripcion && (
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate max-w-sm mt-0.5">{item.descripcion}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[var(--md-sys-color-on-surface-variant)] text-xs font-medium">{item.categoria}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {item.numero_lote || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-numbers font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                      {item.stock_actual} <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-normal">{item.unidad_medida}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-numbers text-[var(--md-sys-color-on-surface-variant)]">
                      {item.stock_minimo}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge 
                        variant={
                          item.estado === 'Disponible' ? 'success' :
                          item.estado === 'Stock Bajo' ? 'warning' : 'danger'
                        }
                      >
                        {item.estado}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickAdjust(item.id, -1)}
                          disabled={item.stock_actual <= 0}
                          title="Restar 1 unidad"
                          className="p-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] disabled:opacity-30 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/40"
                        >
                          <PackageMinus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item.id, 1)}
                          title="Sumar 1 unidad"
                          className="p-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/40"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InstrumentCard>
      )}

      {/* Modal: Agregar Pieza / Accesorio (MD3 Dialog) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ingreso de Pieza / Insumo al Inventario"
        subtitle="Catalogación según especificación oficial del Capnostream 35"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Código de Referencia *"
              placeholder="Ej: LPA3948, SPO2-ADU"
              required
              value={formData.codigo_referencia}
              onChange={(e) => setFormData({...formData, codigo_referencia: e.target.value})}
            />
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Categoría *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value as any})}
                className="w-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-4 py-2 text-xs md:text-sm text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:outline-none"
              >
                <option value="Consumible" className="bg-[var(--md-sys-color-surface)]">Consumible (Línea de Muestreo)</option>
                <option value="Accesorio Reutilizable" className="bg-[var(--md-sys-color-surface)]">Accesorio Reutilizable</option>
                <option value="Repuesto Electroneumático" className="bg-[var(--md-sys-color-surface)]">Repuesto Electroneumático</option>
                <option value="Gas de Calibración" className="bg-[var(--md-sys-color-surface)]">Gas Patrón de Calibración</option>
              </select>
            </div>
          </div>

          <Input 
            label="Nombre Descriptivo *"
            placeholder="Ej: Filtro Microstream FilterLine H Set Adulto"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
          />

          <Input 
            label="Descripción Funcional"
            placeholder="Línea de muestreo con trampa de condensación y filtro hidrofóbico 0.2 µm"
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Número de Lote"
              placeholder="Ej: LOT-2026-904"
              value={formData.numero_lote}
              onChange={(e) => setFormData({...formData, numero_lote: e.target.value})}
            />
            <Input 
              label="Registro INVIMA"
              placeholder="INVIMA 2018DM-0018991"
              value={formData.registro_invima}
              onChange={(e) => setFormData({...formData, registro_invima: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Stock Inicial"
              type="number"
              value={formData.stock_actual}
              onChange={(e) => setFormData({...formData, stock_actual: Number(e.target.value)})}
            />
            <Input 
              label="Stock Mínimo"
              type="number"
              value={formData.stock_minimo}
              onChange={(e) => setFormData({...formData, stock_minimo: Number(e.target.value)})}
            />
            <Input 
              label="Unidad Medida"
              value={formData.unidad_medida}
              onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
            />
          </div>

          <Input 
            label="Ubicación Física en Almacén"
            value={formData.ubicacion_almacen}
            onChange={(e) => setFormData({...formData, ubicacion_almacen: e.target.value})}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/40">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar en Inventario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
