import { MongoUserRepository } from "./repositories/mongodb/MongoUserRepository";
import { MongoRefreshTokenRepository } from "./repositories/mongodb/MongoRefreshTokenRepository";
import { TokenService } from "./services/TokenService";
import { AuthService } from "./services/AuthService";
import { AuthController } from "./controllers/AuthController";
import {createAuthenticate} from "./middleware/authenticate";
import { MongoDoctorRepository } from "./repositories/mongodb/MongoDoctorRepository";
import { DoctorService } from "./services/DoctorService";
import { DoctorController } from "./controllers/DoctorController";
import { MongoAppointmentRepository } from "./repositories/mongodb/MongoAppointmentRepository";
import { AvailabilityService } from "./services/AvailabilityService";
import { AppointmentService } from "./services/AppointmentService";
import { AppointmentController } from "./controllers/AppointmentController";
import { MongoAuditRepository } from "./repositories/mongodb/MongoAuditRepository";
import { AuditService } from "./services/AuditService";
import { AuditController } from "./controllers/AuditController";
import { SocketManager } from "./realtime/SocketManager";
import { MongoNotificationRepository } from "./repositories/mongodb/MongoNotificationRepository";
import { NotificationService } from "./services/NotificationService";
import { NotificationController } from "./controllers/NotificationController";



const auditRepository = new MongoAuditRepository();
const auditService = new AuditService(auditRepository);
export const auditController = new AuditController(auditService);
const userRepository = new MongoUserRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const appointmentRepository = new MongoAppointmentRepository();
const availabilityService = new AvailabilityService(appointmentRepository);




export const tokenService = new TokenService(); 
const authService = new AuthService(userRepository, refreshTokenRepository, tokenService, auditService);

export const authController = new AuthController(authService);

export const authenticate = createAuthenticate(tokenService);

const doctorRepository = new MongoDoctorRepository();
const doctorService = new DoctorService(doctorRepository, availabilityService, auditService);
export const doctorController = new DoctorController(doctorService);
const notificationRepository = new MongoNotificationRepository();
const notificationService = new NotificationService(
  notificationRepository,
  doctorRepository,
  SocketManager.getInstance() // the Singleton, used through the IRealtimePublisher interface
);
export const notificationController = new NotificationController(notificationService);

const appointmentService = new AppointmentService(appointmentRepository,doctorRepository,userRepository,availabilityService, auditService,notificationService)


export const appointmentController = new AppointmentController(appointmentService)

new AuthService(userRepository, refreshTokenRepository, tokenService, auditService)
new DoctorService(doctorRepository, availabilityService, auditService)
new AppointmentService(appointmentRepository, doctorRepository, userRepository, availabilityService, auditService,notificationService)