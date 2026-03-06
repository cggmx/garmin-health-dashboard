'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Trash2, ChevronRight } from 'lucide-react';
import { useProfile } from '@/lib/useProfile';
import ProfileForm from '@/components/ProfileForm';
import BottomNav from '@/components/BottomNav';
import type { UserProfile } from '@/lib/types';

const FITNESS_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  athlete: 'Atleta',
};

const GOAL_LABEL: Record<string, string> = {
  recovery: 'Recuperación',
  performance: 'Rendimiento',
  weight_loss: 'Pérdida de peso',
  general_health: 'Salud general',
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, saveProfile, clearProfile, loaded } = useProfile();

  if (!loaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  const handleSave = (p: UserProfile) => {
    saveProfile(p);
    router.push('/');
  };

  const handleClear = () => {
    if (confirm('¿Eliminar tu perfil? Se borrarán todos tus datos locales.')) {
      clearProfile();
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <User size={16} className="text-secondary" />
          <h1 className="text-sm font-bold text-primary">Mi perfil</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">

        {/* Summary card if profile exists */}
        {profile && (
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">
                {profile.name ?? (profile.sex === 'male' ? 'Hombre' : 'Mujer')}, {profile.age} años
              </p>
              <p className="text-xs text-secondary">
                {FITNESS_LABEL[profile.fitnessLevel]} · {GOAL_LABEL[profile.goal]}
              </p>
            </div>
            <ChevronRight size={16} className="text-muted flex-shrink-0" />
          </div>
        )}

        {/* Form */}
        <div className="card">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
            {profile ? 'Actualizar perfil' : 'Crear perfil'}
          </h2>
          <ProfileForm
            initial={profile ?? undefined}
            onSave={handleSave}
            ctaLabel={profile ? 'Actualizar perfil' : 'Guardar perfil'}
          />
        </div>

        {/* Danger zone */}
        {profile && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-xs text-muted hover:text-recovery-red transition-colors mx-auto py-2"
          >
            <Trash2 size={13} />
            Eliminar perfil
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
