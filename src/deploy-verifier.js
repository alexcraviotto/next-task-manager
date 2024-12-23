const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;
const execAsync = promisify(exec);

class DeploymentVerifier {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || "http://localhost:3001",
      apiFolder: config.apiFolder || "src/app/api",
      deployCommand: config.deployCommand || "git push origin main",
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      maxDeployTime: config.maxDeployTime || 300000,
    };
    this.criticalPaths = [];
  }

  async findRouteFiles(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    let routes = [];

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        routes = routes.concat(await this.findRouteFiles(fullPath));
      } else if (
        file.name === "route.ts" &&
        fullPath.includes(this.config.apiFolder)
      ) {
        const apiPath = fullPath
          .replace(this.config.apiFolder, "")
          .replace("/route.ts", "")
          .replace(/\[([^\]]+)\]/g, ":$1");

        routes.push(apiPath || "/");
      }
    }

    return routes;
  }

  async initialize() {
    try {
      this.criticalPaths = await this.findRouteFiles(this.config.apiFolder);
      console.log("Rutas críticas detectadas:", this.criticalPaths);
    } catch (error) {
      throw new Error(`Error al detectar rutas: ${error.message}`);
    }
  }

  async getCurrentCommit() {
    const { stdout } = await execAsync("git rev-parse HEAD");
    return stdout.trim();
  }

  async performRollback(previousCommit) {
    console.log("Iniciando rollback al commit:", previousCommit);
    try {
      await execAsync(`git reset --hard ${previousCommit}`);
      await execAsync("git push --force");
      console.log("Rollback completado exitosamente");
    } catch (error) {
      throw new Error(`Error durante rollback: ${error.message}`);
    }
  }

  async checkEndpoint(path) {
    const testPath = path.replace(/:[^/]+/g, "test");

    try {
      const response = await axios.get(`${this.config.baseUrl}${testPath}`);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error(`Error checking ${testPath}:`, error.message);
      return false;
    }
  }

  async performHealthCheck() {
    console.log("Realizando verificación de salud...");

    for (const path of this.criticalPaths) {
      let attempts = 0;
      let success = false;

      while (attempts < this.config.retryAttempts && !success) {
        success = await this.checkEndpoint(path);
        if (!success) {
          console.log(`Intento ${attempts + 1} fallido para ${path}`);
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay),
          );
        }
        attempts++;
      }

      if (!success) {
        throw new Error(
          `La ruta ${path} no está respondiendo después de ${attempts} intentos`,
        );
      }
    }

    console.log("Verificación de salud completada exitosamente");
    return true;
  }

  async verifyDeployment() {
    let previousCommit;

    try {
      console.log("Verificando estado inicial del sistema...");
      await this.performHealthCheck();

      console.log("Guardando estado actual...");
      previousCommit = await this.getCurrentCommit();

      console.log("Iniciando deploy...");
      const deployPromise = execAsync(this.config.deployCommand);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Deploy excedió el tiempo máximo de ${this.config.maxDeployTime / 1000} segundos`,
            ),
          );
        }, this.config.maxDeployTime);
      });

      const { stdout, stderr } = await Promise.race([
        deployPromise,
        timeoutPromise,
      ]);
      console.log("Salida del deploy:", stdout);
      if (stderr) console.error("Errores del deploy:", stderr);

      console.log("Esperando estabilización del sistema...");
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.retryDelay),
      );

      console.log("Realizando verificación final del sistema...");
      await this.performHealthCheck();

      console.log("¡Deploy completado exitosamente!");
      return true;
    } catch (error) {
      console.error("Error durante el proceso:", error.message);

      if (previousCommit) {
        console.log("Iniciando rollback...");
        try {
          await this.performRollback(previousCommit);
          console.log("Sistema restaurado a versión estable anterior");
        } catch (rollbackError) {
          throw new Error(
            `Deploy falló y rollback también falló: ${rollbackError.message}`,
          );
        }
      }

      throw error;
    }
  }
}

// Ejemplo de uso
async function main() {
  const verifier = new DeploymentVerifier({
    baseUrl: "http://localhost:3001",
    apiFolder: "src/app/api",
  });

  try {
    await verifier.initialize();
    await verifier.verifyDeployment();
    console.log("Deploy completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("Deploy fallido:", error.message);
    process.exit(1);
  }
}

main();
