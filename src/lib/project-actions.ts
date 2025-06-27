
'use server';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CiCdConfig } from '@/types';

interface ConfigData extends CiCdConfig {
  pat: string;
}

/**
 * Saves the CI/CD configuration for a project.
 * IMPORTANT: This is a server-side action. In a real production environment,
 * the Personal Access Token (PAT) would be encrypted and stored in a secure
 * secret manager (like Google Cloud Secret Manager), not passed around.
 * This simulation demonstrates the principle of not storing secrets in Firestore.
 *
 * @param userId - The ID of the user who owns the project.
 * @param projectId - The ID of the project to update.
 * @param data - The configuration data from the form.
 */
export async function saveProjectConfiguration(
  userId: string,
  projectId: string,
  data: ConfigData
): Promise<{ success: boolean; message: string }> {
  if (!userId || !projectId) {
    return { success: false, message: 'User or Project ID is missing.' };
  }

  try {
    const { pat, ...ciCdConfig } = data;

    // --- SECRET HANDLING SIMULATION ---
    // In a real app, you would add the PAT to Google Cloud Secret Manager here.
    // e.g., await secretManager.addSecretVersion({ parent: secretName, payload: { data: Buffer.from(pat, 'UTF-8') } });
    console.log(`[Server Action] Received PAT for project ${projectId}. Simulating storage in a secure secret manager.`);
    // The PAT is now intentionally discarded and not stored in Firestore.
    // --- END SIMULATION ---

    const projectDocRef = doc(db, 'users', userId, 'projects', projectId);

    await updateDoc(projectDocRef, {
      ciCdConfig,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Configuration saved successfully. The PAT was handled securely and not stored.' };
  } catch (error: any) {
    console.error("Error saving project configuration:", error);
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
