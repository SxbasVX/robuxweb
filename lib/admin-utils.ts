// Utilidad para restaurar roles de administrador
// Este archivo contiene funciones para gestionar roles de usuario

import { getSupabase } from './supabaseClient';

export async function restoreAdminRole(userId: string, email: string) {
  const supabase = getSupabase();
  
  try {
    // Intentar actualizar el usuario existente
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        role: 'admin'
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error restaurando rol de admin:', error);
      return { success: false, error: error.message };
    }

    console.log('Rol de administrador restaurado exitosamente:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function verifyAdminRole(userId: string) {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error verificando rol:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function setUserRole(userId: string, email: string, role: 'usuario' | 'delegado' | 'admin', group?: number) {
  const supabase = getSupabase();
  
  try {
    const userData: any = {
      id: userId,
      email: email,
      role: role
    };

    if (group) {
      userData.group = group;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error estableciendo rol:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}