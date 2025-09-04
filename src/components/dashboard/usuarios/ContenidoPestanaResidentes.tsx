import React from 'react';
import { Usuario } from '@/lib/firebase/firestore';
import TablaUsuarios from './TablaUsuarios';

interface ContenidoPestanaResidentesProps {
  usuarios: Usuario[];
  isLoading: boolean;
  onVerDetalles: (usuario: Usuario) => void;
  onEditarUsuario: (usuario: Usuario) => void;
  onEliminarUsuario: (usuario: Usuario) => void;
  onEliminarMultiplesUsuarios?: (usuarios: Usuario[]) => void;
  actualizacionEnTiempoReal: boolean;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  getResidencialNombre: (id: string) => string;
  getEstadoBadge: (estado: Usuario['status']) => React.ReactNode;
  titulo: string;
  renderPagination?: () => React.ReactNode;
  filterCalle?: string;
  onFilterCalleChange?: (value: string) => void;
  mostrarColumnaMoroso?: boolean;
  onCambiarEstadoMoroso?: (usuarioId: string, nuevoEstado: boolean) => void;
  totalUsuarios?: number;
}

const ContenidoPestanaResidentes: React.FC<ContenidoPestanaResidentesProps> = ({
  usuarios,
  isLoading,
  onVerDetalles,
  onEditarUsuario,
  onEliminarUsuario,
  onEliminarMultiplesUsuarios,
  actualizacionEnTiempoReal,
  getRolBadge,
  getResidencialNombre,
  getEstadoBadge,
  titulo,
  renderPagination,
  filterCalle,
  onFilterCalleChange,
  mostrarColumnaMoroso = false,
  onCambiarEstadoMoroso,
  totalUsuarios
}) => {
  return (
    <>
      <TablaUsuarios
        usuarios={usuarios}
        titulo={titulo}
        isLoading={isLoading}
        onVerDetalles={onVerDetalles}
        onEditarUsuario={onEditarUsuario}
        onEliminarUsuario={onEliminarUsuario}
        onEliminarMultiplesUsuarios={onEliminarMultiplesUsuarios}
        actualizacionEnTiempoReal={actualizacionEnTiempoReal}
        getRolBadge={getRolBadge}
        getResidencialNombre={getResidencialNombre}
        getEstadoBadge={getEstadoBadge}
        disableInternalPagination={true}
        filterCalle={filterCalle}
        onFilterCalleChange={onFilterCalleChange}
        mostrarColumnaMoroso={true}
        onCambiarEstadoMoroso={onCambiarEstadoMoroso}
        totalUsuarios={totalUsuarios}
        tipoVista="residentes"
      />
      {renderPagination && renderPagination()}
    </>
  );
};

export default ContenidoPestanaResidentes; 