import { SetMetadata } from "@nestjs/common";

export type Rol = "ADMIN" | "OPERADOR";

export const ROLES_KEY = "roles";
export const PUBLICO_KEY = "publico";

/** Restringe la ruta a los roles indicados. Sin este decorador basta con estar autenticado. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

/** La ruta no exige sesión (solo el login). */
export const Publico = () => SetMetadata(PUBLICO_KEY, true);
