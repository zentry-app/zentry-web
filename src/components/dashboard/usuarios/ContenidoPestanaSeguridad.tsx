import React from 'react';
import { Usuario } from '@/lib/firebase/firestore';
import TablaUsuarios from './TablaUsuarios';

interface ContenidoPestanaSeguridadProps {
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
}

const ContenidoPestanaSeguridad: React.FC<ContenidoPestanaSeguridadProps> = ({
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
  onFilterCalleChange
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
        tipoVista="seguridad"
      />
      {renderPagination && renderPagination()}
    </>
  );
};

export default ContenidoPestanaSeguridad; 