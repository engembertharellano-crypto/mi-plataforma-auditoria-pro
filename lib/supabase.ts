import { createClient } from '@supabase/supabase-js';

/* 
  INSTRUCCIONES DEFINITIVAS:
  1. Pega tus códigos DENTRO de las comillas simples (' ').
  2. NO borres las comillas.
  
  Así debe verse cuando termines:
  const supabaseUrl = 'https://tu-proyecto.supabase.co';
*/

// Explicitly typing as string to prevent literal narrowing that causes "never" type errors
const supabaseUrl: string = 'https://vejlwtaemtzscsfnmdue.supabase.co'; 
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlamx3dGFlbXR6c2NzZm5tZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTU0NDUsImV4cCI6MjA4NDA3MTQ0NX0.zaLVxUdksaEdkxxjNLu5bEnG5TQOQmdz_F9ewMkq6Fg'; 

// Limpiamos los datos por si pegaste un espacio en blanco sin querer
const urlLimpia = supabaseUrl ? supabaseUrl.trim() : '';
const keyLimpia = supabaseAnonKey ? supabaseAnonKey.trim() : '';

// Si las comillas siguen vacías, la app mostrará el aviso de ayuda.
export const supabase = (urlLimpia && keyLimpia) 
  ? createClient(urlLimpia, keyLimpia) 
  : null;