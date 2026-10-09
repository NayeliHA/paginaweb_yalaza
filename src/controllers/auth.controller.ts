import type { LoginInput, RegisterCustomerInput } from "@/models";
import { authFacade } from "@/services/auth.service";
import {
  getAuthSnapshot,
  getServerAuthSnapshot,
  subscribeToAuthState,
} from "@/services/auth-state.service";

export class AuthController {
  getAuthState = getAuthSnapshot;
  getServerAuthState = getServerAuthSnapshot;
  subscribeToAuthState = subscribeToAuthState;

  registerCustomer(input: RegisterCustomerInput) {
    return authFacade.registerCustomer(input);
  }

  login(input: LoginInput) {
    return authFacade.login(input);
  }

  logout() {
    authFacade.logout();
  }
}

export const authController = new AuthController();
