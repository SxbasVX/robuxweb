import { getSupabase } from './supabaseClient';

export interface StudentData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  google_drive?: string;
  youtube?: string;
}

export const studentStorage = {
  async getAllStudents(): Promise<StudentData[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    
    return data || [];
  },

  async getStudentById(id: string): Promise<StudentData | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching student:', error);
      return null;
    }
    
    return data;
  },

  async createStudent(studentData: Partial<StudentData>): Promise<StudentData | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating student:', error);
      return null;
    }
    
    return data;
  },

  async updateStudent(id: string, updates: Partial<StudentData>): Promise<StudentData | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating student:', error);
      return null;
    }
    
    return data;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      return false;
    }
    
    return true;
  },

  async searchStudents(query: string): Promise<StudentData[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching students:', error);
      return [];
    }
    
    return data || [];
  }
};