import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rruzeeyduebypodlceii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydXplZXlkdWVieXBvZGxjZWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODk1NzQsImV4cCI6MjA2MTA2NTU3NH0.8IGU5Wtj614Hib_vZww05bOrilXwI90-ttGkQnJq-5o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🧠 Fonctions utiles

// Auth: Inscription
export async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    });
    return { data, error };
}
  
// Auth: Connexion
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
}
  
// Auth: Déconnexion
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    // Also clear custom token logic if any (to be added in AuthProvider)
    return { error };
}
  
// Auth: Utilisateur courant (Supabase Auth)
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user, error };
}
  
// Data: Récupérer les grands objectifs d'un utilisateur spécifique
export async function getGrandsObjectifs(userId: string) {
    if (!userId) {
        console.error('User ID is required to fetch grands objectifs');
        return { data: null, error: { message: 'User ID manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('grands_objectifs')
        .select('*')
        .eq('uid', userId);
    
    if (error) {
        console.error('Error fetching grands objectifs:', error);
        return { data: null, error };
    }
    
    return { data, error: null };
}
  
// Data: Récupérer les mini objectifs liés à un grand objectif
export async function getMiniObjectifs(grandObjectifId: string) {
    if (!grandObjectifId) {
        console.error('Grand Objectif ID is required to fetch mini objectifs');
        return { data: null, error: { message: 'Grand Objectif ID manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('mini_objectifs')
        .select('*')
        .eq('objectif_id', grandObjectifId); // Filtrer par l'ID du grand objectif

    if (error) {
        console.error('Error fetching mini objectifs:', error);
        return { data: null, error };
    }

    return { data, error: null };
}
  
// Data: Mettre à jour le statut d'un grand objectif
export async function updateGrandObjectifStatus(objectifId: string, newStatus: string) {
    if (!objectifId || !newStatus) {
        console.error('Objectif ID and new status are required');
        return { data: null, error: { message: 'ID ou statut manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('grands_objectifs')
        .update({ 
            statut: newStatus, 
            updated_at: new Date().toISOString() // Mettre à jour la date de modification
        })
        .eq('id', objectifId)
        .select() // Optionnel: retourner la ligne mise à jour
        .single(); // S'attendre à une seule ligne

    if (error) {
        console.error('Error updating objectif status:', error);
    }
    
    return { data, error };
}
  
// Data: Mettre à jour le statut d'un mini objectif
export async function updateMiniObjectifStatus(miniObjectifId: string, newStatus: string) {
    if (!miniObjectifId || !newStatus) {
        console.error('Mini Objectif ID and new status are required');
        return { data: null, error: { message: 'Mini Objectif ID ou statut manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('mini_objectifs') // Utiliser la table mini_objectifs
        .update({ 
            statut: newStatus, 
            updated_at: new Date().toISOString()
        })
        .eq('id', miniObjectifId) // Filtrer par l'ID du mini objectif
        .select()
        .single();

    if (error) {
        console.error('Error updating mini objectif status:', error);
    }
    
    return { data, error };
}
  
// Auth: Réinitialisation de mot de passe
export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // Optionnel: Spécifier l'URL de redirection après clic sur le lien dans l'email
        // redirectTo: 'https://votre-app.com/auth/update-password', 
    });

    // IMPORTANT: Ne pas révéler si l'email existe ou non pour des raisons de sécurité.
    // On retourne succès même si l'email n'est pas trouvé.
    if (error && error.message !== "User not found") { // Gérer les vraies erreurs
        console.error('Error sending password reset email:', error);
        return { error };
    }

    return { data: null, error: null }; // Succès (ou email non trouvé)
}
  
// Data: Récupérer tous les cours
export async function getCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true }); // Trier par date de création par défaut

    if (error) {
        console.error('Error fetching courses:', error);
        return { data: null, error };
    }
    return { data, error: null };
}
  
// Data: Récupérer les chapitres d'un cours spécifique
export async function getChapters(courseId: string) {
    if (!courseId) {
        console.error('Course ID is required to fetch chapters');
        return { data: null, error: { message: 'Course ID manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true }); // Trier par order_index

    if (error) {
        console.error('Error fetching chapters:', error);
        return { data: null, error };
    }
    return { data, error: null };
}
  
// Data: Récupérer les détails d'un cours spécifique par ID
export async function getCourseById(courseId: string) {
    if (!courseId) {
        console.error('Course ID is required to fetch course details');
        return { data: null, error: { message: 'Course ID manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single(); // S'attendre à un seul résultat

    if (error) {
        console.error('Error fetching course details:', error);
        return { data: null, error };
    }
    return { data, error: null };
}
  
// Data: Récupérer TOUS les quiz d'un chapitre spécifique
export async function getQuizForChapter(chapterId: string) {
    if (!chapterId) {
        console.error('Chapter ID is required to fetch quiz');
        return { data: null, error: { message: 'Chapter ID manquant', details: '', hint: '', code: '' } };
    }

    // Récupérer TOUTES les questions pour ce chapitre, triées par date
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: true }); // Trier pour un ordre cohérent

    if (error) {
        console.error('Error fetching quiz for chapter:', error);
        // Retourner null pour data en cas d'erreur, même si des données partielles existent
        return { data: null, error }; 
    }
    
    // data sera un tableau (potentiellement vide)
    return { data, error }; 
}
  
// User Progress: Marquer un chapitre comme complété
export async function markChapterCompleted(userId: string, chapterId: string, courseId: string) {
    if (!userId || !chapterId || !courseId) {
        console.error('User ID, Chapter ID, and Course ID are required');
        return { data: null, error: { message: 'IDs manquants', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: userId,
            chapter_id: chapterId,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
        }, {
            // En cas de conflit (même user_id et chapter_id), on met juste à jour.
            onConflict: 'user_id, chapter_id', 
        })
        .select() // Retourner l'enregistrement créé/mis à jour
        .single();

    if (error) {
        console.error('Error marking chapter complete:', error);
    }
    
    return { data, error };
}

// User Progress: Récupérer les IDs des chapitres complétés pour un cours
export async function getCompletedChapters(userId: string, courseId: string) {
    if (!userId || !courseId) {
        console.error('User ID and Course ID are required');
        return { data: null, error: { message: 'IDs manquants', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('user_progress')
        .select('chapter_id') // Sélectionner seulement l'ID du chapitre
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

    if (error) {
        console.error('Error fetching completed chapters:', error);
        return { data: null, error };
    }
    
    // Retourner un Set des IDs pour une recherche rapide (O(1))
    const completedChapterIds = new Set(data?.map(item => item.chapter_id) || []);
    return { data: completedChapterIds, error: null };
}
  
// User Progress: Récupérer les IDs des cours commencés par l'utilisateur
export async function getUserStartedCourseIds(userId: string) {
    if (!userId) {
        console.error('User ID is required');
        return { data: null, error: { message: 'User ID manquant', details: '', hint: '', code: '' } };
    }

    // Sélectionner les course_id distincts pour cet utilisateur
    const { data, error } = await supabase
        .from('user_progress')
        .select('course_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user started courses:', error);
        return { data: null, error };
    }

    // Retourner un Set des IDs uniques
    const startedCourseIds = new Set(data?.map(item => item.course_id) || []);
    return { data: startedCourseIds, error: null };
}
  
// Certificates: Récupérer les certificats d'un utilisateur avec le titre du cours
export async function getUserCertificates(userId: string) {
    if (!userId) {
        console.error('User ID is required to fetch certificates');
        return { data: null, error: { message: 'User ID manquant', details: '', hint: '', code: '' } };
    }

    const { data, error } = await supabase
        .from('certificates')
        // Sélectionner toutes les colonnes de certificates ET le titre de la table courses jointe
        .select('*, courses(title)')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false }); // Trier par date d'émission la plus récente

    if (error) {
        console.error('Error fetching user certificates:', error);
        return { data: null, error };
    }

    // Remapper les données pour avoir course_title directement (plus facile à utiliser)
    const formattedData = data?.map(cert => ({
        ...cert,
        // @ts-ignore - Supabase retourne { title: string } mais TypeScript peut ne pas le savoir ici
        course_title: cert.courses?.title || 'Cours inconnu',
        // Supprimer l'objet courses imbriqué si on ne veut que le titre
        courses: undefined, 
    })) || [];

    return { data: formattedData, error: null };
}
  
// ====== NEW WHATSAPP AUTH FUNCTIONS ======

// Check if user exists by phone number, or create one
// auth_token is expected to be generated by the database on insert
export async function upsertUserByPhoneNumber(phoneNumber: string) {
    try {
        // 1. Check if user exists
        let { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, auth_token, is_verified, phone_number, nom, email')
            .eq('phone_number', phoneNumber)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: single row expected, 0 found
            console.error('Error fetching user by phone number:', fetchError);
            return { data: null, error: fetchError };
        }

        if (existingUser) {
            // User exists, return their info
            return { data: existingUser, error: null };
        } else {
            // User does not exist, create them.
            // The database is responsible for generating/assigning the auth_token.
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    phone_number: phoneNumber,
                    is_verified: false, 
                    nom: null
                    // email will be null by default if not specified
                    // Client no longer provides auth_token
                })
                .select('id, auth_token, is_verified, phone_number, nom, email')
                .single();

            if (insertError) {
                console.error('Error creating new user:', insertError);
                return { data: null, error: insertError };
            }
            return { data: newUser, error: null };
        }
    } catch (error) {
        console.error('Unexpected error in upsertUserByPhoneNumber:', error);
        return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
}

// Check if user exists by email, or create one
export async function upsertUserByEmail(email: string) {
    try {
        // 1. Check if user exists
        let { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, auth_token, is_verified, phone_number, nom, email')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: single row expected, 0 found
            console.error('Error fetching user by email:', fetchError);
            return { data: null, error: fetchError };
        }

        if (existingUser) {
            // User exists, return their info
            return { data: existingUser, error: null };
        } else {
            // User does not exist, create them.
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    email: email,
                    is_verified: false,
                })
                .select('id, auth_token, is_verified, phone_number, nom, email')
                .single();

            if (insertError) {
                console.error('Error creating new user via email:', insertError);
                return { data: null, error: insertError };
            }
            return { data: newUser, error: null };
        }
    } catch (error) {
        console.error('Unexpected error in upsertUserByEmail:', error);
        return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
}

// Check a user's verification status and get their auth_token
export async function checkUserVerification(userId: string) {
    if (!userId) {
        console.error('User ID is required to check verification status');
        return { data: null, error: { message: 'User ID manquant' } };
    }
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, auth_token, is_verified, phone_number, nom, email')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user verification status:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error in checkUserVerification:', error);
        return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
}

// ====== END NEW WHATSAPP AUTH FUNCTIONS ======

// NEW FUNCTION to update user profile (nom and email)
export async function updateUserProfile(userId: string, { nom, email }: { nom?: string, email?: string }) {
    if (!userId) {
        console.error('User ID is required to update profile');
        // Ensure the error object structure is consistent if possible
        return { data: null, error: { message: 'User ID manquant', code: 'MISSING_USER_ID', details: '', hint: '' } };
    }

    const updates: { nom?: string, email?: string, updated_at: string } = { updated_at: new Date().toISOString() };
    let hasUpdates = false;

    if (nom !== undefined) {
        updates.nom = nom;
        hasUpdates = true;
    }
    if (email !== undefined) {
        updates.email = email;
        hasUpdates = true;
    }

    if (!hasUpdates) {
        console.log('No profile data to update for user:', userId);
        // Fetch and return current user data as no update is performed
        const { data: existingData, error: fetchError } = await supabase
            .from('users')
            .select('id, auth_token, is_verified, phone_number, nom, email')
            .eq('id', userId)
            .single();
        return { data: existingData, error: fetchError };
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, auth_token, is_verified, phone_number, nom, email') // return updated user
        .single();

    if (error) {
        console.error('Error updating user profile:', error);
    }
    
    return { data, error };
}

// Set a user's status to verified
export async function setUserVerified(userId: string) {
    if (!userId) {
        console.error('User ID is required to verify user');
        return { data: null, error: { message: 'User ID manquant' } };
    }
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error setting user as verified:', error);
        }
        return { data, error };
    } catch (error) {
        console.error('Unexpected error in setUserVerified:', error);
        return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
}
  