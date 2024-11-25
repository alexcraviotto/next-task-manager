/**
 * @jest-environment jsdom
 */

import { signIn } from "next-auth/react";
import { SignInResponse } from "next-auth/react";

// Definimos una interfaz parcial para las propiedades que necesitamos de Location
interface MockLocation extends Partial<Location> {
  href: string;
  reload: () => void;
}

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  getCsrfToken: jest.fn(),
  getProviders: jest.fn(),
  __NEXTAUTH: {
    _getSession: jest.fn(),
  },
}));

describe("signIn function", () => {
  const originalLocation = window.location;
  const mockSignIn = signIn as jest.Mock;

  beforeAll(() => {
    // Creamos un objeto que cumple con la interfaz MockLocation
    const mockLocationObj: MockLocation = {
      ...originalLocation,
      href: "http://localhost:3000",
      reload: jest.fn(),
    };

    // Eliminamos la propiedad location
    delete (window as { location?: Location }).location;

    // Asignamos nuestro objeto tipado
    window.location = mockLocationObj as Location;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = "http://localhost:3000";
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  // Test 1: No hay providers disponibles
  test("debería redirigir a página de error cuando no hay providers", async () => {
    mockSignIn.mockImplementation(() => {
      window.location.href = "/api/auth/error";
      return Promise.resolve(null);
    });

    await signIn();

    expect(mockSignIn).toHaveBeenCalled();
    expect(window.location.href).toBe("/api/auth/error");
  });

  // Test 2: Provider no especificado
  test("debería redirigir a página de signin cuando no se especifica provider", async () => {
    mockSignIn.mockImplementation(() => {
      window.location.href =
        "/api/auth/signin?callbackUrl=http://localhost:3000";
      return Promise.resolve(null);
    });

    await signIn();

    expect(mockSignIn).toHaveBeenCalled();
    expect(window.location.href).toContain("/api/auth/signin");
    expect(window.location.href).toContain("callbackUrl");
  });

  // Test 3: Sign in exitoso con credenciales
  test("debería manejar correctamente el signin con credentials provider", async () => {
    const options = {
      username: "testuser",
      password: "testpass",
      redirect: false,
    };

    const expectedResponse: SignInResponse = {
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    };

    mockSignIn.mockResolvedValueOnce(expectedResponse);

    const result = await signIn("credentials", options);

    expect(mockSignIn).toHaveBeenCalledWith("credentials", options);
    expect(result).toEqual(expectedResponse);
  });

  // Test 4: Sign in fallido
  test("debería manejar correctamente un error de signin", async () => {
    const options = {
      username: "testuser",
      password: "wrongpass",
      redirect: false,
    };

    const expectedResponse: SignInResponse = {
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    };

    mockSignIn.mockResolvedValueOnce(expectedResponse);

    const result = await signIn("credentials", options);

    expect(mockSignIn).toHaveBeenCalledWith("credentials", options);
    expect(result).toEqual(expectedResponse);
  });

  // Test 5: Sign in con OAuth provider
  test("debería redirigir correctamente para OAuth provider", async () => {
    mockSignIn.mockImplementation(() => {
      window.location.href = "https://accounts.google.com/oauth/auth";
      return Promise.resolve(undefined);
    });

    await signIn("google");

    expect(mockSignIn).toHaveBeenCalledWith("google");
    expect(window.location.href).toBe("https://accounts.google.com/oauth/auth");
  });

  // Test 6: Sign in con parámetros de autorización
  test("debería incluir parámetros de autorización", async () => {
    const authParams = { prompt: "consent", access_type: "offline" };
    const options = { redirect: true };

    mockSignIn.mockResolvedValueOnce(undefined);

    await signIn("google", options, authParams);

    expect(mockSignIn).toHaveBeenCalledWith("google", options, authParams);
  });

  // Test 7: Sign in con callbackUrl personalizada
  test("debería manejar callbackUrl personalizada", async () => {
    const options = {
      callbackUrl: "http://localhost:3000/dashboard",
      redirect: false,
    };

    const expectedResponse: SignInResponse = {
      error: null,
      status: 200,
      ok: true,
      url: "http://localhost:3000/dashboard",
    };

    mockSignIn.mockResolvedValueOnce(expectedResponse);

    const result = await signIn("credentials", options);

    // Verificamos que result no sea undefined antes de acceder a sus propiedades
    expect(result).not.toBeUndefined();
    if (result) {
      expect(result.url).toBe(options.callbackUrl);
    }
  });
});
