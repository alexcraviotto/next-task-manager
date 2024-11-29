/* eslint-disable */
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;
const execAsync = promisify(exec);

class DeploymentVerifier {
  constructor(config = {}) {
    this.config = {
      commitMessage: config.commitMessage || "feat: deploy done",
      deployCommand: config.deployCommand || "git push origin main",
      maxDeployTime: config.maxDeployTime || 300000,
    };
  }

  async verifyDeployment() {
    try {
      // Al hacer commit se ejecutan las pruebas apis que determinan si el deploy sería estable
      await this.gitAddAndCommit();

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

      console.log("¡Deploy completado exitosamente!");
      return true;
    } catch (error) {
      console.error("Error durante el proceso:", error.message);
      throw error;
    }
  }

  async gitAddAndCommit() {
    try {
      console.log("Ejecutando git add...");
      await execAsync("git add .");

      console.log("Realizando commit...");
      await execAsync(`git commit -m "${this.config.commitMessage}"`);

      return true;
    } catch (error) {
      throw new Error(`Error durante git add/commit: ${error.message}`);
    }
  }
}

// Ejemplo de uso
async function main() {
  const verifier = new DeploymentVerifier({
    commitMessage: "feat: deploy done (2)",
    deployCommand: "git push origin feat/no-ref/luis-tests",
  });

  try {
    await verifier.verifyDeployment();
    console.log("Deploy completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("Deploy fallido:", error.message);
    process.exit(1);
  }
}

main();
