'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/auth-context';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string;
  emoji: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'scroll';
}

const studentSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a ROBUX! 🎉',
    description: 'Te mostraremos cómo explorar grupos y ver trabajos publicados.',
    target: '.hero-section',
    emoji: '👋',
    position: 'bottom'
  },
  {
    id: 'groups',
    title: 'Accede a tus Grupos',
    description: 'Haz clic en un grupo para ver publicaciones, archivos y comentarios.',
    target: '#grupos',
    emoji: '👥',
    position: 'top',
    action: 'click'
  },
  {
    id: 'navigation',
    title: 'Navegación',
    description: 'Usa el menú superior para volver a inicio o abrir tu perfil.',
    target: '.navbar',
    emoji: '🧭',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: '¡Listo! 🚀',
    description: 'Ya puedes explorar trabajos y participar con comentarios y reacciones.',
    target: '#grupos',
    emoji: '✨',
    position: 'top'
  }
];

const delegateSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido, Delegado 👑',
    description: 'Aprende a publicar para tu grupo y para cada estudiante paso a paso.',
    target: '.hero-section',
    emoji: '🙌',
    position: 'bottom'
  },
  {
    id: 'groups',
    title: 'Entra a tu Grupo',
    description: 'Haz clic en tu grupo para abrir el tablero y ver publicaciones existentes.',
    target: '#grupos',
    emoji: '👥',
    position: 'top',
    action: 'click'
  },
  {
    id: 'post-grupal',
    title: 'Crear publicación grupal',
    description: 'En el tablero pulsa “Nueva publicación”. Escribe título y contenido; usa etiquetas para organizar. Guarda para todo el grupo.',
    target: '.navbar',
    emoji: '📝',
    position: 'bottom'
  },
  {
    id: 'post-alumno',
    title: 'Publicación por estudiante',
    description: 'En el editor selecciona al estudiante y activa “Por estudiante” para dirigir el post solo a esa persona.',
    target: '.navbar',
    emoji: '🎓',
    position: 'bottom'
  },
  {
    id: 'files',
    title: 'Adjuntar archivos',
    description: 'Usa “Adjuntar archivo” para subir documentos, imágenes o PDFs (arrastra y suelta o selecciona desde tu equipo).',
    target: '.navbar',
    emoji: '📎',
    position: 'bottom'
  },
  {
    id: 'publish',
    title: 'Publicar y moderar',
    description: 'Revisa la vista previa y pulsa “Publicar”. Luego podrás editar, eliminar y moderar comentarios desde el listado.',
    target: '.navbar',
    emoji: '�',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: '¡Todo listo! ✨',
    description: 'Tu grupo y estudiantes ya pueden ver y participar en las publicaciones.',
    target: '.navbar',
    emoji: '✨',
    position: 'bottom'
  }
];

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ isVisible, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user, role } = useAuth();
  const [mounted, setMounted] = useState(false);

  const steps = useMemo(
    () => (role === 'delegado' || role === 'admin') ? delegateSteps : studentSteps,
    [role]
  );

  useEffect(() => {
    setMounted(true);
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 120);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 120);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  const completeTutorial = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    onClose();
  };

  const goToStep = (stepIndex: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 120);
  };

  if (!isVisible || !mounted) return null;

  const step = steps[currentStep];

  return createPortal(
    <>
      {/* Overlay oscuro con desenfoque */}
      <div
        className="fixed inset-0 animate-fade-soft-lg backdrop-veil"
        style={{ zIndex: 99990 }}
        onClick={skipTutorial}
      />

      {/* Tooltip del tutorial (glass, rounded) */}
      <div className="fixed animate-fade-soft-lg" style={{ zIndex: 99991 }}>
        <div
          className={`max-w-md mx-4 p-6 rounded-2xl shadow-xl border ${isAnimating ? 'animate-pulse-glow' : 'animate-fade-scale-in-lg'}`}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 26, 43, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderColor: 'var(--card-border)',
            zIndex: 99992
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl animate-bounce-subtle">{step.emoji}</span>
              <div className="badge-vibrant">
                Paso {currentStep + 1} de {steps.length}
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className="text-white/70 hover:text-white text-2xl leading-none"
              title="Saltar tutorial"
            >
              ×
            </button>
          </div>

          {/* Contenido */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              {step.title}
            </h3>
            <p className="text-white/90 leading-relaxed text-lg">
              {step.description}
            </p>
            
            {step.action && (
              <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-sm text-white/80">
                  💡 <strong>Consejo:</strong> {
                    step.action === 'click' ? 'Haz clic en el elemento resaltado' :
                    step.action === 'hover' ? 'Pasa el mouse sobre el elemento' :
                    'Desplázate para ver más contenido'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Indicadores de progreso */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-white scale-125' 
                    : index < currentStep 
                      ? 'bg-white/60' 
                      : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Controles */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl border border-white/20 text-white/90 hover:text-white hover:bg-white/10 transition ${
                currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              ← Anterior
            </button>

            {currentStep === steps.length - 1 ? (
              <button onClick={completeTutorial} className="px-8 py-3 rounded-xl bg-indigo-500/80 hover:bg-indigo-400 text-white font-semibold shadow-lg">
                ¡Empezar! 🚀
              </button>
            ) : (
              <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-indigo-500/80 hover:bg-indigo-400 text-white font-semibold">
                Siguiente →
              </button>
            )}
          </div>

          {/* Usuario personalizado */}
          {user && (
            <div className="mt-6 text-center">
              <p className="text-sm text-white/70">
                ¡Hola <span className="text-white font-semibold">{user.email}</span>! 👋
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nota: removimos el highlighting directo para evitar superposiciones raras */}
    </>,
    document.body
  );
}