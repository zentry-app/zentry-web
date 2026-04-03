// Este servicio hace llamadas HTTP a las API routes del servidor
import { getAuth } from 'firebase/auth';

export interface Survey {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  fechaFin: string;
  status: 'pending' | 'concluida';
  totalRespuestas: number;
  preguntas: Array<{
    pregunta: string;
    tipo: string;
    opciones?: string[];
    minValue?: number;
    maxValue?: number;
    escalaMax?: number;
  }>;
  creadorUid: string;
  residencialId: string;
  residencialDocId: string;
}

export interface SurveyStats {
  totalSurveys: number;
  activeSurveys: number;
  completedSurveys: number;
  totalResponses: number;
}

export interface CreateSurveyData {
  titulo: string;
  descripcion: string;
  fechaFin: string;
  preguntas: Array<{
    pregunta: string;
    tipo: string;
    opciones?: string[];
    minValue?: number;
    maxValue?: number;
    escalaMax?: number;
  }>;
  residencialId: string;
  creadorUid: string;
}

export interface SurveyResponse {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  submittedAt: any;
  answers: any[];
}

export interface SurveyResults {
  survey: Survey;
  responses: SurveyResponse[];
  stats: {
    totalResponses: number;
    responseRate: number;
    questionResults: Array<{
      questionIndex: number;
      question: string;
      type: string;
      results: any;
    }>;
  };
}

export class SurveyService {
  /**
   * Obtiene el token de autenticación del usuario actual
   */
  private static async getAuthToken(): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await user.getIdToken();
  }

  /**
   * Obtiene todas las encuestas de todos los residenciales
   */
  static async getAllSurveys(): Promise<{ surveys: Survey[]; stats: SurveyStats }> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch('/api/surveys/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener las encuestas');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting all surveys:', error);
      throw new Error('Error al obtener las encuestas');
    }
  }

  /**
   * Obtiene las encuestas de un residencial específico
   */
  static async getSurveysByResidencial(residencialDocId: string): Promise<Survey[]> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`/api/surveys/list?residencialId=${residencialDocId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener las encuestas del residencial');
      }
      const data = await response.json();
      return data.surveys;
    } catch (error) {
      console.error('Error getting surveys by residencial:', error);
      throw new Error('Error al obtener las encuestas del residencial');
    }
  }

  /**
   * Crea una nueva encuesta
   */
  static async createSurvey(surveyData: CreateSurveyData): Promise<string> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch('/api/surveys/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la encuesta');
      }

      const result = await response.json();
      return result.surveyId;
    } catch (error) {
      console.error('Error creating survey:', error);
      throw new Error('Error al crear la encuesta');
    }
  }

  /**
   * Obtiene los resultados detallados de una encuesta
   */
  static async getSurveyResults(surveyId: string, residencialDocId: string): Promise<SurveyResults> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`/api/surveys/results?surveyId=${surveyId}&residencialDocId=${residencialDocId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener los resultados de la encuesta');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting survey results:', error);
      throw new Error('Error al obtener los resultados de la encuesta');
    }
  }


  /**
   * Elimina una encuesta
   */
  static async deleteSurvey(surveyId: string, residencialDocId?: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const url = residencialDocId 
        ? `/api/surveys/delete?surveyId=${surveyId}&residencialDocId=${residencialDocId}`
        : `/api/surveys/delete?surveyId=${surveyId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la encuesta');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw new Error('Error al eliminar la encuesta');
    }
  }

  /**
   * Actualiza el estado de una encuesta
   */
  static async updateSurveyStatus(surveyId: string, status: 'pending' | 'concluida', residencialDocId?: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      const url = residencialDocId 
        ? `/api/surveys/update-status?surveyId=${surveyId}&status=${status}&residencialDocId=${residencialDocId}`
        : `/api/surveys/update-status?surveyId=${surveyId}&status=${status}`;
        
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado de la encuesta');
      }
    } catch (error) {
      console.error('Error updating survey status:', error);
      throw new Error('Error al actualizar el estado de la encuesta');
    }
  }
}
