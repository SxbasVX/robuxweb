import RoleGuard from '../../components/RoleGuard';
import AutoBackupSystem from '../../components/AutoBackupSystem';
import dynamic from 'next/dynamic';
const AdminPanel = dynamic(() => import('../../components/AdminPanel'), { ssr: false });

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="space-y-6">
        <div className="glass p-6 rounded-2xl">
          <h1 className="text-2xl font-semibold">Panel de administrador</h1>
          <p className="text-gray-400">Gestiona usuarios, seguridad, backups y monitoreo del sistema.</p>
        </div>
        
        {/* Panel principal con todas las funcionalidades */}
        <AdminPanel />
        
        {/* Sistema de backup automático independiente */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">🔄 Backup Automático</h2>
          <AutoBackupSystem />
        </div>
      </div>
    </RoleGuard>
  );
}
