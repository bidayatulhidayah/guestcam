import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { EMULATOR_HOST, EMULATOR_PORTS, USE_EMULATORS, getFirebaseApp } from './app';
import { ensureAnonymousUser } from './auth';

/** Same region as the functions (asia-southeast1). */
const REGION = 'asia-southeast1';

let functions: Functions | undefined;

function getFns(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), REGION);
    if (USE_EMULATORS) connectFunctionsEmulator(functions, EMULATOR_HOST, EMULATOR_PORTS.functions);
  }
  return functions;
}

/** Calls a callable function as the anonymous guest (signs in first if needed). */
export async function callFunction<Request, Response>(name: string, data: Request): Promise<Response> {
  await ensureAnonymousUser();
  const result = await httpsCallable<Request, Response>(getFns(), name)(data);
  return result.data;
}
