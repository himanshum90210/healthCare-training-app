import { MongoUserRepository } from "./repositories/mongodb/MongoUserRepository";
import { MongoRefreshTokenRepository } from "./repositories/mongodb/MongoRefreshTokenRepository";
import { TokenService } from "./services/TokenService";
import { AuthService } from "./services/AuthService";
import { AuthController } from "./controllers/AuthController";
import {createAuthenticate} from "./middleware/authenticate";
import { MongoDoctorRepository } from "./repositories/mongodb/MongoDoctorRepository";
import { DoctorService } from "./services/DoctorService";
import { DoctorController } from "./controllers/DoctorController";

const userRepository = new MongoUserRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();

export const tokenService = new TokenService(); 
const authService = new AuthService(userRepository, refreshTokenRepository, tokenService);

export const authController = new AuthController(authService);

export const authenticate = createAuthenticate(tokenService);

const doctorRepository = new MongoDoctorRepository();
const doctorService = new DoctorService(doctorRepository);
export const doctorController = new DoctorController(doctorService);