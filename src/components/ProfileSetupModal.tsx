'use client';

import { Activity } from 'lucide-react';
import ProfileForm from './ProfileForm';
import type { UserProfile } from '@/lib/types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function ProfileSetupModal({ onComplete }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 pt-12 pb-8 flex flex-col gap-6">

          {/* Logo / Icon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Activity size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Bienvenido</h1>
              <p className="text-sm text-secondary mt-1">
                Cuéntanos un poco sobre ti para personalizar<br />tus métricas de salud.
              </p>
            </div>
          </div>

          {/* Why this matters */}
          <div className="bg-surface/60 border border-border rounded-2xl px-4 py-3 flex gap-3">
            <span className="text-lg">📊</span>
            <p className="text-xs text-secondary leading-relaxed">
              Tu edad y nivel de actividad cambian lo que es &quot;normal&quot; para tu HRV, frecuencia cardíaca y sueño.
              Un HRV de 45ms puede ser excelente para alguien de 50 años, pero bajo para un atleta de 25.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <ProfileForm
              onSave={onComplete}
              ctaLabel="Comenzar →"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
