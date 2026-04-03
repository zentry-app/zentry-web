// Archivo index.ts que exporta todos los servicios disponibles
import { AuthService } from './auth-service';
import { AuthorizationService } from './authorization-service';
import AdminService from './admin-service';
import ResidentialService from './residential-service';
import ResidencialService from './residencial-service';
import UserService from './user-service';
import { TopicSubscriptionService } from './topic-subscription-service';
import DashboardService from './dashboard-service';

export { AuthService };
export { UserService };
export { AuthorizationService };
export { ResidencialService };
export { ResidentialService };
export { AdminService };
export { TopicSubscriptionService };
export { DashboardService };

// Re-exportamos todos los servicios como un objeto para facilitar las importaciones
const Services = {
  AuthService,
  UserService,
  AuthorizationService,
  ResidencialService,
  ResidentialService,
  AdminService,
  TopicSubscriptionService,
  DashboardService
};

export default Services; 